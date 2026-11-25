// Screen 8 · Daily reminder time.
import { router } from 'expo-router';
import { Button } from '@/components/ds/Button';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { H, P } from '@/components/kit/Typography';
import { SetupTop } from '@/features/onboarding/OnboardingBars';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { TimeWheel } from '@/features/onboarding/TimeWheel';

export default function Reminder() {
  const { choices, set } = useOnboarding();
  return (
    <Screen>
      <SetupTop step={3} />
      <Body gap={16} style={{ paddingTop: 10 }}>
        <H s={26}>When should we remind you?</H>
        <P>Pick a time you&apos;re usually free. We&apos;ll send one gentle nudge a day.</P>
        <TimeWheel value={choices.reminder_time} onChange={(reminder_time) => set({ reminder_time })} />
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={() => router.push('/notifications')}>
          Continue
        </Button>
      </Actions>
    </Screen>
  );
}
