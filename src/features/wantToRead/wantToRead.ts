// Want to read: books the user is thinking of reading. Local first; synced.
import { all, newId, nowIso, patch, remove, save, useLiveQuery } from '@/db';
import type { WantRow } from '@/db/schema';

export function useWantToRead() {
  return useLiveQuery(['want_to_read'], async () => {
    const rows = await all('want_to_read', 'deleted_at IS NULL', [], 'ORDER BY added_to_library ASC, position ASC, created_at ASC');
    return rows;
  });
}

export async function addWant(userId: string, w: { title: string; author: string | null; note: string | null }) {
  const existing = await all('want_to_read', 'deleted_at IS NULL');
  const position = existing.length ? Math.max(...existing.map((x) => x.position)) + 1 : 0;
  await save('want_to_read', { id: newId(), user_id: userId, ...w, position, added_to_library: false, created_at: nowIso() });
}

export const removeWant = (id: string) => remove('want_to_read', id);
export const setAdded = (id: string, added: boolean) => patch('want_to_read', id, { added_to_library: added });

/** Moves an item up or down by swapping positions with its neighbour. */
export async function moveWant(list: WantRow[], id: string, dir: -1 | 1) {
  const active = list.filter((x) => !x.added_to_library);
  const i = active.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= active.length) return;
  // Normalise positions first so swaps are always distinct.
  for (let k = 0; k < active.length; k++) {
    if (active[k].position !== k) await patch('want_to_read', active[k].id, { position: k });
  }
  await patch('want_to_read', active[i].id, { position: j });
  await patch('want_to_read', active[j].id, { position: i });
}
