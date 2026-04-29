export { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const typography = {
  // accessibility: tüm font ölçeklendirilebilir; allowFontScaling true.
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h1: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
};

// Erişilebilirlik için minimum dokunma alanı
export const TOUCH_MIN = 44;
