// Shared UI for the email-link handlers: spinner while exchanging the code, then an error state.
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, P } from '@/components/kit/Typography';
import { colors } from '@/theme';

export function LinkResult({ busyText, error }: { busyText: string; error: { title: string; body: string } | null }) {
  if (!error) {
    return (
      <Screen>
        <Body scroll={false} style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={colors.teal700} />
          <P>{busyText}</P>
        </Body>
      </Screen>
    );
  }
  return (
    <Screen>
      <Body style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Tile icon="circle-alert" size={104} />
        <H s={21} style={{ textAlign: 'center', marginTop: 8 }}>
          {error.title}
        </H>
        <P style={{ textAlign: 'center' }}>{error.body}</P>
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={() => router.replace('/log-in')}>
          Go to log in
        </Button>
      </Actions>
    </Screen>
  );
}
