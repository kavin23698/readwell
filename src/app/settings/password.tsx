// Change password (from Edit profile).
import { router } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Banner } from '@/components/kit/Banner';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { PasswordStrength } from '@/components/kit/PasswordStrength';
import { Screen } from '@/components/kit/Screen';
import { P } from '@/components/kit/Typography';
import { friendlyAuthError, isOffline, OFFLINE_MESSAGE, passwordProblem } from '@/features/auth/errors';
import { supabase } from '@/lib/supabase';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwError = tried ? passwordProblem(password) : null;

  async function save() {
    setTried(true);
    setError(null);
    if (passwordProblem(password)) return;
    if (await isOffline()) return setError(OFFLINE_MESSAGE.replace('sign in', 'change your password'));
    setBusy(true);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) return setError(friendlyAuthError(e));
    router.back();
  }

  return (
    <Screen>
      <AppBar title="Change password" />
      <Body gap={14}>
        <P>Use at least 8 characters, including a number.</P>
        {error ? <Banner icon="circle-alert">{error}</Banner> : null}
        <Field label="New password" icon="lock" password value={password} onChangeText={setPassword} autoCapitalize="none" autoComplete="new-password" error={pwError} onSubmitEditing={save} />
        {!pwError ? <PasswordStrength password={password} /> : null}
      </Body>
      <Actions>
        <Button fullWidth size="lg" disabled={busy} onPress={save}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </Actions>
    </Screen>
  );
}
