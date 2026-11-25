// Screen 16 · Reset link sent.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { AppBar } from '@/components/kit/AppBar';
import { Banner } from '@/components/kit/Banner';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, Lnk, P } from '@/components/kit/Typography';
import { sendResetLink } from '@/features/auth/sendResetLink';
import { useCooldown } from '@/features/auth/useCooldown';
import { colors, font } from '@/theme';

export default function ResetSent() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const cooldown = useCooldown(60, true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function resend() {
    if (cooldown.running) return;
    const problem = await sendResetLink(email);
    if (problem) return setMessage({ text: problem, ok: false });
    cooldown.start();
    setMessage({ text: 'Sent again — check your inbox (and spam folder).', ok: true });
  }

  const backToLogIn = () => router.replace({ pathname: '/log-in', params: { email } });

  return (
    <Screen>
      <AppBar close onBack={backToLogIn} />
      <Body gap={14} style={{ alignItems: 'center', paddingTop: 40 }}>
        <Tile icon="circle-check" size={112} />
        <H s={26} style={{ marginTop: 10, textAlign: 'center' }}>
          Reset link sent
        </H>
        <P style={{ textAlign: 'center' }}>
          If an account exists for <Text style={[font(800, 14, 1.5), { color: colors.rwInk }]}>{email}</Text>, you&apos;ll get
          an email with a link to set a new password. Open it on this phone. It expires in 1 hour.
        </P>
        {message ? (
          <View style={{ alignSelf: 'stretch' }}>
            <Banner icon={message.ok ? 'circle-check' : 'circle-alert'} tone={message.ok ? 'info' : 'danger'}>
              {message.text}
            </Banner>
          </View>
        ) : null}
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={backToLogIn}>
          Back to log in
        </Button>
        <View style={{ alignItems: 'center' }}>
          <P>
            Nothing yet?{' '}
            {cooldown.running ? (
              <Text style={[font(700, 14, 1.4), { color: colors.rwSec }]}>Resend in {cooldown.label}</Text>
            ) : (
              <Lnk onPress={resend}>Resend email</Lnk>
            )}
          </P>
        </View>
      </Actions>
    </Screen>
  );
}
