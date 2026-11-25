// tokens/typography.css — Nunito 400–800.
import type { TextStyle } from 'react-native';

export const fontFamilies = {
  400: 'Nunito_400Regular',
  500: 'Nunito_500Medium',
  600: 'Nunito_600SemiBold',
  700: 'Nunito_700Bold',
  800: 'Nunito_800ExtraBold',
} as const;

export type FontWeight = keyof typeof fontFamilies;

export const fontSize = { 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 18: 18, 20: 20, 22: 22, 28: 28, 32: 32 } as const;
export const lineHeight = { tight: 1.15, snug: 1.3, body: 1.45 } as const;

/** Equivalent of the kit's rwF(weight, size, lineHeight) CSS shorthand. */
export function font(weight: FontWeight, size: number, lh = 1.4): TextStyle {
  return { fontFamily: fontFamilies[weight], fontSize: size, lineHeight: Math.round(size * lh) };
}

export const type = {
  pageTitle: font(600, 32, 1.1),
  greeting: font(600, 22, 1.25),
  cardTitle: font(600, 15, 1.3),
  statValue: font(700, 28, 1.1),
  statLabel: font(600, 14, 1.3),
  body: font(500, 14, 1.45),
  caption: font(500, 13, 1.35),
  micro: font(600, 11, 1.2),
  nav: font(500, 15, 1.2),
  button: font(600, 15, 1),
} as const;
