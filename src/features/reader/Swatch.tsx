import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { colors, shadow } from '@/theme';

/** Conic "rainbow" used for the Custom swatch (SVG-free approximation of the design's conic-gradient). */
export const RAINBOW = 'linear-gradient(135deg, #f3d77a, #f0b8c4, #c9c3ea, #a9d4ec, #a8dcc4)';

export function Swatch({
  color,
  size = 44,
  on,
  label,
  onPress,
  children,
  rainbow,
}: {
  color?: string;
  size?: number;
  on?: boolean;
  label: string;
  onPress?: () => void;
  children?: ReactNode;
  rainbow?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      hitSlop={6}
      style={{ padding: on ? 0 : 0 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: rainbow ? undefined : color,
          backgroundImage: rainbow ? RAINBOW : undefined,
          borderWidth: 1,
          borderColor: 'rgba(20,36,52,0.12)',
          boxShadow: on ? `0 0 0 3px #ffffff, 0 0 0 6px ${colors.teal600}` : shadow.raised,
        }}>
        {children}
      </View>
    </Pressable>
  );
}
