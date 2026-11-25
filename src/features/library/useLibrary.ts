import { db, fromSqlite, one, useLiveQuery } from '@/db';
import type { BookRow } from '@/db/schema';

export type LibraryBook = BookRow & { percent: number | null; page: number | null; chapter: string | null; location: string | null };

const select = `SELECT b.*, p.percent AS percent, p.page AS page, p.chapter AS chapter, p.location AS location
  FROM books b LEFT JOIN reading_progress p ON p.book_id = b.id AND p.deleted_at IS NULL`;

function toLibraryBook(r: Record<string, unknown>): LibraryBook {
  return {
    ...fromSqlite('books', r),
    percent: (r.percent as number | null) ?? null,
    page: (r.page as number | null) ?? null,
    chapter: (r.chapter as string | null) ?? null,
    location: (r.location as string | null) ?? null,
  };
}

/** All books, most recently opened (or added) first. */
export function useLibraryBooks() {
  return useLiveQuery(['books', 'reading_progress'], async () => {
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `${select} WHERE b.deleted_at IS NULL ORDER BY COALESCE(b.last_opened_at, b.created_at) DESC`,
    );
    return rows.map(toLibraryBook);
  });
}

export function useBook(id: string | undefined) {
  return useLiveQuery(
    ['books', 'reading_progress'],
    async () => {
      if (!id) return null;
      const r = await db.getFirstAsync<Record<string, unknown>>(`${select} WHERE b.id = ?`, [id]);
      return r ? toLibraryBook(r) : null;
    },
    [id],
  );
}

/** Total seconds read in this book, and how many highlights + notes it has. */
export function useBookStats(id: string | undefined) {
  return useLiveQuery(
    ['reading_sessions', 'highlights', 'notes'],
    async () => {
      if (!id) return { seconds: 0, items: 0 };
      const s = await db.getFirstAsync<{ s: number | null }>('SELECT SUM(seconds) AS s FROM reading_sessions WHERE book_id = ? AND deleted_at IS NULL', [id]);
      const h = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM highlights WHERE book_id = ? AND deleted_at IS NULL', [id]);
      const n = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM notes WHERE book_id = ? AND deleted_at IS NULL', [id]);
      return { seconds: s?.s ?? 0, items: (h?.n ?? 0) + (n?.n ?? 0) };
    },
    [id],
  );
}

export const getBook = (id: string) => one('books', id);

export function readingTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
