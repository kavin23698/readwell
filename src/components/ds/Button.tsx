// DS Button (components/core/Button.jsx): primary / secondary / ghost, sm / md / lg, pill shape.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, gradients, linear, shadow } from '@/theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, { height: number; paddingHorizontal: number; fontSize: number; gap: number }> = {
  sm: { height: 28, paddingHorizontal: 12, fontSize: 12, gap: 6 },
  md: { height: 42, paddingHorizontal: 20, fontSize: 15, gap: 8 },
  lg: { height: 48, paddingHorizontal: 26, fontSize: 16, gap: 10 },
};

const variants: Record<Variant, { container: ViewStyle; color: string }> = {
  primary: {
    container: { backgroundImage: linear(gradients.primary), borderColor: 'rgba(255,255,255,0.35)', boxShadow: shadow.pill },
    color: colors.accentFg,
  },
  secondary: {
    container: { backgroundImage: linear(gradients.secondary), borderColor: 'rgba(255,255,255,0.6)', boxShadow: shadow.raised },
    color: colors.textStrong,
  },
  ghost: { container: { backgroundColor: 'transparent', borderColor: 'transparent' }, color: colors.textStrong },
  danger: {
    container: { backgroundImage: linear(gradients.danger), borderColor: 'rgba(255,255,255,0.35)', boxShadow: shadow.pill },
    color: colors.accentFg,
  },
};

export type ButtonProps = {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ children, variant = 'primary', size = 'md', icon, disabled, fullWidth, onPress, color, style }: ButtonProps) {
  const s = sizes[size];
  const v = variants[variant];
  const fg = color ?? v.color;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        v.container,
        { height: s.height, paddingHorizontal: s.paddingHorizontal, gap: s.gap },
        fullWidth && styles.full,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {icon ? <Icon name={icon} size={s.fontSize + 2} color={fg} /> : null}
      {children != null ? (
        <View>
          <Text numberOfLines={1} style={[font(600, s.fontSize, 1.2), { color: fg }]}>
            {children}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  full: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ translateY: 1 }, { scale: 0.98 }] },
});
