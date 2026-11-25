// Screen 6 · Set daily reading goal (minutes or pages; default 15 minutes).
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { H, Meta, P } from '@/components/kit/Typography';
import { GoalEditor, goalHint } from '@/features/onboarding/GoalEditor';
import { SetupTop } from '@/features/onboarding/OnboardingBars';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { colors } from '@/theme';

export default function Goal() {
  const { choices, set } = useOnboarding();
  return (
    <Screen>
      <SetupTop step={1} />
      <Body gap={18} style={{ paddingTop: 10 }}>
        <H s={26}>Set your daily goal</H>
        <P>Small and steady beats big and rare. You can change this any time.</P>
        <GoalEditor
          type={choices.goal_type}
          value={choices.daily_goal}
          onChange={(goal_type, daily_goal) => set({ goal_type, daily_goal })}
        />
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="info" size={18} color={colors.slate800} />
          <Meta style={{ flex: 1 }}>{goalHint(choices.goal_type, choices.daily_goal)}</Meta>
        </View>
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={() => router.push('/preferences')}>
          Continue
        </Button>
      </Actions>
    </Screen>
  );
}
