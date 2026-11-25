// Kit text roles: H (heading), P (paragraph), Meta, Micro (uppercase label), Lnk (inline link).
import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { colors, font } from '@/theme';

type TProps = { children?: ReactNode; c?: string; style?: StyleProp<TextStyle>; numberOfLines?: number };

export function H({ children, s = 24, c, style, numberOfLines }: TProps & { s?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[font(800, s, 1.2), { color: c ?? colors.rwInk }, style]}>
      {children}
    </Text>
  );
}

export function P({ children, s = 14, c, style, numberOfLines }: TProps & { s?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[font(500, s, 1.5), { color: c ?? colors.rwBody }, style]}>
      {children}
    </Text>
  );
}

export function Meta({ children, c, style, numberOfLines }: TProps) {
  return (
    <Text numberOfLines={numberOfLines} style={[font(600, 12, 1.35), { color: c ?? colors.rwSec }, style]}>
      {children}
    </Text>
  );
}

export function Micro({ children, c, style }: TProps) {
  return (
    <Text style={[font(800, 11, 1.2), { letterSpacing: 0.6, textTransform: 'uppercase', color: c ?? colors.rwSec }, style]}>
      {children}
    </Text>
  );
}

export function Lnk({ children, c, onPress }: TProps & { onPress?: () => void }) {
  return (
    <Text
      onPress={onPress}
      suppressHighlighting
      style={[font(700, 14, 1.4), { color: c ?? colors.navy700, textDecorationLine: 'underline' }]}>
      {children}
    </Text>
  );
}
