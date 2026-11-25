// The signed-in user's profile, read from the local database (works offline) and kept in sync by
// the sync engine. Also applies onboarding choices made before the account existed.
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { one, patch, useLiveQuery } from '@/db';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSync } from '@/sync/SyncProvider';
import { clearPendingOnboarding, readPendingOnboarding } from './pendingOnboarding';
import type { Profile } from './types';

type ProfileState = {
  profile: Profile | null;
  /** True once we know the profile (or know there's no session). */
  loaded: boolean;
  update: (changes: Partial<Profile>) => Promise<void>;
};

const ProfileContext = createContext<ProfileState>({ profile: null, loaded: false, update: async () => {} });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { initialSyncDone } = useSync();
  const userId = session?.user.id ?? null;

  const profile = useLiveQuery(['profiles'], () => (userId ? one('profiles', userId) : Promise.resolve(null)), [userId]);

  // Onboarding done before sign-up → save it to the profile once (only if the account hasn't onboarded).
  useEffect(() => {
    if (!userId || !profile) return;
    let cancelled = false;
    (async () => {
      const pending = await readPendingOnboarding();
      if (!pending || cancelled) return;
      if (!profile.onboarding_completed) await patch('profiles', userId, { ...pending, onboarding_completed: true });
      await clearPendingOnboarding();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, profile]);

  const update = useCallback(
    async (changes: Partial<Profile>) => {
      if (userId) await patch('profiles', userId, changes);
    },
    [userId],
  );

  const loaded = !userId || (profile !== undefined && (profile !== null || initialSyncDone));

  return <ProfileContext.Provider value={{ profile: profile ?? null, loaded, update }}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => useContext(ProfileContext);
