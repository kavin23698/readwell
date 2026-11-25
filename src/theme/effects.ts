// tokens/effects.css — "clay glass" shadows. React Native (New Architecture) supports
// CSS-style multi-layer boxShadow including `inset`, so these are carried over as-is.
import { Easing } from 'react-native-reanimated';

export const shadow = {
  card: '0 10px 24px -8px rgba(20,36,52,0.35), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(20,36,52,0.12)',
  raised: '0 6px 14px -4px rgba(20,36,52,0.4), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -3px 6px rgba(20,36,52,0.15)',
  pill: '0 4px 10px -2px rgba(20,36,52,0.35), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 4px rgba(10,30,40,0.25)',
  inset: 'inset 0 2px 5px rgba(20,36,52,0.25), inset 0 -1px 0 rgba(255,255,255,0.4)',
  sidebar: '0 16px 40px -10px rgba(10,20,35,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
  dialog: '0 24px 48px -12px rgba(10,20,35,0.6), inset 0 1px 0 #ffffff',
  sheet: '0 -12px 40px -8px rgba(10,20,35,0.45), inset 0 1px 0 #ffffff',
  bar: 'inset 0 2px 0 rgba(255,255,255,0.35), inset -3px 0 4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(20,36,52,0.35)',
} as const;

/** Emboss text shadow: RN supports one text shadow, so only the white highlight layer is kept. */
export const embossText = {
  textShadowColor: 'rgba(255,255,255,0.6)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
} as const;

export const motion = {
  fast: 140,
  base: 220,
  easeSoft: Easing.bezier(0.3, 0.7, 0.3, 1),
} as const;
