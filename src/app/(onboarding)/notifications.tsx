// Screen 9 · Notification permission — explanation first, then the Android system prompt.
// Declining is fine: the app works without notifications.
import { useState } from 'react';
import { Button } from '@/components/ds/Button';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { Tile } from '@/components/kit/Tile';
import { H, P } from '@/components/kit/Typography';
import { requestNotificationPermission } from '@/features/notifications/permissions';
import { SetupTop } from '@/features/onboarding/OnboardingBars';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { formatTime } from '@/lib/time';

export default function NotificationPermission() {
  const { choices, finish } = useOnboarding();
  const [busy, setBusy] = useState(false);

  async function allow() {
    setBusy(true);
    try {
      await requestNotificationPermission();
    } finally {
      await finish();
      setBusy(false);
    }
  }

  async function skip() {
    setBusy(true);
    await finish();
    setBusy(false);
  }

  return (
    <Screen>
      <SetupTop step={4} />
      <Body gap={16} style={{ paddingTop: 30, alignItems: 'center' }}>
        <Tile icon="bell-ring" size={104} />
        <H s={26} style={{ textAlign: 'center' }}>
          Never miss a reading day
        </H>
        <P style={{ textAlign: 'center' }}>
          One reminder at {formatTime(choices.reminder_time)}, plus a nudge if your streak is at risk. Turn any of them off in
          Settings.
        </P>
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={allow} disabled={busy}>
          Allow notifications
        </Button>
        <Button fullWidth size="lg" variant="ghost" onPress={skip} disabled={busy}>
          Not now
        </Button>
      </Actions>
    </Screen>
  );
}
