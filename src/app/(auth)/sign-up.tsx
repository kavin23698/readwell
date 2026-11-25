// Screens 10 + 11 · Sign up, with validation errors and "email already registered".
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View, type TextInputInstance } from 'react-native';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Banner } from '@/components/kit/Banner';
import { Field } from '@/components/kit/Field';
import { Actions, Body } from '@/components/kit/Layout';
import { PasswordStrength } from '@/components/kit/PasswordStrength';
import { Screen } from '@/components/kit/Screen';
import { H, Lnk, P } from '@/components/kit/Typography';
import { friendlyAuthError, isOffline, isValidEmail, OFFLINE_MESSAGE, passwordProblem } from '@/features/auth/errors';
import { authRedirects, supabase } from '@/lib/supabase';
import { colors, font } from '@/theme';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [taken, setTaken] = useState<string | null>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const pwRef = useRef<TextInputInstance>(null);

  const nameError = tried && !name.trim() ? 'Tell us what to call you.' : null;
  const emailError = tried && !isValidEmail(email) ? 'Enter a valid email, like name@example.com' : null;
  const pwError = tried ? passwordProblem(password) : null;
  const hasErrors = !!(nameError || emailError || pwError);

  async function submit() {
    setTried(true);
    setFormError(null);
    setTaken(null);
    if (!name.trim() || !isValidEmail(email) || passwordProblem(password)) return;
    if (await isOffline()) return setFormError(OFFLINE_MESSAGE);
    setBusy(true);
    const addr = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: addr,
      password,
      options: { data: { name: name.trim() }, emailRedirectTo: authRedirects.confirm },
    });
    setBusy(false);
    if (error) {
      if (error.code === 'user_already_exists') return setTaken(addr);
      return setFormError(friendlyAuthError(error));
    }
    // Supabase hides existing accounts: an already-confirmed email comes back with no identities.
    if (data.user && data.user.identities?.length === 0) return setTaken(addr);
    if (data.session) return; // email confirmation off → already signed in
    router.replace({ pathname: '/verify', params: { email: addr } });
  }

  return (
    <Screen>
      <AppBar />
      <Body gap={14}>
        <H s={26}>Create your account</H>
        <P>Your goal, progress and notes stay safe and sync across devices.</P>
        {formError ? <Banner icon="circle-alert">{formError}</Banner> : null}
        <Field
          label="Name"
          icon="user"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          error={nameError}
        />
        <Field
          ref={emailRef}
          label="Email"
          icon="mail"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setTaken(null);
          }}
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => pwRef.current?.focus()}
          error={emailError}
        />
        {taken ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Text style={[font(700, 12, 1.35), { color: colors.danger, flex: 1 }]}>
              {taken} already has an account.{' '}
              <Text
                style={{ textDecorationLine: 'underline' }}
                onPress={() => router.replace({ pathname: '/log-in', params: { email: taken } })}>
                Log in instead
              </Text>
            </Text>
          </View>
        ) : null}
        <Field
          ref={pwRef}
          label="Password"
          icon="lock"
          password
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters, with a number"
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
          error={pwError}
        />
        {!pwError ? <PasswordStrength password={password} /> : null}
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={submit} disabled={busy || (tried && hasErrors)}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
        <View style={{ alignItems: 'center' }}>
          <P>
            Already have an account? <Lnk onPress={() => router.replace('/log-in')}>Log in</Lnk>
          </P>
        </View>
      </Actions>
    </Screen>
  );
}
