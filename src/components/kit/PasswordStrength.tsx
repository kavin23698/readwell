// Strength meter under the password field (screen 10).
import { View } from 'react-native';
import { passwordStrength } from '@/features/auth/errors';
import { colors, gradients, linear } from '@/theme';
import { Prog } from './Prog';
import { Meta } from './Typography';

const levels = {
  1: { pct: 33, label: 'Weak password', color: linear(['#9a4652', colors.danger], 90), text: colors.danger },
  2: { pct: 66, label: 'Okay password', color: linear([colors.warmAmber, '#c98f4a'], 90), text: colors.rwSec },
  3: { pct: 100, label: 'Strong password', color: linear(gradients.positive, 90), text: colors.sage700 },
} as const;

export function PasswordStrength({ password }: { password: string }) {
  const s = passwordStrength(password);
  if (!s) return null;
  const l = levels[s];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Prog pct={l.pct} h={6} color={l.color} />
      </View>
      <Meta c={l.text}>{l.label}</Meta>
    </View>
  );
}
