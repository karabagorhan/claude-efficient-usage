import type { PastelKey } from '../engine/types';
import type { Loc } from '../i18n';

export type BreathPhaseKind = 'in' | 'hold' | 'out' | 'rest';

export interface BreathPattern {
  id: string;
  emoji: string;
  name: Loc;
  /** "4-4-4-4" gibi kısa gösterim */
  ratio: string;
  desc: Loc;
  pastel: PastelKey;
  phases: Array<{ kind: BreathPhaseKind; sec: number }>;
}

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'box',
    emoji: '🟦',
    name: { tr: 'Kutu nefesi', en: 'Box breathing' },
    ratio: '4-4-4-4',
    desc: { tr: 'Odağı toplar, zihni dengeler.', en: 'Gathers focus and steadies the mind.' },
    pastel: 'blue',
    phases: [
      { kind: 'in', sec: 4 },
      { kind: 'hold', sec: 4 },
      { kind: 'out', sec: 4 },
      { kind: 'rest', sec: 4 },
    ],
  },
  {
    id: '478',
    emoji: '🌙',
    name: { tr: 'Rahatlatıcı 4-7-8', en: 'Relaxing 4-7-8' },
    ratio: '4-7-8',
    desc: { tr: 'Akşam, uykudan önce gevşemek için.', en: 'For winding down in the evening.' },
    pastel: 'purple',
    phases: [
      { kind: 'in', sec: 4 },
      { kind: 'hold', sec: 7 },
      { kind: 'out', sec: 8 },
    ],
  },
  {
    id: 'calm',
    emoji: '🍃',
    name: { tr: 'Sakin nefes', en: 'Calm breathing' },
    ratio: '5-5',
    desc: { tr: 'Yavaş ve eşit: alırken de verirken de 5 sn.', en: 'Slow and even: 5 seconds in, 5 out.' },
    pastel: 'mint',
    phases: [
      { kind: 'in', sec: 5 },
      { kind: 'out', sec: 5 },
    ],
  },
  {
    id: 'energy',
    emoji: '⚡',
    name: { tr: 'Enerji nefesi', en: 'Energy breath' },
    ratio: '4-2',
    desc: { tr: 'Kısa verişle canlandırır.', en: 'A short exhale to perk you up.' },
    pastel: 'yellow',
    phases: [
      { kind: 'in', sec: 4 },
      { kind: 'out', sec: 2 },
    ],
  },
];

export const MEDITATE_DURATIONS = [1, 3, 5, 10];
