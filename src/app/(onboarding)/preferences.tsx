// Screen 7 · Reading preferences: default reading mode + translation language.
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Actions, Body } from '@/components/kit/Layout';
import { Screen } from '@/components/kit/Screen';
import { H, Meta, Micro } from '@/components/kit/Typography';
import { LanguagePicker } from '@/features/onboarding/LanguagePicker';
import { ModeOption } from '@/features/onboarding/ModeOption';
import { SetupTop } from '@/features/onboarding/OnboardingBars';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';

export default function Preferences() {
  const { choices, set } = useOnboarding();
  return (
    <Screen>
      <SetupTop step={2} />
      <Body gap={14} style={{ paddingTop: 10 }}>
        <H s={26}>How do you like to read?</H>
        <Micro>Default reading mode</Micro>
        <View accessibilityRole="radiogroup" style={{ gap: 14 }}>
          <ModeOption
            icon="book-open"
            title="Slide"
            body="Swipe to turn pages, like a paperback"
            on={choices.reading_mode === 'slide'}
            onPress={() => set({ reading_mode: 'slide' })}
          />
          <ModeOption
            icon="scroll-text"
            title="Scroll"
            body="One continuous page, top to bottom"
            on={choices.reading_mode === 'scroll'}
            onPress={() => set({ reading_mode: 'scroll' })}
          />
        </View>
        <View style={{ height: 4 }} />
        <LanguagePicker
          value={choices.translation_language}
          onChange={(translation_language) => set({ translation_language })}
          hint="Used when you tap Translate on a passage."
        />
        <Meta>You can change both later in Settings.</Meta>
      </Body>
      <Actions>
        <Button fullWidth size="lg" onPress={() => router.push('/reminder')}>
          Continue
        </Button>
      </Actions>
    </Screen>
  );
}
