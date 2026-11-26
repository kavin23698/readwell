// DS StatCard (components/surfaces/StatCard.jsx): tinted card with icon tile, label, value, delta.
import { Text, View } from 'react-native';
import { colors, font, gradients, linear, radius, shadow, type } from '@/theme';
import { Icon, type IconName } from './Icon';

const tones = {
  teal: { bg: gradients.statTeal, fg: colors.textStrong, delta: colors.sage700 },
  mist: { bg: gradients.statMist, fg: colors.textStrong, delta: colors.sage700 },
  ice: { bg: gradients.statIce, fg: colors.textStrong, delta: colors.sage700 },
  peri: { bg: gradients.statPeri, fg: '#121a30', delta: '#1d2440' },
} as const;

export function StatCard({ icon, label, value, delta, tone = 'teal' }: { icon: IconName; label: string; value: string; delta?: string; tone?: keyof typeof tones }) {
  const t = tones[tone];
  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        borderRadius: radius.lg,
        backgroundImage: linear(t.bg, 160),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
        boxShadow: shadow.card,
      }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: linear(['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.2)']),
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.6)',
          boxShadow: shadow.raised,
          marginBottom: 22,
        }}>
        <Icon name={icon} size={26} color={colors.slate800} />
      </View>
      <Text style={[type.statLabel, { color: t.fg }]}>{label}</Text>
      <Text style={[type.statValue, { color: t.fg, marginTop: 6, marginBottom: 10 }]}>{value}</Text>
      {delta ? <Text style={[font(500, 13, 1.35), { color: t.delta }]}>{delta}</Text> : null}
    </View>
  );
}
