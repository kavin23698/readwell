// Where book files live on the device: the app's private document directory, so imported books keep
// working even if the original file is deleted from Downloads.
import { Directory, File, Paths } from 'expo-file-system';
import type { BookFormat } from '@/db/schema';

export const MAX_BOOK_BYTES = 50 * 1024 * 1024;

export const booksDir = () => new Directory(Paths.document, 'books');
export const coversDir = () => new Directory(Paths.document, 'covers');

export function ensureDirs() {
  for (const d of [booksDir(), coversDir()]) if (!d.exists) d.create({ intermediates: true, idempotent: true });
}

export const bookFile = (id: string, format: BookFormat) => new File(booksDir(), `${id}.${format}`);

export function storagePath(userId: string, id: string, format: BookFormat) {
  return `${userId}/${id}.${format}`;
}

export const mimeFor: Record<BookFormat, string> = {
  epub: 'application/epub+zip',
  pdf: 'application/pdf',
  txt: 'text/plain',
};

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export function fileExists(uri: string | null | undefined): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function deleteIfExists(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // already gone
  }
}
