// DS GlassCard (components/surfaces/GlassCard.jsx). The canvas disables backdrop blur, so none here.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, gradients, linear, radius, shadow, type } from '@/theme';

export type GlassCardProps = {
  title?: string;
  action?: ReactNode;
  children?: ReactNode;
  padding?: number | { vertical: number; horizontal: number };
  tone?: 'light' | 'dark';
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

export function GlassCard({ title, action, children, padding = 20, tone = 'light', gap = 14, style }: GlassCardProps) {
  const dark = tone === 'dark';
  const pad = typeof padding === 'number' ? { padding } : { paddingVertical: padding.vertical, paddingHorizontal: padding.horizontal };
  return (
    <View style={[styles.card, { backgroundImage: linear(dark ? gradients.glassCardDark : gradients.glassCard), gap }, pad, style]}>
      {title || action ? (
        <View style={styles.header}>
          <Text style={[type.cardTitle, { color: dark ? colors.textOnDark : colors.textStrong, flexShrink: 1 }]}>{title}</Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.borderGlassSoft,
    borderRadius: radius.lg,
    boxShadow: shadow.card,
    minWidth: 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
