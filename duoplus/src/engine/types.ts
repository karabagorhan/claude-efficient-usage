export type Difficulty = 'mini' | 'easy' | 'medium' | 'hard' | 'epic';
export type HabitKind = 'check' | 'counter' | 'timer';

/** 0 = Pazartesi ... 6 = Pazar */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Schedule {
  /** Planlı günler. Boşsa her gün. */
  days: Weekday[];
  /** Haftalık kota (ör. haftada 3). Varsa days yok sayılır; seri birimi haftadır. */
  weeklyQuota?: number;
}

export interface Habit {
  id: string;
  ownerId: string;
  title: string;
  icon: string; // emoji
  color: string;
  category: string;
  difficulty: Difficulty;
  kind: HabitKind;
  /** counter için hedef sayı, timer için dakika */
  target?: number;
  /** counter için tek dokunuşta artış (ör. adım için 1000) */
  step?: number;
  schedule: Schedule;
  /** HH:MM */
  reminderTime?: string;
  /** Erken bonus için hedef saat HH:MM */
  dueTime?: string;
  isPrivate: boolean;
  together: boolean;
  createdAt: string; // ISO
  archived: boolean;
}

export interface Completion {
  id: string;
  habitId: string;
  userId: string;
  dayKey: string; // YYYY-MM-DD (gün sınırı 03:00)
  completedAt: string; // ISO
  /** Kazanılan toplam puan (bonuslar dahil) */
  points: number;
  base: number;
  multiplier: number;
  earlyBonus: number;
  /** Geri alındıysa true */
  undone?: boolean;
}

export interface PointEvent {
  id: string;
  userId: string;
  dayKey: string;
  type: 'completion' | 'perfect_day' | 'almost_perfect' | 'weekly_bonus' | 'badge' | 'champion' | 'nudge' | 'penalty';
  points: number;
  refId?: string;
  createdAt: string;
  label?: string;
}

export type Period = 'day' | 'week' | 'month';

/** Liderlik puanına sayılmayan (yalnızca XP veren) olay türleri */
export const XP_ONLY_TYPES: ReadonlyArray<PointEvent['type']> = ['champion', 'badge'];
export const isScoreEvent = (e: Pick<PointEvent, 'type'>) => !XP_ONLY_TYPES.includes(e.type);
