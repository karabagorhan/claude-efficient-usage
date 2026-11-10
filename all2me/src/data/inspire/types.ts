import type { Difficulty, HabitKind, Loc, PastelKey, Slot } from '../../engine/types';

export type TemplateLayout = 'grid' | 'list' | 'checklist' | 'schedule';

export type CategoryId =
  | 'cleaning'
  | 'selfcare'
  | 'focus'
  | 'morning'
  | 'work'
  | 'food'
  | 'fitness'
  | 'evening'
  | 'beauty'
  | 'study'
  | 'health';

export type SectionId =
  | 'popularCleaning'
  | 'organized'
  | 'work101'
  | 'backToSchool'
  | 'foodTips'
  | 'fit'
  | 'endOfDay'
  | 'tips'
  | 'beautyHello';

export interface TemplateItem {
  emoji: string;
  name: Loc;
  slot: Slot;
  kind?: HabitKind;
  /** sayaç hedefi ya da dakika */
  target?: number;
  difficulty?: Difficulty;
  /** 0 = Pazartesi; boş = her gün */
  days?: number[];
}

/** Poster renk çiftleri: [zemin, vurgu] */
export const PALETTES = {
  rose: ['#F9D5E5', '#D6568C'],
  sky: ['#CFE2FF', '#3B6CF6'],
  lime: ['#DCF5B5', '#5E9B1C'],
  lav: ['#E6D9FB', '#7C5CFC'],
  mint: ['#C9F2E7', '#14917A'],
  peach: ['#FCE2C0', '#E5791A'],
  sun: ['#FBEF7E', '#A8820A'],
  coral: ['#FFD3C7', '#E2502A'],
  cream: ['#F6EBDD', '#9A6B3C'],
  sage: ['#D9E8D0', '#4F7A4A'],
  blush: ['#FBD5F7', '#C23FB5'],
  ocean: ['#BFE6F2', '#13789A'],
} as const satisfies Record<string, readonly [string, string]>;
export type PaletteKey = keyof typeof PALETTES;

export interface Template {
  id: string;
  title: Loc;
  desc: Loc;
  emoji: string;
  cats: CategoryId[];
  section: SectionId;
  c: PaletteKey;
  layout: TemplateLayout;
  /** üst afişte öne çıkar */
  featured?: boolean;
  items: TemplateItem[];
}

export interface Category {
  id: CategoryId;
  emoji: string;
  pastel: PastelKey;
  name: Loc;
}

export interface QuizOption {
  text: Loc;
}
export interface QuizQuestion {
  q: Loc;
  /** seçenek sırası = sonuç tipi sırası */
  options: Loc[];
}
export interface QuizResult {
  id: string;
  emoji: string;
  title: Loc;
  desc: Loc;
  tip: Loc;
  templates: string[];
}
export interface Quiz {
  id: string;
  emoji: string;
  pastel: PastelKey;
  c: PaletteKey;
  title: Loc;
  desc: Loc;
  questions: QuizQuestion[];
  results: QuizResult[];
}
