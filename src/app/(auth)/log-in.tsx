// Screens 13 + 14 · Log in, with wrong-password / rate-limit / unconfirmed-email states.
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View, type TextInputInstance } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Banner } from '@/components/kit/Banner';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { H, Lnk, P } from '@/components/kit/Typography';
import { friendlyAuthError, isOffline, isValidEmail, OFFLINE_MESSAGE } from '@/features/auth/errors';
import { authRedirects, supabase } from '@/lib/supabase';
import { colors, font } from '@/theme';

type Problem =
  | { kind: 'password'; text: string }
  | { kind: 'banner'; text: string }
  | { kind: 'unconfirmed'; text: string };

export default function LogIn() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const pwRef = useRef<TextInputInstance>(null);

  async function submit() {
    setProblem(null);
    if (!isValidEmail(email)) return setEmailError('Enter a valid email, like name@example.com');
    setEmailError(null);
    if (!password) return setProblem({ kind: 'password', text: 'Enter your password.' });
    if (await isOffline()) return setProblem({ kind: 'banner', text: OFFLINE_MESSAGE });
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (!error) return; // the root navigator switches to the app
    const text = friendlyAuthError(error);
    if (error.code === 'email_not_confirmed') return setProblem({ kind: 'unconfirmed', text });
    if (error.code === 'invalid_credentials') return setProblem({ kind: 'password', text });
    setProblem({ kind: 'banner', text });
  }

  async function resendConfirmation() {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: authRedirects.confirm },
    });
    if (error) return setProblem({ kind: 'banner', text: friendlyAuthError(error) });
    setResent(true);
  }

  return (
    <Screen>
      <Body gap={14} style={{ paddingTop: 30 }}>
        <Text style={[font(800, 22, 1), { color: colors.navy700, marginBottom: 20 }]}>Readwell</Text>
        <H s={26}>Welcome back</H>
        <P>Log in to pick up right where you left off.</P>
        {problem?.kind === 'banner' ? <Banner>{problem.text}</Banner> : null}
        {problem?.kind === 'unconfirmed' ? (
          <Banner
            icon="mail"
            action={
              resent ? (
                <Text style={[font(700, 12, 1.35), { color: colors.sage700 }]}>Sent — check your inbox.</Text>
              ) : (
                <Button size="sm" variant="secondary" onPress={resendConfirmation}>
                  Resend confirmation email
                </Button>
              )
            }>
            {problem.text}
          </Banner>
        ) : null}
        <Field
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => pwRef.current?.focus()}
          error={emailError}
        />
        <Field
          ref={pwRef}
          label="Password"
          icon="lock"
          password
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (problem?.kind === 'password') setProblem(null);
          }}
          placeholder="Your password"
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={problem?.kind === 'password' ? problem.text : null}
        />
        <View style={{ alignSelf: 'flex-end' }}>
          <Lnk onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}>Forgot password?</Lnk>
        </View>
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={submit} disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
        <View style={{ alignItems: 'center' }}>
          <P>
            New to Readwell? <Lnk onPress={() => router.replace('/sign-up')}>Create an account</Lnk>
          </P>
        </View>
      </Actions>
    </Screen>
  );
}
