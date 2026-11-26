// Notes: on a highlight, on a selection, or general notes for a book. Local first; synced.
import { all, db, newId, nowIso, patch, remove, save, useLiveQuery } from '@/db';
import type { BookRow, NoteRow } from '@/db/schema';

export type NewNote = {
  body: string;
  kind?: NoteRow['kind'];
  highlight_id?: string | null;
  location?: string | null;
  quote?: string | null;
  chapter?: string | null;
  page?: number | null;
};

export async function addNote(book: Pick<BookRow, 'id' | 'user_id'>, n: NewNote): Promise<string> {
  const id = newId();
  await save('notes', {
    id,
    user_id: book.user_id,
    book_id: book.id,
    kind: n.kind ?? 'note',
    highlight_id: n.highlight_id ?? null,
    location: n.location ?? null,
    quote: n.quote ?? null,
    body: n.body,
    chapter: n.chapter ?? null,
    page: n.page ?? null,
    created_at: nowIso(),
  });
  return id;
}

export const updateNote = (id: string, body: string) => patch('notes', id, { body });
export const deleteNote = (id: string) => remove('notes', id);

export async function noteForHighlight(highlightId: string): Promise<NoteRow | null> {
  const rows = await all('notes', "deleted_at IS NULL AND highlight_id = ? AND kind = 'note'", [highlightId], 'ORDER BY created_at DESC LIMIT 1');
  return rows[0] ?? null;
}

/** Highlight ids in this book that have a note (for the margin marker). */
export function useNotedHighlightIds(bookId: string) {
  return useLiveQuery(
    ['notes'],
    async () => {
      const rows = await db.getAllAsync<{ highlight_id: string }>(
        'SELECT DISTINCT highlight_id FROM notes WHERE deleted_at IS NULL AND book_id = ? AND highlight_id IS NOT NULL',
        [bookId],
      );
      return new Set(rows.map((r) => r.highlight_id));
    },
    [bookId],
  );
}
