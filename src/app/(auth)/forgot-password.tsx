// Screen 15 · Forgot password.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Banner } from '@/components/kit/Banner';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, P } from '@/components/kit/Typography';
import { isValidEmail } from '@/features/auth/errors';
import { sendResetLink } from '@/features/auth/sendResetLink';

export default function ForgotPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!isValidEmail(email)) return setEmailError('Enter a valid email, like name@example.com');
    setEmailError(null);
    setBusy(true);
    const addr = email.trim().toLowerCase();
    const problem = await sendResetLink(addr);
    setBusy(false);
    if (problem) return setError(problem);
    router.replace({ pathname: '/reset-sent', params: { email: addr } });
  }

  return (
    <Screen>
      <AppBar />
      <Body gap={14}>
        <Tile icon="key-round" size={72} />
        <H s={26}>Reset your password</H>
        <P>Enter the email you signed up with and we&apos;ll send you a link to set a new password.</P>
        {error ? <Banner icon="circle-alert">{error}</Banner> : null}
        <Field
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={submit}
          error={emailError}
        />
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={submit} disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </Button>
      </Actions>
    </Screen>
  );
}
