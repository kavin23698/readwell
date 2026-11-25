// Set a new password — extra screen needed for the reset flow, styled from screen 15.
import { useState } from 'react';
import { Button } from '@/components/ds/Button';
import { Banner } from '@/components/kit/Banner';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { PasswordStrength } from '@/components/kit/PasswordStrength';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, P } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { friendlyAuthError, isOffline, OFFLINE_MESSAGE, passwordProblem } from '@/features/auth/errors';
import { supabase } from '@/lib/supabase';

export default function SetPassword() {
  const { setRecovering } = useAuth();
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwError = tried ? passwordProblem(password) : null;

  async function save() {
    setTried(true);
    setError(null);
    if (passwordProblem(password)) return;
    if (await isOffline()) return setError(OFFLINE_MESSAGE);
    setBusy(true);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) return setError(friendlyAuthError(e));
    setRecovering(false); // the root navigator moves on to the app
  }

  return (
    <Screen>
      <Body gap={14} style={{ paddingTop: 30 }}>
        <Tile icon="key-round" size={72} />
        <H s={26}>Set a new password</H>
        <P>Choose a password you haven&apos;t used here before.</P>
        {error ? <Banner icon="circle-alert">{error}</Banner> : null}
        <Field
          label="New password"
          icon="lock"
          password
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters, with a number"
          autoCapitalize="none"
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={save}
          error={pwError}
        />
        {!pwError ? <PasswordStrength password={password} /> : null}
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
        <Button fullWidth size="lg" variant="ghost" onPress={() => supabase.auth.signOut()}>
          Cancel
        </Button>
      </Actions>
    </Screen>
  );
}
