// readwell://auth/callback?code=… — the confirm-email link lands here and signs the user in.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { LinkResult } from '@/features/auth/LinkResult';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [error, setError] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (error_description || !code) {
        setError({
          title: 'This link has expired',
          body: 'Confirmation links work for 1 hour. Log in and we’ll offer to send a new one.',
        });
        return;
      }
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (exchangeError) {
        // Supabase confirms the email before redirecting; the code only fails when the link
        // is opened on a different phone than the one used to sign up.
        setError({
          title: 'Your email is confirmed',
          body: 'Log in with your email and password to continue.',
        });
        return;
      }
      router.replace('/home');
    })();
    return () => {
      cancelled = true;
    };
  }, [code, error_description]);

  return <LinkResult busyText="Confirming your email…" error={error} />;
}
