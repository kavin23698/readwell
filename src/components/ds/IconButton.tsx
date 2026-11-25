// DS IconButton (components/core/IconButton.jsx): round glass / accent button with optional badge.
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, gradients, linear, shadow } from '@/theme';
import { Icon, type IconName } from './Icon';

type Variant = 'glass' | 'accent';

const variants: Record<Variant, { container: ViewStyle; color: string }> = {
  glass: { container: { backgroundImage: linear(gradients.glassButton), borderColor: 'rgba(255,255,255,0.55)' }, color: colors.slate800 },
  accent: { container: { backgroundImage: linear(gradients.primary), borderColor: 'rgba(255,255,255,0.4)' }, color: '#ffffff' },
};

export type IconButtonProps = {
  icon: IconName;
  variant?: Variant;
  size?: number;
  badge?: number | string;
  label?: string;
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, variant = 'glass', size = 44, badge, label, color, onPress, style }: IconButtonProps) {
  const v = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        v.container,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
        style,
      ]}>
      <Icon name={icon} size={Math.round(size * 0.46)} color={color ?? v.color} />
      {badge != null ? (
        <View style={styles.badge}>
          <Text style={[font(700, 10, 1.8), { color: colors.textStrong }]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, boxShadow: shadow.raised },
  pressed: { transform: [{ scale: 0.94 }] },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.pill,
  },
});
