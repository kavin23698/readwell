// Screen 4 · Habit science 2 — Why 254 days. Copy reworded to be accurate: 254 is the longest
// anyone in the study took (upper end of what was observed), not a requirement or a guarantee.
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Meta } from '@/components/kit/Typography';
import { HabitPage } from '@/features/onboarding/HabitPage';
import { colors } from '@/theme';

const COLS = 22;
const GAP = 4;
const days = Array.from({ length: 254 }, (_, i) => i);

export default function Habits2() {
  const [width, setWidth] = useState(0);
  const dot = width ? Math.floor((width - GAP * (COLS - 1)) / COLS) : 0;
  return (
    <HabitPage
      step={1}
      title="Why we plan for 254 days"
      body="254 days was the longest anyone in the study took — the upper end of what researchers saw, not a rule. Most people get there sooner. Planning for the full stretch means even slow starters have usually made reading automatic by the end. Each dot is one day."
      onNext={() => router.push('/habits-3')}
      visual={
        <GlassCard padding={18} gap={10}>
          <View
            accessible
            accessibilityLabel="254 dots, one per day. The first 66 are filled: the average time to form a habit."
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {dot > 0
              ? days.map((i) => (
                  <View
                    key={i}
                    style={{
                      width: dot,
                      height: dot,
                      borderRadius: dot / 2,
                      backgroundColor: i < 66 ? colors.teal500 : 'rgba(255,255,255,0.55)',
                    }}
                  />
                ))
              : null}
          </View>
          <View style={{ flexDirection: 'row', columnGap: 16, rowGap: 4, flexWrap: 'wrap' }}>
            <Meta>
              <Text style={{ color: colors.teal700 }}>●</Text> Day 1–66: the average
            </Meta>
            <Meta>○ Up to day 254: the longest observed</Meta>
          </View>
        </GlassCard>
      }
    />
  );
}
