/** İş ve kişisel gelişim veri tipleri (saf TS). Görünen adlar i18n: growth.area.<alan>, growth.kind.<tür>, growth.lstatus.<durum>. */
import type { PastelKey } from '../../engine/types';

export const AREAS = ['career', 'work', 'skill', 'reading', 'health', 'finance', 'personal'] as const;
export type GoalArea = (typeof AREAS)[number];

export const AREA_META: Record<GoalArea, { emoji: string; pastel: PastelKey }> = {
  career: { emoji: '🚀', pastel: 'blue' },
  work: { emoji: '💼', pastel: 'peach' },
  skill: { emoji: '🛠️', pastel: 'mint' },
  reading: { emoji: '📚', pastel: 'purple' },
  health: { emoji: '💪', pastel: 'green' },
  finance: { emoji: '💰', pastel: 'yellow' },
  personal: { emoji: '🌱', pastel: 'pink' },
};
export const isArea = (x: unknown): x is GoalArea => typeof x === 'string' && (AREAS as readonly string[]).includes(x);

export interface TopTask {
  id: string;
  title: string;
  done: boolean;
  /** başka günden taşındıysa kaynak gün */
  from?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface GoalCheckin {
  id: string;
  dayKey: string;
  note: string;
  /** sayısal hedefte o anki değer */
  value?: number;
}

export interface Goal {
  id: string;
  title: string;
  area: GoalArea;
  why?: string;
  target?: string; // YYYY-MM-DD
  measure: 'number' | 'milestones';
  unit?: string;
  startValue?: number;
  targetValue?: number;
  current?: number;
  milestones: GoalMilestone[];
  checkins: GoalCheckin[];
  createdAt: string;
  doneDay?: string;
}

export const LEARN_KINDS = ['book', 'course', 'cert'] as const;
export type LearnKind = (typeof LEARN_KINDS)[number];
export const LEARN_META: Record<LearnKind, { emoji: string; pastel: PastelKey }> = {
  book: { emoji: '📘', pastel: 'purple' },
  course: { emoji: '🎓', pastel: 'blue' },
  cert: { emoji: '🏅', pastel: 'yellow' },
};
export const LEARN_STATUSES = ['planned', 'active', 'done'] as const;
export type LearnStatus = (typeof LEARN_STATUSES)[number];

export interface LearnItem {
  id: string;
  kind: LearnKind;
  title: string;
  total: number;
  current: number;
  status: LearnStatus;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  /** haftanın Pazartesi'si */
  week: string;
  good: string;
  blockers: string;
  next: string;
  at: string;
}

export interface GrowthSettings {
  morningTop3: boolean;
  fridayReview: boolean;
}
