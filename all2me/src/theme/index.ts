import { useColorScheme, type TextStyle } from 'react-native';
import { PASTEL_KEYS, type PastelKey } from '../engine/types';
import { useSettings } from '../store/settings';

export type { PastelKey };
export { PASTEL_KEYS };

export interface Palette {
  isDark: boolean;
  bg: string; // ekran zemini
  card: string; // beyaz kart
  cardAlt: string; // ikincil yüzey (segment, boş bar)
  text: string;
  textDim: string;
  textFaint: string;
  border: string;
  /** Ana hap buton zemini (açık: siyah, koyu: beyaz) */
  primary: string;
  /** primary üstündeki yazı */
  onPrimary: string;
  /** Pastel kart üstündeki yazı */
  onPastel: string;
  coral: string;
  purple: string;
  pink: string;
  blue: string;
  orange: string;
  success: string;
  danger: string;
  warn: string;
  me: string;
  partner: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  overlay: string;
  pastel: Record<PastelKey, string>;
}

/** Pastel kart renkleri: açık ve koyu tema karşılıkları. */
export const PASTELS: Record<PastelKey, { light: string; dark: string }> = {
  blue: { light: '#CFE2FF', dark: '#24364F' },
  green: { light: '#DCF5B5', dark: '#2E3F1F' },
  purple: { light: '#E6D9FB', dark: '#382C52' },
  mint: { light: '#C9F2E7', dark: '#1F3F37' },
  peach: { light: '#FCE2C0', dark: '#4A3520' },
  pink: { light: '#FBD5F7', dark: '#4A2546' },
  yellow: { light: '#FBEF7E', dark: '#4A4418' },
};

/** Döngüsel pastel seçimi (liste sırası için). */
export const pastelFor = (index: number): PastelKey => PASTEL_KEYS[((index % PASTEL_KEYS.length) + PASTEL_KEYS.length) % PASTEL_KEYS.length];
/** Tema bağımsız pastel değeri. */
export const pastelColor = (key: PastelKey, isDark = false): string => (PASTELS[key] ?? PASTELS.blue)[isDark ? 'dark' : 'light'];

const pastelMap = (dark: boolean) =>
  Object.fromEntries(PASTEL_KEYS.map((k) => [k, PASTELS[k][dark ? 'dark' : 'light']])) as Record<PastelKey, string>;

export const light: Palette = {
  isDark: false,
  bg: '#F7F7FF',
  card: '#FFFFFF',
  cardAlt: '#EEEEF6',
  text: '#14171A',
  textDim: '#6B7280',
  textFaint: '#A3A8B3',
  border: '#E6E6EF',
  primary: '#14171A',
  onPrimary: '#FFFFFF',
  onPastel: '#14171A',
  coral: '#FF6B3D',
  purple: '#7C5CFC',
  pink: '#FF7AE0',
  blue: '#3B6CF6',
  orange: '#FF8A1F',
  success: '#22C55E',
  danger: '#EF4444',
  warn: '#F59E0B',
  me: '#7C5CFC',
  partner: '#FF6B3D',
  tabBar: '#FFFFFF',
  tabActive: '#14171A',
  tabInactive: '#A3A8B3',
  overlay: 'rgba(20,23,26,0.45)',
  pastel: pastelMap(false),
};

export const dark: Palette = {
  isDark: true,
  bg: '#0E1016',
  card: '#181B24',
  cardAlt: '#232733',
  text: '#F3F4F6',
  textDim: '#9CA3AF',
  textFaint: '#5E6472',
  border: '#2A2F3C',
  primary: '#F3F4F6',
  onPrimary: '#0E1016',
  onPastel: '#F3F4F6',
  coral: '#FF825C',
  purple: '#957BFF',
  pink: '#FF8FE6',
  blue: '#6A8DFF',
  orange: '#FF9D45',
  success: '#34D399',
  danger: '#F87171',
  warn: '#FBBF24',
  me: '#957BFF',
  partner: '#FF825C',
  tabBar: '#14161D',
  tabActive: '#F3F4F6',
  tabInactive: '#5E6472',
  overlay: 'rgba(0,0,0,0.6)',
  pastel: pastelMap(true),
};

/** Ayara (system/light/dark) ve cihaz temasına göre palet. */
export function useTheme(): Palette {
  const scheme = useColorScheme();
  const pref = useSettings((s) => s.theme);
  const isDark = pref === 'dark' || (pref === 'system' && scheme === 'dark');
  return isDark ? dark : light;
}

type Grad = readonly [string, string, ...string[]];
/** expo-linear-gradient için renk dizileri (yukarıdan aşağı). Koyu temada da aynı kullanılabilir. */
export const GRADIENTS = {
  /** Çark ekranı: pembe → açık lavanta */
  wheel: ['#FF7AE0', '#F7A8F0', '#F3E9FF'],
  /** Harekete Geç: mor → beyaz */
  action: ['#7C5CFC', '#A58BFF', '#E9E2FF', '#FFFFFF'],
  /** Seri ekranı: turuncu → krem */
  streak: ['#FF8A1F', '#FFC37A', '#FFF1E0', '#F7F7FF'],
  /** Akıllı planlayıcı kartı (yatay) */
  ai: ['#5B7CFA', '#A66CFF', '#F08BEA'],
  /** Şanslı görev kartı */
  lucky: ['#6C6CF0', '#7C5CFC'],
  /** Onboarding kutlama */
  celebrate: ['#FFE7F8', '#F7F7FF'],
} as const satisfies Record<string, Grad>;

export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
/** Ekran yatay boşluğu */
export const GUTTER = 16;
/** Ana buton yüksekliği */
export const BUTTON_H = 56;

/** Tipografi ölçeği: fontSize + fontWeight. <Txt variant="h1"> ile ya da stil olarak kullan. */
export const type = {
  display: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 19 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
} as const satisfies Record<string, TextStyle>;
export type TypeVariant = keyof typeof type;

/** "#RRGGBB" + alfa (0..1) -> "#RRGGBBAA" */
export const alpha = (hex: string, a: number) =>
  hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

/** Ruh hali skalası (5 seviye) renkleri; etiketler mood ad alanında. */
export const MOOD_COLORS = ['#F87171', '#FB923C', '#FBBF24', '#A3E635', '#34D399'] as const;
