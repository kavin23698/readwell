// Tracks an import run so the Importing screen (28) can show per-file progress and the summary
// (29 success / 30 errors) afterwards. Importing continues if the user leaves the screen.
import { useSyncExternalStore } from 'react';
import { formatBytes } from './files';
import { importOne, type ImportOutcome, type PickedFile } from './importBooks';

export type ImportItem = {
  key: string;
  name: string;
  size: string;
  pct: number;
  status: string;
  state: 'waiting' | 'working' | 'done' | 'error';
  outcome?: ImportOutcome;
};

type State = { items: ImportItem[]; running: boolean };

let state: State = { items: [], running: false };
const listeners = new Set<() => void>();
const set = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};
const update = (key: string, patch: Partial<ImportItem>) =>
  set({ ...state, items: state.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) });

export function useImportState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export async function startImport(files: PickedFile[]) {
  const items: ImportItem[] = files.map((f, i) => ({
    key: `${Date.now()}-${i}`,
    name: f.name,
    size: f.size ? formatBytes(f.size) : '',
    pct: 0,
    status: 'Waiting…',
    state: 'waiting',
  }));
  set({ items, running: true });
  for (let i = 0; i < files.length; i++) {
    const key = items[i].key;
    update(key, { state: 'working', status: 'Starting…', pct: 5 });
    const outcome = await importOne(files[i], (pct, label) => update(key, { pct, status: `${pct}% · ${label}` }));
    update(key, outcome.ok ? { state: 'done', pct: 100, status: 'Added to Library', outcome } : { state: 'error', pct: 100, status: outcome.why, outcome });
  }
  set({ ...state, running: false });
}

export function clearImport() {
  set({ items: [], running: false });
}
