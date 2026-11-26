// Notes and highlights as one list of items (Notes tab 48, book list 50).
import { router } from 'expo-router';
import { db, useLiveQuery } from '@/db';

export type NoteItem = {
  key: string;
  type: 'highlight' | 'note';
  /** highlight id, or note id */
  id: string;
  /** note attached to a highlight (shown under it) */
  noteId: string | null;
  bookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  coverSeed: number;
  localCover: string | null;
  kind: 'highlight' | 'note' | 'meaning' | 'translation';
  quote: string | null;
  color: string | null;
  body: string | null;
  location: string | null;
  page: number | null;
  chapter: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = Record<string, unknown>;

async function load(bookId?: string): Promise<NoteItem[]> {
  const where = bookId ? 'AND x.book_id = ?' : '';
  const params = bookId ? [bookId] : [];
  // Highlights (with their newest attached note).
  const hl = await db.getAllAsync<Row>(
    `SELECT x.id, x.book_id, x.color, x.text, x.location, x.page, x.chapter, x.created_at, x.updated_at,
            n.id AS note_id, n.body AS note_body, n.updated_at AS note_updated,
            b.title, b.author, b.cover_seed, b.local_cover
     FROM highlights x
     JOIN books b ON b.id = x.book_id AND b.deleted_at IS NULL
     LEFT JOIN notes n ON n.id = (SELECT id FROM notes WHERE highlight_id = x.id AND deleted_at IS NULL AND kind = 'note' ORDER BY updated_at DESC LIMIT 1)
     WHERE x.deleted_at IS NULL ${where}`,
    params,
  );
  // Notes that aren't attached to a highlight (general, meaning, translation).
  const notes = await db.getAllAsync<Row>(
    `SELECT x.id, x.book_id, x.kind, x.quote, x.body, x.location, x.page, x.chapter, x.created_at, x.updated_at,
            b.title, b.author, b.cover_seed, b.local_cover
     FROM notes x
     JOIN books b ON b.id = x.book_id AND b.deleted_at IS NULL
     WHERE x.deleted_at IS NULL AND (x.highlight_id IS NULL OR x.kind != 'note'
       OR NOT EXISTS (SELECT 1 FROM highlights h WHERE h.id = x.highlight_id AND h.deleted_at IS NULL)) ${where}`,
    params,
  );
  const book = (r: Row) => ({
    bookId: r.book_id as string,
    bookTitle: r.title as string,
    bookAuthor: (r.author as string | null) ?? null,
    coverSeed: (r.cover_seed as number) ?? 0,
    localCover: (r.local_cover as string | null) ?? null,
  });
  return [
    ...hl.map<NoteItem>((r) => ({
      key: `h:${r.id}`,
      type: 'highlight',
      id: r.id as string,
      noteId: (r.note_id as string | null) ?? null,
      ...book(r),
      kind: 'highlight',
      quote: r.text as string,
      color: r.color as string,
      body: (r.note_body as string | null) ?? null,
      location: r.location as string,
      page: (r.page as number | null) ?? null,
      chapter: (r.chapter as string | null) ?? null,
      createdAt: r.created_at as string,
      updatedAt: ((r.note_updated as string | null) ?? (r.updated_at as string)) as string,
    })),
    ...notes.map<NoteItem>((r) => ({
      key: `n:${r.id}`,
      type: 'note',
      id: r.id as string,
      noteId: r.id as string,
      ...book(r),
      kind: r.kind as NoteItem['kind'],
      quote: (r.quote as string | null) ?? null,
      color: null,
      body: r.body as string,
      location: (r.location as string | null) ?? null,
      page: (r.page as number | null) ?? null,
      chapter: (r.chapter as string | null) ?? null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    })),
  ];
}

export function useAllNoteItems() {
  return useLiveQuery(['highlights', 'notes', 'books'], () => load());
}

export function useBookNoteItems(bookId: string | undefined) {
  return useLiveQuery(['highlights', 'notes', 'books'], () => (bookId ? load(bookId) : Promise.resolve([])), [bookId]);
}

export type NoteFilter = 'all' | 'notes' | 'highlights';

export function matches(item: NoteItem, filter: NoteFilter, query: string) {
  if (filter === 'notes' && !item.body) return false;
  if (filter === 'highlights' && item.type !== 'highlight') return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.quote, item.body, item.bookTitle, item.bookAuthor].some((s) => (s ?? '').toLowerCase().includes(q));
}

/** Reading order: page, then position string, then creation time. */
export function readingOrder(a: NoteItem, b: NoteItem) {
  return (a.page ?? 1e9) - (b.page ?? 1e9) || (a.location ?? '').localeCompare(b.location ?? '') || a.createdAt.localeCompare(b.createdAt);
}

/** Opens the book at the item's spot. */
export function openAtItem(item: Pick<NoteItem, 'bookId' | 'location'>) {
  router.push({ pathname: '/reader/[id]', params: { id: item.bookId, at: item.location ?? '' } });
}

/** Notes open their detail screen; plain highlights open the book at that spot. */
export function openItem(item: NoteItem) {
  if (item.noteId) router.push({ pathname: '/note/[id]', params: { id: item.noteId } });
  else openAtItem(item);
}
