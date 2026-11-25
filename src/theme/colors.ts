// Kavin Design System colour tokens (tokens/colors.css) + Readwell extras (readwell/rw-kit.jsx).

export const palette = {
  slate50: '#dce6ec',
  slate100: '#bdd6e2',
  slate200: '#a6bcc9',
  slate300: '#92a8b6',
  slate400: '#869caa',
  slate500: '#6d8492',
  slate600: '#5e707c',
  slate700: '#4d6474',
  slate800: '#424f57',

  navy600: '#2b4560',
  navy700: '#1f344a',
  navy800: '#1c2e43',
  navy900: '#15233a',

  teal100: '#b4dadf',
  teal200: '#84b5ba',
  teal300: '#79b1b3',
  teal400: '#5a9fa9',
  teal500: '#3e7f8c',
  teal600: '#346a79',
  teal700: '#2e6a79',
  teal800: '#225c74',

  ice100: '#e3eff5',
  ice200: '#bdd6e2',
  ice300: '#abc7d5',
  sky400: '#7dc1cf',
  sky500: '#598eaf',
  blue600: '#3a7aa0',

  peri200: '#a9afcf',
  peri400: '#7486a8',
  peri500: '#727a9f',
  peri600: '#686497',
  peri700: '#52568e',
  indigo800: '#414484',

  sage400: '#539182',
  sage500: '#508580',
  sage700: '#2f5e57',

  white: '#ffffff',
  ink: '#1a2a38',
  warmAmber: '#e9b77a',
} as const;

export const colors = {
  ...palette,

  // Semantic
  bgPage: palette.slate300,
  bgSidebar: palette.navy700,
  bgHero: palette.slate700,
  surfaceGlass: 'rgba(255,255,255,0.18)',
  surfaceGlassStrong: 'rgba(255,255,255,0.32)',
  surfaceGlassDark: 'rgba(20,36,52,0.18)',
  surfaceInset: 'rgba(255,255,255,0.22)',
  borderGlass: 'rgba(255,255,255,0.38)',
  borderGlassSoft: 'rgba(255,255,255,0.2)',

  textStrong: '#16252f',
  textBody: '#2a3d4a',
  textMuted: '#4b5f6c',
  textOnDark: '#f2f6f9',
  textOnDarkMuted: '#a8b8c8',
  textTitleEmboss: '#e8eef2',
  textPositive: palette.sage700,

  accent: palette.teal500,
  accentHover: palette.teal400,
  accentPress: palette.teal600,
  accentFg: '#ffffff',

  badgeBg: palette.slate200,

  // Readwell kit
  rwInk: '#16252f',
  rwBody: '#2a3d4a',
  rwSec: palette.slate800,
  danger: '#7a2a36',
  paper: '#eef3f5',
  scrim: 'rgba(21,35,58,0.55)',
  scrimLight: 'rgba(21,35,58,0.28)',
  readerText: '#1a2a38',
} as const;

/** Two-stop gradients, top→bottom unless noted (CSS 160deg ≈ vertical). */
export const gradients = {
  page: ['#a3b7c3', '#8ba2b0'],
  dark: ['#2b4560', '#15233a'],
  primary: ['#4f95a1', palette.teal600],
  secondary: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.35)'],
  glassButton: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.22)'],
  glassCard: ['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.12)'],
  glassCardDark: ['rgba(40,62,82,0.35)', 'rgba(20,36,52,0.25)'],
  tile: ['rgba(255,255,255,0.62)', 'rgba(255,255,255,0.24)'],
  tileDark: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.05)'],
  chip: ['rgba(255,255,255,0.62)', 'rgba(255,255,255,0.32)'],
  field: ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.34)'],
  search: ['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.2)'],
  tabBar: ['#24394f', palette.navy800],
  tabActive: ['#e3edf1', '#a9c3cb'],
  segActive: ['#eef4f7', '#bcd2d9'],
  sheet: ['#edf3f5', '#cfdde3'],
  dialog: ['#eef4f6', '#cbdae0'],
  danger: ['#9a4652', '#7a2a36'],
  progress: [palette.teal400, palette.teal600],
  positive: [palette.sage400, palette.sage700],
  statTeal: ['#9fcdcd', '#79b1b3'],
  statMist: ['#c3d4de', '#a6bcc9'],
  statIce: ['#e3eff5', '#bdd6e2'],
  statPeri: ['#959dc0', '#727a9f'],
  promoDark: ['#27405a', '#1b2e44'],
} as const satisfies Record<string, readonly [string, string]>;

/** CSS gradient string for RN's `backgroundImage` style. */
export function linear(g: readonly [string, string], deg = 180): string {
  return `linear-gradient(${deg}deg, ${g[0]}, ${g[1]})`;
}

/** tokens/effects.css --texture-frost, laid over the page gradient. */
export const textureFrost =
  'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(30,50,70,0.18), transparent 60%)';

export const viz =[palette.blue600, palette.teal700, palette.peri700, '#829096', palette.sage400] as const;
export const bars = [
  palette.ice300,
  palette.sky400,
  palette.teal400,
  palette.teal800,
  palette.sky500,
  '#3b768b',
  palette.indigo800,
] as const;

/** Highlight presets from the reader designs. */
export const highlightColors = {
  sun: '#f3d77a',
  mint: '#a8dcc4',
  sky: '#a9d4ec',
  lilac: '#c9c3ea',
  rose: '#f0b8c4',
  peach: '#f5c9a0',
} as const;

/** Cover gradients used for books without a cover image. */
export const coverGradients: readonly (readonly [string, string])[] = [
  ['#539182', '#2f5e57'],
  ['#3e7f8c', '#225c74'],
  ['#727a9f', '#414484'],
  ['#4d6474', '#1f344a'],
  ['#5e707c', '#2b4560'],
  ['#598eaf', '#2e6a79'],
];
