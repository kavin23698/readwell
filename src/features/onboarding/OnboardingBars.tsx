// Top bars from rw-a-onboarding.jsx: OnbTop (step dots + Skip) and SetupTop (Step N of 4 + progress).
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Prog } from '@/components/kit/Prog';
import { Meta } from '@/components/kit/Typography';
import { colors, shadow } from '@/theme';

const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

export function OnbTop({ step }: { step: 0 | 1 | 2 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 6 }}>
      <IconButton icon="chevron-left" size={44} label="Back" onPress={back} />
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessibilityLabel={`Page ${step + 1} of 3`}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: i === step ? 26 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === step ? colors.teal600 : 'rgba(255,255,255,0.6)',
              boxShadow: i === step ? shadow.pill : shadow.inset,
            }}
          />
        ))}
      </View>
      <Button variant="ghost" onPress={() => router.push('/goal')}>
        Skip
      </Button>
    </View>
  );
}

export function SetupTop({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
      <IconButton icon="chevron-left" size={44} label="Back" onPress={back} />
      <View style={{ flex: 1 }}>
        <Meta style={{ marginBottom: 6 }}>Step {step} of 4</Meta>
        <Prog pct={step * 25} h={6} />
      </View>
      <View style={{ width: 20 }} />
    </View>
  );
}
