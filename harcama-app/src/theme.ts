import { useColorScheme } from 'react-native';

// Web sürümüyle aynı palet: çam yeşili vurgu, hafif yeşile çalan nötrler.
const light = {
  bg: '#f2f4f1',
  surface: '#ffffff',
  fg: '#16201d',
  muted: '#5d6b66',
  line: '#dde3df',
  accent: '#0d6b5b',
  accentFg: '#ffffff',
  accentSoft: '#cfe5df',
  heroTrack: 'rgba(255,255,255,0.28)',
  warn: '#b4410c',
  warnSoft: '#f8e1d4',
  good: '#1f7a3d',
  goodSoft: '#dcefe1',
  scrim: 'rgba(0,0,0,0.4)',
  cats: ['#0d6b5b', '#d08a1e', '#3a6fb0', '#8a4fa8', '#c2453d', '#4f9a3a', '#b55d8a', '#7d8580'],
  statusBar: 'dark' as 'dark' | 'light',
};

const dark: typeof light = {
  bg: '#0f1513',
  surface: '#182019',
  fg: '#e8efec',
  muted: '#93a39c',
  line: '#2a362f',
  accent: '#4cc4ac',
  accentFg: '#06201a',
  accentSoft: '#24453d',
  heroTrack: 'rgba(6,32,26,0.25)',
  warn: '#f08a55',
  warnSoft: '#3b2417',
  good: '#6fd08f',
  goodSoft: '#1a3323',
  scrim: 'rgba(0,0,0,0.6)',
  cats: ['#4cc4ac', '#e9a94a', '#6fa3e6', '#b88ad6', '#ec7a70', '#84c96c', '#e08bb6', '#a3aca7'],
  statusBar: 'light',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
