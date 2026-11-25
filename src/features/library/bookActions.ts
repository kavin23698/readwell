import { db, notify, nowIso, patch, remove } from '@/db';
import type { BookRow } from '@/db/schema';
import { booksDir, coversDir, deleteIfExists } from './files';
import { deleteFromStorage } from './uploader';

/**
 * Deletes a book everywhere: the file and cover on this phone, the cloud copy, and its position,
 * highlights and notes (soft deletes, so other devices remove them too). Reading sessions stay,
 * so past reading still counts toward stats.
 */
export async function deleteBook(book: BookRow) {
  const now = nowIso();
  for (const t of ['reading_progress', 'highlights', 'notes'] as const) {
    await db.runAsync(`UPDATE ${t} SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE book_id = ? AND deleted_at IS NULL`, [now, now, book.id]);
  }
  notify('reading_progress', 'highlights', 'notes');
  await remove('books', book.id);
  deleteIfExists(book.local_path);
  deleteIfExists(book.local_cover);
  if (book.storage_path) await deleteFromStorage(book.storage_path);
}

export async function setFinished(book: BookRow, finished: boolean) {
  await patch('books', book.id, { finished_at: finished ? nowIso() : null });
}

/** Removes all downloaded book files (sign-out). */
export function deleteAllLocalFiles() {
  for (const d of [booksDir(), coversDir()]) {
    try {
      if (d.exists) d.delete();
    } catch {
      // ignore
    }
  }
}
