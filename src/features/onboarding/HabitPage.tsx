// Layout shared by the three habit-science screens (3–5).
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { H, P } from '@/components/kit/Typography';
import { OnbTop } from './OnboardingBars';

export function HabitPage({
  step,
  visual,
  title,
  body,
  cta = 'Next',
  onNext,
}: {
  step: 0 | 1 | 2;
  visual: ReactNode;
  title: string;
  body: string;
  cta?: string;
  onNext: () => void;
}) {
  return (
    <Screen>
      <OnbTop step={step} />
      <Body gap={16} style={{ paddingTop: 8 }}>
        <View style={{ flex: 1, minHeight: 200, justifyContent: 'center' }}>{visual}</View>
        <H s={28}>{title}</H>
        <P s={15}>{body}</P>
      </Body>
      <Actions style={{ paddingTop: 18, paddingBottom: 16 }}>
        <Button fullWidth size="lg" onPress={onNext}>
          {cta}
        </Button>
      </Actions>
    </Screen>
  );
}
