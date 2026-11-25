// Screen 5 · Habit science 3 — Missing a day is okay.
import { router } from 'expo-router';
import { View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Icon } from '@/components/ds/Icon';
import { Meta, Micro } from '@/components/kit/Typography';
import { HabitPage } from '@/features/onboarding/HabitPage';
import { colors, gradients, linear, shadow } from '@/theme';

const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Habits3() {
  return (
    <HabitPage
      step={2}
      cta="Set my goal"
      title="Missing a day is okay"
      body="The same study found that missing a single day didn't undo the habit. Consistency over time is what counts — just pick the book back up tomorrow."
      onNext={() => router.push('/goal')}
      visual={
        <GlassCard padding={20} gap={10}>
          <Micro>A real week</Micro>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessible accessibilityLabel="Read on 6 of 7 days, missed Thursday">
            {week.map((d, i) => {
              const miss = i === 3;
              return (
                <View key={i} style={{ alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: miss ? undefined : linear(gradients.primary),
                      borderWidth: miss ? 2 : 1,
                      borderStyle: miss ? 'dashed' : 'solid',
                      borderColor: miss ? colors.slate600 : 'rgba(255,255,255,0.5)',
                      boxShadow: miss ? undefined : shadow.pill,
                    }}>
                    {!miss ? <Icon name="check" size={18} strokeWidth={3} color="#fff" /> : null}
                  </View>
                  <Meta>{d}</Meta>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Icon name="trending-up" size={18} color={colors.sage700} />
            <Meta c={colors.sage700}>6 of 7 days — the habit is still growing</Meta>
          </View>
        </GlassCard>
      }
    />
  );
}
