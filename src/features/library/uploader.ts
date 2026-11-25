// Book files ⇄ Supabase Storage (private "books" bucket, "<user_id>/<book>.<ext>").
// Uploads run in the background after import and retry when back online; downloads happen the first
// time a book is opened on a new device.
import NetInfo from '@react-native-community/netinfo';
import { File } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';
import { all, one, patch } from '@/db';
import type { BookRow } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { bookFile, ensureDirs, fileExists, mimeFor } from './files';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const PENDING_DELETES = 'storage:pendingDeletes';

async function authHeaders(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}`, apikey: anonKey } : null;
}

async function online() {
  const s = await NetInfo.fetch();
  return s.isConnected !== false && s.isInternetReachable !== false;
}

// Upload progress for the Library badges (bookId → 0..1).
type ProgressListener = (bookId: string, fraction: number) => void;
const progressListeners = new Set<ProgressListener>();
export function onUploadProgress(l: ProgressListener) {
  progressListeners.add(l);
  return () => {
    progressListeners.delete(l);
  };
}

async function uploadOne(book: BookRow): Promise<boolean> {
  if (!book.local_path || !book.storage_path || !fileExists(book.local_path)) return false;
  const headers = await authHeaders();
  if (!headers) return false;
  await patch('books', book.id, { upload_state: 'uploading' }, { dirty: false });
  try {
    const res = await new File(book.local_path).upload(`${url}/storage/v1/object/books/${book.storage_path}`, {
      httpMethod: 'POST',
      headers: { ...headers, 'x-upsert': 'true', 'Content-Type': mimeFor[book.format] },
      mimeType: mimeFor[book.format],
      onProgress: ({ bytesSent, totalBytes }) => progressListeners.forEach((l) => l(book.id, totalBytes ? bytesSent / totalBytes : 0)),
    });
    const ok = res.status >= 200 && res.status < 300;
    if (!ok) console.warn('[upload] failed', res.status, res.body.slice(0, 200));
    await patch('books', book.id, { upload_state: ok ? 'synced' : 'failed' }, { dirty: false });
    return ok;
  } catch (e) {
    console.warn('[upload] error', e);
    await patch('books', book.id, { upload_state: 'failed' }, { dirty: false });
    return false;
  }
}

let running = false;
/** Uploads every book that isn't in the cloud yet, then finishes queued storage deletions. */
export async function runUploads() {
  if (running || !(await online())) return;
  running = true;
  try {
    const waiting = await all('books', "deleted_at IS NULL AND local_path IS NOT NULL AND (upload_state IS NULL OR upload_state IN ('pending','failed','uploading'))");
    for (const b of waiting) await uploadOne(b);
    await flushStorageDeletes();
  } finally {
    running = false;
  }
}

export async function retryUpload(bookId: string) {
  const b = await one('books', bookId);
  if (b) await patch('books', bookId, { upload_state: 'pending' }, { dirty: false });
  await runUploads();
}

// ------------------------------------------------------------------------------------------------
// Download (first open on a new device)
// ------------------------------------------------------------------------------------------------
export class NotUploadedError extends Error {}

/** Makes sure the book file is on this device, downloading it if needed. Returns its uri. */
export async function ensureLocalFile(book: BookRow, onProgress?: (fraction: number) => void): Promise<string> {
  if (book.local_path && fileExists(book.local_path)) return book.local_path;
  if (!book.storage_path) throw new NotUploadedError('no storage path');
  if (!(await online())) throw new Error('offline');
  const headers = await authHeaders();
  if (!headers) throw new Error('not signed in');
  ensureDirs();
  const dest = bookFile(book.id, book.format);
  if (dest.exists) dest.delete();
  try {
    await File.downloadFileAsync(`${url}/storage/v1/object/authenticated/books/${book.storage_path}`, dest, {
      headers,
      idempotent: true,
      onProgress: ({ bytesWritten, totalBytes }) => onProgress?.(totalBytes ? bytesWritten / totalBytes : 0),
    });
  } catch (e) {
    if (dest.exists) dest.delete();
    const msg = e instanceof Error ? e.message : String(e);
    if (/40[04]/.test(msg) || /not found/i.test(msg)) throw new NotUploadedError(msg);
    throw e;
  }
  await patch('books', book.id, { local_path: dest.uri, upload_state: 'synced' }, { dirty: false });
  return dest.uri;
}

// ------------------------------------------------------------------------------------------------
// Storage deletions (queued while offline)
// ------------------------------------------------------------------------------------------------
export async function deleteFromStorage(path: string) {
  const raw = await Storage.getItem(PENDING_DELETES);
  const list: string[] = raw ? JSON.parse(raw) : [];
  if (!list.includes(path)) list.push(path);
  await Storage.setItem(PENDING_DELETES, JSON.stringify(list));
  await flushStorageDeletes();
}

async function flushStorageDeletes() {
  const raw = await Storage.getItem(PENDING_DELETES);
  const list: string[] = raw ? JSON.parse(raw) : [];
  if (!list.length || !(await online())) return;
  const { error } = await supabase.storage.from('books').remove(list);
  if (!error) await Storage.removeItem(PENDING_DELETES);
}
