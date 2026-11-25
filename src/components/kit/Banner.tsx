// Inline alert box (from screen 14) — danger outline on glass, optional action.
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, font } from '@/theme';

export function Banner({ icon = 'shield-alert', children, action, tone = 'danger' }: { icon?: IconName; children: ReactNode; action?: ReactNode; tone?: 'danger' | 'info' }) {
  const c = tone === 'danger' ? colors.danger : colors.rwInk;
  return (
    <View
      accessibilityRole="alert"
      style={{
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1.5,
        borderColor: tone === 'danger' ? colors.danger : 'rgba(255,255,255,0.65)',
      }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name={icon} size={18} color={c} />
        <Text style={[font(700, 13, 1.35), { color: c, flex: 1 }]}>{children}</Text>
      </View>
      {action}
    </View>
  );
}
