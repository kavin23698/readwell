// Kit Chip: pill toggle / label.
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, font, gradients, linear, shadow } from '@/theme';

export type ChipProps = { children?: ReactNode; on?: boolean; icon?: IconName; onPress?: () => void };

export function Chip({ children, on, icon, onPress }: ChipProps) {
  const fg = on ? '#ffffff' : colors.rwInk;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!on } : undefined}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={4}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        backgroundImage: linear(on ? gradients.primary : gradients.chip),
        boxShadow: on ? shadow.pill : shadow.raised,
      }}>
      {icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <Text numberOfLines={1} style={[font(700, 13, 1.2), { color: fg }]}>
        {children}
      </Text>
    </Pressable>
  );
}
