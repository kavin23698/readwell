// Screen 68 · Edit profile: name, email (change sends a confirmation), password.
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Banner } from '@/components/kit/Banner';
import { Field } from '@/components/kit/Field';
import { Initials } from '@/components/kit/Initials';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Lnk } from '@/components/kit/Typography';
import { useAuth } from '@/features/auth/AuthProvider';
import { friendlyAuthError, isOffline, isValidEmail, OFFLINE_MESSAGE } from '@/features/auth/errors';
import { useProfile } from '@/features/profile/ProfileProvider';
import { authRedirects, supabase } from '@/lib/supabase';

export default function EditProfile() {
  const { session } = useAuth();
  const { profile, update } = useProfile();
  const currentEmail = session?.user.email ?? '';
  const [name, setName] = useState(profile?.display_name ?? '');
  const [email, setEmail] = useState(currentEmail);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const nameError = !name.trim() ? 'Tell us what to call you.' : null;
  const emailError = !isValidEmail(email) ? 'Enter a valid email, like name@example.com' : null;
  const changed = name.trim() !== (profile?.display_name ?? '') || email.trim().toLowerCase() !== currentEmail;

  async function save() {
    if (nameError || emailError) return;
    setBusy(true);
    setMessage(null);
    if (name.trim() !== profile?.display_name) await update({ display_name: name.trim() });
    const newEmail = email.trim().toLowerCase();
    if (newEmail !== currentEmail) {
      if (await isOffline()) {
        setBusy(false);
        return setMessage({ text: `${OFFLINE_MESSAGE.replace('sign in', 'change your email')}`, ok: false });
      }
      const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: authRedirects.confirm });
      setBusy(false);
      if (error) return setMessage({ text: friendlyAuthError(error), ok: false });
      return setMessage({ text: `Check ${newEmail} and tap the link to confirm the change.`, ok: true });
    }
    setBusy(false);
    router.back();
  }

  return (
    <Screen>
      <AppBar title="Edit profile" />
      <Body gap={14}>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Initials name={name || profile?.display_name} size={104} />
        </View>
        {message ? (
          <Banner icon={message.ok ? 'mail-check' : 'circle-alert'} tone={message.ok ? 'info' : 'danger'}>
            {message.text}
          </Banner>
        ) : null}
        <Field label="Name" icon="user" value={name} onChangeText={setName} autoComplete="name" error={name ? null : nameError} />
        <Field
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={email && emailError ? emailError : null}
          hint="Changing your email means confirming the new address."
        />
        <Field label="Password" icon="lock" value="••••••••••" editable={false} right={<Lnk onPress={() => router.push('/settings/password')}>Change</Lnk>} />
      </Body>
      <Actions>
        <Button fullWidth size="lg" disabled={!changed || busy || !!nameError || !!emailError} onPress={save}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </Actions>
    </Screen>
  );
}
