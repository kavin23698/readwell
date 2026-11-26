// Runs the sync engine at the right moments and exposes its status to the UI:
// sign-in, coming back online, app returning to the foreground, every minute, and after local writes.
import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { pendingChanges, wipeLocalData } from '@/db';
import { useAuth } from '@/features/auth/AuthProvider';
import { deleteAllLocalFiles } from '@/features/library/bookActions';
import { runUploads } from '@/features/library/uploader';
import { deleteLocalAvatars, ensureAvatarUploaded } from '@/features/profile/avatar';
import { one } from '@/db';
import { supabase } from '@/lib/supabase';
import { onSyncStatus, setSyncPaused, syncNow, type SyncResult } from './engine';

type SyncState = {
  online: boolean;
  syncing: boolean;
  /** Local changes not yet on the server. */
  pending: number;
  /** Set when a sync failed while online (screen 74). */
  problem: string | null;
  /** True once the first sync after sign-in has finished (or failed). */
  initialSyncDone: boolean;
  retry: () => void;
};

const SyncContext = createContext<SyncState>({
  online: true,
  syncing: false,
  pending: 0,
  problem: null,
  initialSyncDone: false,
  retry: () => {},
});

const PERIOD_MS = 60_000;

export function SyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const onlineRef = useRef(true);

  const refreshPending = useCallback(() => {
    pendingChanges().then(setPending).catch(() => {});
  }, []);

  const handleResult = useCallback(
    (r: SyncResult) => {
      if (!onlineRef.current) return; // offline: the banner explains it, not an error
      if (r.error || r.failed) setProblem(r.error ?? 'Some changes could not be saved to your account.');
      else setProblem(null);
      runUploads(); // book files waiting for the cloud
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user.id;
        if (uid) one('profiles', uid).then(ensureAvatarUploaded); // photo picked while offline
      });
    },
    [],
  );

  // Engine status → UI.
  useEffect(
    () =>
      onSyncStatus(({ syncing: s, result }) => {
        setSyncing(s);
        if (result) handleResult(result);
        refreshPending();
      }),
    [handleResult, refreshPending],
  );

  // Connectivity.
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected !== false && state.isInternetReachable !== false;
      const cameBack = isOnline && !onlineRef.current;
      onlineRef.current = isOnline;
      setOnline(isOnline);
      setSyncPaused(!isOnline);
      if (!isOnline) setProblem(null);
      if (cameBack) syncNow();
    });
    return unsub;
  }, []);

  // Sign-in: first sync. Sign-out: wipe this account's data from the device.
  useEffect(() => {
    if (!userId) return;
    setInitialSyncDone(false);
    let cancelled = false;
    syncNow().finally(() => {
      if (!cancelled) setInitialSyncDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        deleteAllLocalFiles();
        deleteLocalAvatars();
        wipeLocalData().then(refreshPending);
        setProblem(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refreshPending]);

  // Foreground + periodic.
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncNow();
    });
    const t = setInterval(() => {
      if (AppState.currentState === 'active') syncNow();
    }, PERIOD_MS);
    return () => {
      sub.remove();
      clearInterval(t);
    };
  }, [userId]);

  const retry = useCallback(() => {
    setProblem(null);
    syncNow();
  }, []);

  return (
    <SyncContext.Provider value={{ online, syncing, pending, problem, initialSyncDone, retry }}>{children}</SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
