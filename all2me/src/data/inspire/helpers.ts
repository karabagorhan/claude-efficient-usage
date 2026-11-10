import type { Difficulty, HabitKind, Loc, Slot } from '../../engine/types';
import type { TemplateItem } from './types';

export const l = (tr: string, en: string): Loc => ({ tr, en });

/** Kısa madde kurucu: it('🛏️', 'Yatağı topla', 'Make the bed', 'morning', { d: 'mini' }) */
export const it = (
  emoji: string,
  tr: string,
  en: string,
  slot: Slot = 'anytime',
  o: { k?: HabitKind; n?: number; d?: Difficulty; w?: number[] } = {},
): TemplateItem => ({
  emoji,
  name: { tr, en },
  slot,
  ...(o.k ? { kind: o.k } : {}),
  ...(o.n ? { target: o.n } : {}),
  ...(o.d ? { difficulty: o.d } : {}),
  ...(o.w ? { days: o.w } : {}),
});
