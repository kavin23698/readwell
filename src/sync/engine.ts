// Sync engine: push dirty local rows to Supabase, then pull rows changed on the server since the
// last pull. Conflicts: the most recent updated_at wins (enforced locally here and on the server by
// the rw_before_write trigger). Deletes are soft (deleted_at), so they sync like any other change.
import type { SQLiteBindValue } from 'expo-sqlite';
import { db, fromSqlite, notify, setLocalWriteHook } from '@/db';
import { syncOrder, tables, type ColumnKind, type TableName } from '@/db/schema';
import { supabase } from '@/lib/supabase';

const PUSH_BATCH = 100;
const PULL_PAGE = 500;

export type SyncResult = { pushed: number; pulled: number; failed: number; error: string | null };

function syncedColumns(t: TableName): Record<string, ColumnKind> {
  return tables[t].synced as Record<string, ColumnKind>;
}

// ------------------------------------------------------------------------------------------------
// Push
// ------------------------------------------------------------------------------------------------
async function pushTable(t: TableName, userId: string): Promise<{ pushed: number; failed: number; error: string | null }> {
  const cols = syncedColumns(t);
  const key = tables[t].key;
  const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t} WHERE dirty = 1 AND user_id = ?`, [userId]);
  if (!rows.length) return { pushed: 0, failed: 0, error: null };
  // One row per key (keep the newest) — a concurrent write can make a scan return a row twice.
  const byKey = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const prev = byKey.get(r[key] as string);
    if (!prev || String(r.updated_at) >= String(prev.updated_at)) byKey.set(r[key] as string, r);
  }
  const raw = [...byKey.values()];

  let pushed = 0;
  let failed = 0;
  let error: string | null = null;
  for (let i = 0; i < raw.length; i += PUSH_BATCH) {
    const batch = raw.slice(i, i + PUSH_BATCH).map((r) => fromSqlite(t, r) as unknown as Record<string, unknown>);
    const payload = batch.map((r) => Object.fromEntries(Object.keys(cols).map((c) => [c, r[c] ?? null])));
    let ok = batch;
    const { error: e } = await supabase.from(t).upsert(payload, { onConflict: key });
    if (e) {
      console.warn(`[sync] push ${t} batch failed:`, e.message, JSON.stringify(payload.map((r) => r[key])));
      // Retry row by row so one bad row can't block the rest.
      ok = [];
      for (let j = 0; j < batch.length; j++) {
        const { error: e1 } = await supabase.from(t).upsert(payload[j], { onConflict: key });
        if (e1) {
          failed++;
          error = e1.message;
          console.warn(`[sync] push ${t} row ${String(payload[j][key])} failed:`, e1.message);
        } else ok.push(batch[j]);
      }
    }
    // Clear the dirty flag only if the row wasn't edited again while we were pushing.
    for (const r of ok) {
      await db.runAsync(`UPDATE ${t} SET dirty = 0 WHERE ${key} = ? AND updated_at = ?`, [r[key] as string, r.updated_at as string]);
    }
    pushed += ok.length;
  }
  return { pushed, failed, error };
}

// ------------------------------------------------------------------------------------------------
// Pull
// ------------------------------------------------------------------------------------------------
async function lastPulled(t: TableName): Promise<string | null> {
  const r = await db.getFirstAsync<{ last_pulled_at: string | null }>('SELECT last_pulled_at FROM sync_state WHERE table_name = ?', [t]);
  return r?.last_pulled_at ?? null;
}

async function applyRemote(t: TableName, rows: Record<string, unknown>[]): Promise<number> {
  const cols = Object.keys(syncedColumns(t));
  const kinds = syncedColumns(t);
  const key = tables[t].key;
  let applied = 0;
  await db.withTransactionAsync(async () => {
    const tx = db;
    for (const remote of rows) {
      const local = await tx.getFirstAsync<{ updated_at: string; dirty: number }>(`SELECT updated_at, dirty FROM ${t} WHERE ${key} = ?`, [
        remote[key] as string,
      ]);
      // A newer unsynced local edit wins; it will be pushed next.
      if (local && local.dirty === 1 && Date.parse(local.updated_at) > Date.parse(remote.updated_at as string)) continue;
      const values = cols.map((c) => {
        const v = remote[c];
        if (v === undefined || v === null) return null;
        return (kinds[c] === 'bool' ? (v ? 1 : 0) : v) as SQLiteBindValue;
      });
      if (local) {
        // UPDATE keeps local-only columns (e.g. the downloaded file path).
        await tx.runAsync(`UPDATE ${t} SET ${cols.map((c) => `${c} = ?`).join(', ')}, dirty = 0 WHERE ${key} = ?`, [...values, remote[key] as string]);
      } else {
        await tx.runAsync(`INSERT INTO ${t} (${cols.join(', ')}, dirty) VALUES (${cols.map(() => '?').join(', ')}, 0)`, values);
      }
      applied++;
    }
  });
  return applied;
}

async function pullTable(t: TableName, userId: string): Promise<number> {
  let since = await lastPulled(t);
  let pulled = 0;
  let limit = PULL_PAGE;
  for (;;) {
    let q = supabase.from(t).select('*').eq('user_id', userId).order('server_updated_at', { ascending: true }).limit(limit);
    // gte (not gt): rows written in one batch share a timestamp; re-reading the boundary is harmless.
    if (since) q = q.gte('server_updated_at', since);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    if (rows.length) pulled += await applyRemote(t, rows);
    const last = rows.length ? (rows[rows.length - 1].server_updated_at as string) : since;
    if (last) {
      await db.runAsync('INSERT OR REPLACE INTO sync_state (table_name, last_pulled_at) VALUES (?, ?)', [t, last]);
    }
    if (rows.length < limit) break;
    if (last === since) limit *= 2; // a whole page shares one timestamp: widen the page
    since = last;
  }
  return pulled;
}

// ------------------------------------------------------------------------------------------------
// Full sync (serialised: only one runs at a time)
// ------------------------------------------------------------------------------------------------
let running: Promise<SyncResult> | null = null;
let again = false;
let paused = false;

type StatusListener = (s: { syncing: boolean; result?: SyncResult }) => void;
const statusListeners = new Set<StatusListener>();
export function onSyncStatus(l: StatusListener) {
  statusListeners.add(l);
  return () => {
    statusListeners.delete(l);
  };
}
const emit = (s: { syncing: boolean; result?: SyncResult }) => statusListeners.forEach((l) => l(s));

/** While offline the provider pauses syncing; local writes still queue (dirty rows). */
export function setSyncPaused(p: boolean) {
  paused = p;
}

export function syncNow(): Promise<SyncResult> {
  if (paused) return Promise.resolve({ pushed: 0, pulled: 0, failed: 0, error: null });
  if (running) {
    again = true;
    return running;
  }
  emit({ syncing: true });
  running = (async () => {
    let result: SyncResult;
    do {
      again = false;
      try {
        result = await runOnce();
      } catch (e) {
        result = { pushed: 0, pulled: 0, failed: 0, error: e instanceof Error ? e.message : String(e) };
      }
    } while (again && !result.error);
    return result;
  })().finally(() => {
    running = null;
  });
  running.then((result) => emit({ syncing: false, result }));
  return running;
}

async function runOnce(): Promise<SyncResult> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { pushed: 0, pulled: 0, failed: 0, error: null };

  let pushed = 0;
  let failed = 0;
  let pulled = 0;
  let error: string | null = null;
  const changed: TableName[] = [];

  for (const t of syncOrder) {
    const r = await pushTable(t, userId);
    pushed += r.pushed;
    failed += r.failed;
    error = error ?? r.error;
  }
  try {
    for (const t of syncOrder) {
      const n = await pullTable(t, userId);
      if (n) changed.push(t);
      pulled += n;
    }
  } catch (e) {
    console.warn('[sync] pull failed:', e instanceof Error ? e.message : String(e));
    error = error ?? (e instanceof Error ? e.message : String(e));
  }
  if (changed.length) notify(...changed);
  return { pushed, pulled, failed, error };
}

// Local writes schedule a sync a couple of seconds later (batching quick edits).
let timer: ReturnType<typeof setTimeout> | null = null;
setLocalWriteHook(() => {
  emit({ syncing: false });
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    syncNow();
  }, 2000);
});
