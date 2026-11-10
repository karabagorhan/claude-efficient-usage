import type { PastelKey } from '../engine/types';
import type { Loc } from '../i18n';

export interface SoundDef {
  id: string;
  emoji: string;
  name: Loc;
  pastel: PastelKey;
  /** Betikle sentezlenen döngülü WAV (scripts/gen-sounds.mjs) */
  source: number;
}

export const MAX_MIX = 3;

export const SOUNDS: SoundDef[] = [
  { id: 'rain', emoji: '🌧️', name: { tr: 'Yağmur', en: 'Rain' }, pastel: 'blue', source: require('../../assets/sounds/rain.wav') },
  { id: 'ocean', emoji: '🌊', name: { tr: 'Okyanus', en: 'Ocean' }, pastel: 'mint', source: require('../../assets/sounds/ocean.wav') },
  { id: 'white', emoji: '⚪', name: { tr: 'Beyaz gürültü', en: 'White noise' }, pastel: 'purple', source: require('../../assets/sounds/white.wav') },
  { id: 'pink', emoji: '🌸', name: { tr: 'Pembe gürültü', en: 'Pink noise' }, pastel: 'pink', source: require('../../assets/sounds/pink.wav') },
  { id: 'brown', emoji: '🟤', name: { tr: 'Kahverengi gürültü', en: 'Brown noise' }, pastel: 'peach', source: require('../../assets/sounds/brown.wav') },
  { id: 'fan', emoji: '🌀', name: { tr: 'Vantilatör', en: 'Fan' }, pastel: 'yellow', source: require('../../assets/sounds/fan.wav') },
  { id: 'stream', emoji: '🏞️', name: { tr: 'Dere', en: 'Stream' }, pastel: 'green', source: require('../../assets/sounds/stream.wav') },
  { id: 'wind', emoji: '🍃', name: { tr: 'Rüzgâr', en: 'Wind' }, pastel: 'mint', source: require('../../assets/sounds/wind.wav') },
];
