import { db, fromSqlite, useLiveQuery } from '@/db';
import type { BookRow } from '@/db/schema';

export type ContinueBook = BookRow & { percent: number | null; page: number | null; chapter: string | null };

/** The most recently opened, unfinished book (Home "Continue reading"). */
export function useContinueBook() {
  return useLiveQuery(['books', 'reading_progress'], async () => {
    const r = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT b.*, p.percent AS percent, p.page AS page, p.chapter AS chapter
       FROM books b LEFT JOIN reading_progress p ON p.book_id = b.id AND p.deleted_at IS NULL
       WHERE b.deleted_at IS NULL AND b.last_opened_at IS NOT NULL AND b.finished_at IS NULL
       ORDER BY b.last_opened_at DESC LIMIT 1`,
    );
    if (!r) return null;
    return { ...fromSqlite('books', r), percent: r.percent as number | null, page: r.page as number | null, chapter: r.chapter as string | null } as ContinueBook;
  });
}

export function useBookCount() {
  return useLiveQuery(['books'], async () => {
    const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM books WHERE deleted_at IS NULL');
    return r?.n ?? 0;
  });
}
