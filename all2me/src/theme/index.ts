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
  /** İkincil-soluk metin (placeholder, ipucu). AA'yı geçer; yalnız dekoratif öğe için daha soluk ton kullanma. */
  textFaint: string;
  /** Kart/ayraç çizgisi (dekoratif) */
  border: string;
  /** Etkileşimli öğe sınırı (input, pasif chip): UI kontrastı ≥ 3 */
  borderInput: string;
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
  /** Anlamsal renklerin METİN olarak kullanımı (zemin/kart üstünde AA ≥ 4.5). Dolgu için danger/success/warn/purple. */
  dangerText: string;
  successText: string;
  warnText: string;
  purpleText: string;
  /** danger dolgusu üstündeki yazı */
  onDanger: string;
  /** Renkli haplar / vurgu dolguları (coral, warn, success, orange) üstündeki koyu yazı */
  onAccent: string;
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
  blue: { light: '#BBDDF7', dark: '#22384D' },
  green: { light: '#C9EBB0', dark: '#2C3F22' },
  purple: { light: '#D7CCFF', dark: '#362B55' },
  mint: { light: '#B8EEDD', dark: '#1D3F35' },
  peach: { light: '#FDCFB8', dark: '#4A3122' },
  pink: { light: '#F6C9E6', dark: '#48243F' },
  yellow: { light: '#FFE28F', dark: '#4A4119' },
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
  textDim: '#5B6370',
  textFaint: '#6B7280',
  border: '#E6E6EF',
  borderInput: '#858A95',
  primary: '#14171A',
  onPrimary: '#FFFFFF',
  onPastel: '#14171A',
  coral: '#EE4D7E',
  purple: '#7C5CFC',
  pink: '#A93BC9',
  blue: '#3B6CF6',
  orange: '#FF8A1F',
  success: '#22C55E',
  danger: '#DC2626',
  warn: '#F59E0B',
  dangerText: '#DC2626',
  successText: '#15803D',
  warnText: '#B45309',
  purpleText: '#6D4AE8',
  onDanger: '#FFFFFF',
  onAccent: '#14171A',
  me: '#7C5CFC',
  partner: '#EE4D7E',
  tabBar: '#FFFFFF',
  tabActive: '#14171A',
  tabInactive: '#6B7280',
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
  textFaint: '#868D99',
  border: '#2A2F3C',
  borderInput: '#6B7280',
  primary: '#F3F4F6',
  onPrimary: '#0E1016',
  onPastel: '#F3F4F6',
  coral: '#FF7AA2',
  purple: '#957BFF',
  pink: '#A93BC9',
  blue: '#6A8DFF',
  orange: '#FF9D45',
  success: '#34D399',
  danger: '#F87171',
  warn: '#FBBF24',
  dangerText: '#F87171',
  successText: '#34D399',
  warnText: '#FBBF24',
  purpleText: '#A994FF',
  onDanger: '#14171A',
  onAccent: '#14171A',
  me: '#957BFF',
  partner: '#FF7AA2',
  tabBar: '#14161D',
  tabActive: '#F3F4F6',
  tabInactive: '#7E8592',
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
  /** Çark ekranı: orkide → açık lavanta (All2Me markası: Puf'un mor-pembesi) */
  wheel: ['#A93BC9', '#D58FE8', '#F5ECFF'],
  /** Harekete Geç: mor → beyaz */
  action: ['#7C5CFC', '#A58BFF', '#E9E2FF', '#FFFFFF'],
  /** Seri ekranı: turuncu → krem */
  streak: ['#FF8A1F', '#FFC37A', '#FFF1E0', '#F7F7FF'],
  /** Akıllı planlayıcı kartı (yatay) */
  ai: ['#4F5BD5', '#6F55DD', '#8E4FE0'],
  /** Şanslı görev kartı */
  lucky: ['#5B5BE0', '#6D4AE8'],
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

// ---------- Okunabilirlik yardımcısı ----------
const lum = (hex: string) => {
  const h = hex.replace('#', '').slice(0, 6);
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
/** WCAG kontrast oranı. */
export const contrastRatio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
};
/**
 * Kullanıcının seçtiği renk (avatar rengi vb.) METİN olarak kullanılacaksa: tonu koruyup `bg` üstünde `min` orana
 * ulaşana kadar koyulaştırır (koyu zeminde açar). Örn. puan sayıları `readable(me.color, t.card)`.
 */
export function readable(color: string, bg: string, min = 4.5): string {
  if (!/^#[0-9a-fA-F]{6}/.test(color) || !/^#[0-9a-fA-F]{6}/.test(bg)) return color;
  const toward = lum(bg) > 0.4 ? '#000000' : '#FFFFFF';
  for (let t = 0; t <= 1; t += 0.05) {
    const c = t === 0 ? color : mix(color, toward, t);
    if (contrastRatio(c, bg) >= min) return c;
  }
  return toward;
}
