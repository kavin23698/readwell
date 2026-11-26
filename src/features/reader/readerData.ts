// Highlights and reading position for one book (local first; synced by the sync engine).
import { all, db, newId, nowIso, one, patch, remove, save, useLiveQuery } from '@/db';
import type { BookRow, HighlightRow, ProgressRow } from '@/db/schema';

export function useHighlights(bookId: string) {
  return useLiveQuery(['highlights'], () => all('highlights', 'deleted_at IS NULL AND book_id = ?', [bookId], 'ORDER BY created_at'), [bookId]);
}

export async function addHighlight(
  book: Pick<BookRow, 'id' | 'user_id'>,
  h: { color: string; location: string; text: string; chapter: string | null; page: number | null },
): Promise<string> {
  const id = newId();
  await save('highlights', { id, user_id: book.user_id, book_id: book.id, ...h, created_at: nowIso() });
  return id;
}

export const recolorHighlight = (id: string, color: string) => patch('highlights', id, { color });
export const deleteHighlight = (id: string) => remove('highlights', id);
export const getHighlight = (id: string) => one('highlights', id);

export type Position = { location: string; percent: number | null; page: number | null; total: number | null; chapter: string | null };

/** reading_progress uses the book id as its id, so each book has exactly one row on every device. */
export async function getProgress(bookId: string): Promise<ProgressRow | null> {
  const p = await one('reading_progress', bookId);
  return p && !p.deleted_at ? p : null;
}

export async function saveProgress(book: Pick<BookRow, 'id' | 'user_id' | 'total_pages' | 'finished_at'>, pos: Position) {
  const existing = await one('reading_progress', book.id);
  const percent = pos.percent ?? existing?.percent ?? 0;
  await save('reading_progress', {
    id: book.id,
    user_id: book.user_id,
    book_id: book.id,
    location: pos.location,
    percent,
    page: pos.page ?? existing?.page ?? null,
    chapter: pos.chapter ?? existing?.chapter ?? null,
    created_at: existing?.created_at ?? nowIso(),
  });
  const updates: Partial<BookRow> = { last_opened_at: nowIso() };
  if (pos.total && pos.total !== book.total_pages) updates.total_pages = pos.total;
  // Reaching the last 2% counts as finished.
  if (percent >= 98 && !book.finished_at) updates.finished_at = nowIso();
  await patch('books', book.id, updates);
}

export async function highlightCount(bookId: string) {
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM highlights WHERE book_id = ? AND deleted_at IS NULL', [bookId]);
  return r?.n ?? 0;
}

export type { HighlightRow };
