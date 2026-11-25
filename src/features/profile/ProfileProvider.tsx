// Loads the signed-in user's profile (cached on the device for offline use) and applies onboarding
// choices made before the account existed. Feature 3 moves this onto the SQLite sync engine.
import Storage from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { clearPendingOnboarding, readPendingOnboarding } from './pendingOnboarding';
import type { Profile } from './types';

type ProfileState = {
  profile: Profile | null;
  /** True once we know the profile (or know there's no session). */
  loaded: boolean;
  update: (patch: Partial<Profile>) => Promise<string | null>;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState>({
  profile: null,
  loaded: false,
  update: async () => null,
  refresh: async () => {},
});

const cacheKey = (userId: string) => `profile:${userId}`;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const save = useCallback(async (p: Profile) => {
    setProfile(p);
    await Storage.setItem(cacheKey(p.user_id), JSON.stringify(p));
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoaded(true);
      return;
    }
    // 1. Cached copy first (works offline).
    const cached = await Storage.getItem(cacheKey(userId));
    if (cached) {
      setProfile(JSON.parse(cached) as Profile);
      setLoaded(true);
    }
    // 2. Fresh copy from Supabase.
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error || !data) {
      setLoaded(true);
      return;
    }
    let p = data as Profile;
    // 3. Apply choices from onboarding done before sign-up (only once per account).
    const pending = await readPendingOnboarding();
    if (pending) {
      if (!p.onboarding_completed) {
        const patch = { ...pending, onboarding_completed: true, updated_at: new Date().toISOString() };
        const res = await supabase.from('profiles').update(patch).eq('user_id', userId).select('*').single();
        if (!res.error && res.data) p = res.data as Profile;
      }
      await clearPendingOnboarding();
    }
    await save(p);
    setLoaded(true);
  }, [userId, save]);

  useEffect(() => {
    setLoaded(false);
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!userId || !profile) return 'Not signed in.';
      const next = { ...profile, ...patch, updated_at: new Date().toISOString() };
      await save(next); // optimistic
      const { error } = await supabase
        .from('profiles')
        .update({ ...patch, updated_at: next.updated_at })
        .eq('user_id', userId);
      return error ? error.message : null;
    },
    [userId, profile, save],
  );

  return <ProfileContext.Provider value={{ profile, loaded, update, refresh: load }}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => useContext(ProfileContext);
