// Local database: the app's source of truth. Screens read from here (useLiveQuery) and write through
// the helpers below, which mark rows dirty and nudge the sync engine.
import * as SQLite from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { createTableSql, syncOrder, tables, type ColumnKind, type RowOf, type TableName } from './schema';

const DB_VERSION = 2;

export const db = SQLite.openDatabaseSync('readwell.db');

function migrate() {
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA busy_timeout = 5000;');
  const { user_version } = db.getFirstSync<{ user_version: number }>('PRAGMA user_version') ?? { user_version: 0 };
  if (user_version < 1) {
    db.withTransactionSync(() => {
      for (const t of syncOrder) db.execSync(createTableSql(t));
      db.execSync('CREATE TABLE IF NOT EXISTS sync_state (table_name TEXT PRIMARY KEY NOT NULL, last_pulled_at TEXT);');
      db.execSync('CREATE INDEX IF NOT EXISTS idx_sessions_date ON reading_sessions (local_date);');
      db.execSync('CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights (book_id);');
      db.execSync('CREATE INDEX IF NOT EXISTS idx_notes_book ON notes (book_id);');
    });
  }
  if (user_version >= 1 && user_version < 2) {
    // v2: profile photo
    db.execSync('ALTER TABLE profiles ADD COLUMN avatar_path TEXT;');
  }
  // Future schema changes: `if (user_version < 3) { ALTER TABLE … }`
  db.execSync(`PRAGMA user_version = ${DB_VERSION}`);
}
migrate();

// ------------------------------------------------------------------------------------------------
// Value conversion (SQLite stores booleans as 0/1)
// ------------------------------------------------------------------------------------------------
function columnKinds(t: TableName): Record<string, ColumnKind> {
  const def = tables[t] as { synced: Record<string, ColumnKind>; local?: Record<string, ColumnKind> };
  return { ...def.synced, ...(def.local ?? {}) };
}

export function fromSqlite<T extends TableName>(t: T, raw: Record<string, unknown>): RowOf[T] {
  const kinds = columnKinds(t);
  const out: Record<string, unknown> = { ...raw };
  for (const [c, k] of Object.entries(kinds)) if (k === 'bool' && raw[c] != null) out[c] = raw[c] === 1 || raw[c] === true;
  return out as RowOf[T];
}

function toSqliteValue(kind: ColumnKind | undefined, v: unknown): SQLite.SQLiteBindValue {
  if (v === undefined || v === null) return null;
  if (kind === 'bool') return v ? 1 : 0;
  return v as SQLite.SQLiteBindValue;
}

// ------------------------------------------------------------------------------------------------
// Change notifications + live queries
// ------------------------------------------------------------------------------------------------
type Listener = (changed: Set<TableName>) => void;
const listeners = new Set<Listener>();

export function notify(...changed: TableName[]) {
  const set = new Set(changed);
  listeners.forEach((l) => l(set));
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Runs `query` now and again whenever one of `deps` tables changes. */
export function useLiveQuery<R>(deps: TableName[], query: () => Promise<R>, keys: unknown[] = []): R | undefined {
  const [result, setResult] = useState<R>();
  const queryRef = useRef(query);
  queryRef.current = query;
  const depKey = deps.join(',');

  useEffect(() => {
    let alive = true;
    const run = () =>
      queryRef
        .current()
        .then((r) => alive && setResult(r))
        .catch((e) => console.warn('[db] live query failed', e));
    run();
    const unsub = subscribe((changed) => {
      if (depKey.split(',').some((d) => changed.has(d as TableName))) run();
    });
    return () => {
      alive = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, ...keys]);

  return result;
}

// ------------------------------------------------------------------------------------------------
// Reads
// ------------------------------------------------------------------------------------------------
export async function all<T extends TableName>(t: T, where = 'deleted_at IS NULL', params: SQLite.SQLiteBindValue[] = [], order = ''): Promise<RowOf[T][]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t} WHERE ${where} ${order}`, params);
  return rows.map((r) => fromSqlite(t, r));
}

export async function one<T extends TableName>(t: T, key: string): Promise<RowOf[T] | null> {
  const k = tables[t].key;
  const row = await db.getFirstAsync<Record<string, unknown>>(`SELECT * FROM ${t} WHERE ${k} = ?`, [key]);
  return row ? fromSqlite(t, row) : null;
}

// ------------------------------------------------------------------------------------------------
// Writes (local first; mark dirty; schedule a sync)
// ------------------------------------------------------------------------------------------------
let onLocalWrite: () => void = () => {};
/** The sync engine registers itself here (avoids an import cycle). */
export function setLocalWriteHook(fn: () => void) {
  onLocalWrite = fn;
}

export function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // RFC 4122 v4 from Math.random — ids only need to be unique per user.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const nowIso = () => new Date().toISOString();

/**
 * Inserts or replaces a full row written by this device. `updated_at` is set to now and the row is
 * marked dirty so it gets pushed.
 */
export async function save<T extends TableName>(t: T, row: Partial<RowOf[T]> & Record<string, unknown>, opts: { dirty?: boolean; silent?: boolean } = {}) {
  const kinds = columnKinds(t);
  const now = nowIso();
  const full: Record<string, unknown> = {
    created_at: now,
    deleted_at: null,
    ...row,
    updated_at: (row.updated_at as string | undefined) ?? now,
  };
  const cols = Object.keys(kinds).filter((c) => c in full);
  const dirty = opts.dirty === false ? 0 : 1;
  // Upsert in place (not INSERT OR REPLACE): keeps the rowid stable, so a concurrent scan by the sync
  // engine never sees the same row twice.
  const key = tables[t].key;
  const updates = cols.filter((c) => c !== key && c !== 'created_at').map((c) => `${c} = excluded.${c}`);
  const sql = `INSERT INTO ${t} (${cols.join(', ')}, dirty) VALUES (${cols.map(() => '?').join(', ')}, ?)
    ON CONFLICT(${key}) DO UPDATE SET ${[...updates, 'dirty = excluded.dirty'].join(', ')}`;
  await db.runAsync(sql, [...cols.map((c) => toSqliteValue(kinds[c], full[c])), dirty]);
  if (!opts.silent) notify(t);
  if (dirty) onLocalWrite();
}

/** Updates some columns of an existing row, bumping updated_at and marking it dirty. */
export async function patch<T extends TableName>(t: T, key: string, changes: Partial<RowOf[T]> & Record<string, unknown>, opts: { dirty?: boolean } = {}) {
  const kinds = columnKinds(t);
  const k = tables[t].key;
  const dirty = opts.dirty !== false;
  const values: Record<string, unknown> = { ...changes };
  if (dirty) values.updated_at = nowIso();
  const cols = Object.keys(values).filter((c) => c in kinds);
  if (!cols.length) return;
  const sets = cols.map((c) => `${c} = ?`).join(', ');
  await db.runAsync(`UPDATE ${t} SET ${sets}${dirty ? ', dirty = 1' : ''} WHERE ${k} = ?`, [
    ...cols.map((c) => toSqliteValue(kinds[c], values[c])),
    key,
  ]);
  notify(t);
  if (dirty) onLocalWrite();
}

/** Soft delete: sets deleted_at so the deletion syncs to other devices. */
export async function remove(t: TableName, key: string) {
  await patch(t, key, { deleted_at: nowIso() } as never);
}

/** Wipes everything (sign-out), so the next account starts clean. */
export async function wipeLocalData() {
  await db.withTransactionAsync(async () => {
    const tx = db;
    for (const t of syncOrder) await tx.runAsync(`DELETE FROM ${t}`);
    await tx.runAsync('DELETE FROM sync_state');
  });
  notify(...syncOrder);
}

export async function pendingChanges(): Promise<number> {
  let n = 0;
  for (const t of syncOrder) {
    const r = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t} WHERE dirty = 1`);
    n += r?.n ?? 0;
  }
  return n;
}
