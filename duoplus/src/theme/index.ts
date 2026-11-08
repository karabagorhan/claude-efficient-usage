import { useColorScheme } from 'react-native';

export interface Palette {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textDim: string;
  border: string;
  primary: string;
  primarySoft: string;
  success: string;
  danger: string;
  warn: string;
  me: string;
  partner: string;
  isDark: boolean;
}

const light: Palette = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  cardAlt: '#EEF0F8',
  text: '#111827',
  textDim: '#6B7280',
  border: '#E5E7EB',
  primary: '#6366F1',
  primarySoft: '#E0E7FF',
  success: '#10B981',
  danger: '#EF4444',
  warn: '#F59E0B',
  me: '#6366F1',
  partner: '#EC4899',
  isDark: false,
};

const dark: Palette = {
  bg: '#0B0F1A',
  card: '#151B2B',
  cardAlt: '#1E2638',
  text: '#F3F4F6',
  textDim: '#9CA3AF',
  border: '#273049',
  primary: '#818CF8',
  primarySoft: '#26305A',
  success: '#34D399',
  danger: '#F87171',
  warn: '#FBBF24',
  me: '#818CF8',
  partner: '#F472B6',
  isDark: true,
};

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const radius = { sm: 10, md: 16, lg: 22 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const MOODS = [
  { v: 1, emoji: '😞', label: 'Kötü', color: '#EF4444' },
  { v: 2, emoji: '😕', label: 'Düşük', color: '#F97316' },
  { v: 3, emoji: '😐', label: 'Normal', color: '#F59E0B' },
  { v: 4, emoji: '🙂', label: 'İyi', color: '#84CC16' },
  { v: 5, emoji: '😄', label: 'Harika', color: '#10B981' },
];

export const MOOD_TAGS = ['Yorgun', 'Enerjik', 'Stresli', 'Sakin', 'Mutlu', 'Kaygılı', 'Motive', 'Yalnız', 'Minnettar', 'Odaklı'];
