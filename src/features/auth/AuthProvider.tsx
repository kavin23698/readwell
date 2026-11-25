import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** False until the stored session has been read from disk. */
  ready: boolean;
  /** True while the user is setting a new password after a reset link. */
  recovering: boolean;
  setRecovering: (v: boolean) => void;
};

const AuthContext = createContext<AuthState>({
  session: null,
  ready: false,
  recovering: false,
  setRecovering: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, ready, recovering, setRecovering }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
