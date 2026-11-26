// Import: system file picker → validate (format, size, DRM, damage) → copy into app storage →
// read metadata (title, author, cover) → add to the Library right away → upload in the background.
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { newId, nowIso, save } from '@/db';
import type { BookFormat } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { CorruptError, DrmError, readEpubMeta } from './epubMeta';
import { bookFile, coversDir, deleteIfExists, ensureDirs, MAX_BOOK_BYTES, storagePath } from './files';
import { runUploads } from './uploader';

export type PickedFile = { uri: string; name: string; size: number | null; mimeType: string | null };

export type ImportOutcome =
  | { ok: true; bookId: string; title: string; author: string | null; coverSeed: number; cover: string | null }
  | { ok: false; why: string; body: string };

export const UNSUPPORTED_BODY = "This format isn't supported yet. Readwell can open EPUB, PDF, and TXT files.";

export async function pickBookFiles(): Promise<PickedFile[]> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
  if (res.canceled) return [];
  return res.assets.map((a) => ({ uri: a.uri, name: a.name, size: a.size ?? null, mimeType: a.mimeType ?? null }));
}

export function formatOf(f: Pick<PickedFile, 'name' | 'mimeType'>): BookFormat | null {
  const ext = f.name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'epub' || f.mimeType === 'application/epub+zip') return 'epub';
  if (ext === 'pdf' || f.mimeType === 'application/pdf') return 'pdf';
  if (ext === 'txt' || f.mimeType === 'text/plain') return 'txt';
  return null;
}

/** Bytes → string, one char per byte (Hermes' TextDecoder only handles UTF-8). */
function latin1(bytes: Uint8Array, start: number, end: number): string {
  let s = '';
  for (let i = start; i < end; i += 8192) s += String.fromCharCode(...bytes.subarray(i, Math.min(end, i + 8192)));
  return s;
}

/** "The_Count_of_Monte_Cristo.pdf" → "The Count of Monte Cristo" */
export function titleFromName(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled';
}

export async function importOne(f: PickedFile, onStep?: (pct: number, label: string) => void): Promise<ImportOutcome> {
  try {
    return await importInner(f, onStep);
  } finally {
    // The picker hands us a temporary copy in the cache; the book now lives in app storage.
    if (f.uri.includes('/cache/')) deleteIfExists(f.uri);
  }
}

async function importInner(f: PickedFile, onStep?: (pct: number, label: string) => void): Promise<ImportOutcome> {
  const format = formatOf(f);
  if (!format) return { ok: false, why: 'Unsupported format', body: UNSUPPORTED_BODY };

  const source = new File(f.uri);
  const size = f.size ?? (source.exists ? source.size : 0);
  if (size > MAX_BOOK_BYTES) {
    return { ok: false, why: 'File is too large', body: 'Books can be up to 50 MB. Try a smaller copy of this file.' };
  }
  if (!size) return { ok: false, why: 'File is empty', body: 'It looks incomplete — try downloading it again.' };

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { ok: false, why: 'Not signed in', body: 'Sign in again, then import the book.' };

  ensureDirs();
  const id = newId();
  const dest = bookFile(id, format);
  let coverUri: string | null = null;
  let title = titleFromName(f.name);
  let author: string | null = null;

  try {
    onStep?.(15, 'Copying file');
    // Read from the picked file, then copy; if the copy isn't visible yet, write the bytes directly.
    const bytes = await source.bytes();
    try {
      source.copy(dest);
    } catch {
      // fall through to the explicit write below
    }
    if (!dest.exists || dest.size !== bytes.length) {
      dest.create({ overwrite: true });
      dest.write(bytes);
    }
    onStep?.(45, format === 'pdf' ? 'Reading pages' : 'Reading book details');
    if (format === 'epub') {
      const meta = await readEpubMeta(bytes);
      if (meta.title) title = meta.title;
      if (meta.author) author = meta.author;
      if (meta.cover) {
        const cover = new File(coversDir(), `${id}.${meta.cover.ext}`);
        cover.create({ overwrite: true });
        cover.write(meta.cover.bytes);
        coverUri = cover.uri;
      }
    } else if (format === 'pdf') {
      const head = latin1(bytes, 0, 1024);
      if (!head.includes('%PDF')) throw new CorruptError('no pdf header');
      const tail = latin1(bytes, Math.max(0, bytes.length - 2048), bytes.length);
      if (!tail.includes('%%EOF')) throw new CorruptError('truncated pdf');
      // Document info dictionary (plain-ASCII values only; skips encoded/UTF-16 strings).
      const info = latin1(bytes, 0, Math.min(bytes.length, 200_000)) + tail;
      const pdfTitle = info.match(/\/Title\s*\(([^)]{2,200})\)/)?.[1];
      const pdfAuthor = info.match(/\/Author\s*\(([^)]{2,200})\)/)?.[1];
      if (pdfTitle && /^[\x20-\x7e]+$/.test(pdfTitle)) title = pdfTitle.trim();
      if (pdfAuthor && /^[\x20-\x7e]+$/.test(pdfAuthor)) author = pdfAuthor.trim();
    }
    onStep?.(85, 'Adding to Library');

    const seed = Math.floor(Math.random() * 1000);
    await save('books', {
      id,
      user_id: userId,
      title,
      author,
      format,
      file_size: size,
      storage_path: storagePath(userId, id, format),
      cover_path: null,
      cover_seed: seed,
      total_pages: null,
      source_name: f.name,
      finished_at: null,
      last_opened_at: null,
      created_at: nowIso(),
      local_path: dest.uri,
      local_cover: coverUri,
      upload_state: 'pending',
    });
    onStep?.(100, 'Added to Library');
    runUploads(); // background; the book is readable right away
    return { ok: true, bookId: id, title, author, coverSeed: seed, cover: coverUri };
  } catch (e) {
    deleteIfExists(dest.uri);
    deleteIfExists(coverUri);
    if (e instanceof DrmError) return { ok: false, why: 'DRM-protected', body: 'Protected books only open in the store’s own app.' };
    if (e instanceof CorruptError) return { ok: false, why: 'File is corrupted', body: 'It looks incomplete — try downloading it again.' };
    console.warn('[import] failed', e);
    return { ok: false, why: 'Couldn’t import', body: 'Something went wrong reading this file. Try again.' };
  }
}
