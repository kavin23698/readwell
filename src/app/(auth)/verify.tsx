// Screen 12 · Verify email ("Check your inbox").
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Banner } from '@/components/kit/Banner';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, Lnk, Meta, P } from '@/components/kit/Typography';
import { friendlyAuthError, isOffline, OFFLINE_MESSAGE } from '@/features/auth/errors';
import { openEmailApp } from '@/features/auth/openEmailApp';
import { useCooldown } from '@/features/auth/useCooldown';
import { authRedirects, supabase } from '@/lib/supabase';
import { colors, font } from '@/theme';

export default function Verify() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const cooldown = useCooldown(60, true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function resend() {
    setMessage(null);
    if (await isOffline()) return setMessage({ text: OFFLINE_MESSAGE, ok: false });
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: authRedirects.confirm } });
    if (error) return setMessage({ text: friendlyAuthError(error), ok: false });
    cooldown.start();
    setMessage({ text: 'Sent — check your inbox (and spam folder).', ok: true });
  }

  return (
    <Screen>
      <AppBar />
      <Body gap={14} style={{ alignItems: 'center', paddingTop: 30 }}>
        <Tile icon="mail-check" size={112} />
        <H s={26} style={{ marginTop: 10, textAlign: 'center' }}>
          Check your inbox
        </H>
        <P style={{ textAlign: 'center' }}>
          We sent a verification link to <Text style={[font(800, 14, 1.5), { color: colors.rwInk }]}>{email}</Text>. Tap it
          on this phone to start your 254-day journey.
        </P>
        <Meta style={{ marginTop: 6 }}>The link expires in 1 hour.</Meta>
        {message ? (
          <View style={{ alignSelf: 'stretch' }}>
            <Banner icon={message.ok ? 'circle-check' : 'circle-alert'} tone={message.ok ? 'info' : 'danger'}>
              {message.text}
            </Banner>
          </View>
        ) : null}
      </Body>
      <Actions>
        <Button fullWidth size="lg" icon="mail" onPress={openEmailApp}>
          Open email app
        </Button>
        <Button fullWidth size="lg" variant="secondary" disabled={cooldown.running} onPress={resend}>
          {cooldown.running ? `Resend link in ${cooldown.label}` : 'Resend link'}
        </Button>
        <View style={{ alignItems: 'center' }}>
          <P>
            Wrong email? <Lnk onPress={() => router.replace('/sign-up')}>Change it</Lnk>
          </P>
        </View>
      </Actions>
    </Screen>
  );
}
