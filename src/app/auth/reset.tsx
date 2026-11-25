// readwell://auth/reset?code=… — the password-reset link lands here, then "Set a new password".
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { LinkResult } from '@/features/auth/LinkResult';
import { supabase } from '@/lib/supabase';

export default function AuthReset() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { setRecovering } = useAuth();
  const [error, setError] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (error_description || !code) {
        setError({ title: 'This link has expired', body: 'Reset links work for 1 hour. Request a new one from the log-in screen.' });
        return;
      }
      setRecovering(true);
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (exchangeError) {
        setRecovering(false);
        setError({
          title: 'This link can’t be used here',
          body: 'Open the reset email on the phone where you asked for it, or request a new link.',
        });
        return;
      }
      router.replace('/set-password');
    })();
    return () => {
      cancelled = true;
    };
  }, [code, error_description, setRecovering]);

  return <LinkResult busyText="Opening your reset link…" error={error} />;
}
