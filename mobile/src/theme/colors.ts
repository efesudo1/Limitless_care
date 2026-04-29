// WCAG AA seviyesinde kontrast oranı kontrol edilmiş palette.
export const colors = {
  background: '#F5F8FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F8',
  // Birincil teal (Welcome ekranındaki tonlama)
  primary: '#118C8A',
  primaryDark: '#0D6E6C',
  primaryContrast: '#FFFFFF',
  // Doctor ekranlarındaki mavi tonu
  accent: '#1F4FD9',
  accentDark: '#1739A3',
  // Status renkleri
  success: '#1F9D55',
  successBg: '#DCF7E5',
  warning: '#D97706',
  warningBg: '#FFE9C2',
  danger: '#D03A3A',
  dangerBg: '#FBE0E0',
  // Metin
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  // Ayraç & odak halkası
  border: '#CBD5E1',
  focusRing: '#FFB200',
} as const;

export type ColorKey = keyof typeof colors;
