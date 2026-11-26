// Profile photo: picked from the gallery or camera (square crop), kept on the phone for offline use,
// uploaded to the private "avatars" bucket under "<user_id>/", and downloaded on other devices.
import NetInfo from '@react-native-community/netinfo';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { patch } from '@/db';
import type { ProfileRow } from '@/db/schema';
import { supabase } from '@/lib/supabase';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const dir = () => new Directory(Paths.document, 'avatars');
/** Local copy for a storage path ("<uid>/avatar-123.jpg" → avatars/<uid>_avatar-123.jpg). */
const localFor = (path: string) => new File(dir(), path.replace(/\//g, '_'));

export type PickResult = { ok: true } | { ok: false; reason: 'cancelled' | 'permission' | 'error'; message?: string };

async function headers() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}`, apikey: anonKey } : null;
}

async function online() {
  const s = await NetInfo.fetch();
  return s.isConnected !== false && s.isInternetReachable !== false;
}

/** Opens the gallery or camera, then saves and uploads the cropped square photo. */
export async function pickAvatar(profile: ProfileRow, source: 'library' | 'camera'): Promise<PickResult> {
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return { ok: false, reason: 'permission' };
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled || !res.assets?.[0]) return { ok: false, reason: 'cancelled' };

    const asset = res.assets[0];
    const ext = asset.mimeType === 'image/png' ? 'png' : 'jpg';
    const path = `${profile.user_id}/avatar-${Date.now()}.${ext}`;
    const d = dir();
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    const local = localFor(path);
    new File(asset.uri).copy(local);

    const previous = profile.avatar_path;
    await patch('profiles', profile.user_id, { avatar_path: path }); // shows right away, syncs
    uploadAvatar(path, ext).then((ok) => {
      if (ok && previous) removeRemote(previous);
    });
    if (previous) deleteLocal(previous);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

/** Uploads the local photo (retried by ensureAvatarUploaded if offline now). */
async function uploadAvatar(path: string, ext = path.endsWith('.png') ? 'png' : 'jpg') {
  const local = localFor(path);
  const h = await headers();
  if (!h || !local.exists || !(await online())) return false;
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  try {
    const r = await local.upload(`${url}/storage/v1/object/avatars/${path}`, {
      httpMethod: 'POST',
      headers: { ...h, 'x-upsert': 'true', 'Content-Type': mime },
      mimeType: mime,
    });
    return r.status >= 200 && r.status < 300;
  } catch {
    return false;
  }
}

/** Called after syncs: makes sure the current photo reached the cloud. */
export async function ensureAvatarUploaded(profile: ProfileRow | null) {
  if (!profile?.avatar_path || !localFor(profile.avatar_path).exists) return;
  const h = await headers();
  if (!h || !(await online())) return;
  const head = await fetch(`${url}/storage/v1/object/info/authenticated/avatars/${profile.avatar_path}`, { headers: h }).catch(() => null);
  if (head && head.ok) return;
  await uploadAvatar(profile.avatar_path);
}

async function removeRemote(path: string) {
  try {
    await supabase.storage.from('avatars').remove([path]);
  } catch {
    // stays until the next change; harmless
  }
}

function deleteLocal(path: string) {
  try {
    const f = localFor(path);
    if (f.exists) f.delete();
  } catch {
    // ignore
  }
}

export async function removeAvatar(profile: ProfileRow) {
  const previous = profile.avatar_path;
  await patch('profiles', profile.user_id, { avatar_path: null });
  if (previous) {
    deleteLocal(previous);
    if (await online()) removeRemote(previous);
  }
}

/** Local file uri for the profile photo, downloading it first on a new device. */
export function useAvatarUri(path: string | null | undefined): string | null {
  const [uri, setUri] = useState<string | null>(() => (path && localFor(path).exists ? localFor(path).uri : null));
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUri(null);
      return;
    }
    const local = localFor(path);
    if (local.exists) {
      setUri(local.uri);
      return;
    }
    setUri(null);
    (async () => {
      const h = await headers();
      if (!h || !(await online())) return;
      try {
        const d = dir();
        if (!d.exists) d.create({ intermediates: true, idempotent: true });
        await File.downloadFileAsync(`${url}/storage/v1/object/authenticated/avatars/${path}`, local, { headers: h, idempotent: true });
        if (alive) setUri(local.uri);
      } catch {
        // not uploaded yet from the other phone; initials show meanwhile
      }
    })();
    return () => {
      alive = false;
    };
  }, [path]);
  return uri;
}

/** Removes all local photos (sign-out). */
export function deleteLocalAvatars() {
  try {
    const d = dir();
    if (d.exists) d.delete();
  } catch {
    // ignore
  }
}
