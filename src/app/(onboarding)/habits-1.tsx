// Screen 3 · Habit science 1 — Habits take time (Lally et al., 2009).
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Prog } from '@/components/kit/Prog';
import { Meta, Micro } from '@/components/kit/Typography';
import { HabitPage } from '@/features/onboarding/HabitPage';
import { colors, font, palette, shadow } from '@/theme';

const markers = [
  { day: 18, label: '18 days', sub: 'Fastest' },
  { day: 66, label: '66 days', sub: 'Average' },
  { day: 254, label: '254 days', sub: 'Longest' },
];

function Marker({ label, sub, align }: { label: string; sub: string; align: 'flex-start' | 'center' | 'flex-end' }) {
  return (
    <View style={{ alignItems: align }}>
      <Text style={[font(800, 16, 1.1), { color: colors.rwInk }]}>{label}</Text>
      <Meta>{sub}</Meta>
    </View>
  );
}

function Dot() {
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: colors.navy700,
        boxShadow: shadow.pill,
      }}
    />
  );
}

export default function Habits1() {
  return (
    <HabitPage
      step={0}
      title="Habits take time"
      body="In a University College London study (Lally et al., 2009), people took between 18 and 254 days for a new daily behaviour to become automatic. The average was 66 days."
      onNext={() => router.push('/habits-2')}
      visual={
        <GlassCard padding={20}>
          <Micro>Days until a habit felt automatic</Micro>
          {/* Fastest sits above the bar (it's close to Average), the others below — as in the design. */}
          <View style={{ height: 128, marginTop: 6 }}>
            <View style={{ position: 'absolute', left: `${(18 / 254) * 100}%`, top: 0, transform: [{ translateX: -8 }] }}>
              <Marker label={markers[0].label} sub={markers[0].sub} align="flex-start" />
            </View>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 58 }}>
              <Prog pct={100} h={10} color={`linear-gradient(90deg, ${palette.teal300}, ${palette.teal600} 30%, ${palette.peri600})`} />
            </View>
            <View style={{ position: 'absolute', left: `${(18 / 254) * 100}%`, top: 55, transform: [{ translateX: -8 }] }}>
              <Dot />
            </View>
            <View style={{ position: 'absolute', left: `${(66 / 254) * 100}%`, top: 55, transform: [{ translateX: -40 }], width: 80, alignItems: 'center' }}>
              <Dot />
              <View style={{ marginTop: 10 }}>
                <Marker label={markers[1].label} sub={markers[1].sub} align="center" />
              </View>
            </View>
            <View style={{ position: 'absolute', right: 0, top: 55, alignItems: 'flex-end' }}>
              <Dot />
              <View style={{ marginTop: 10 }}>
                <Marker label={markers[2].label} sub={markers[2].sub} align="flex-end" />
              </View>
            </View>
          </View>
        </GlassCard>
      }
    />
  );
}
