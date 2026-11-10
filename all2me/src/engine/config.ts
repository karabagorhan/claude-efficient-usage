import type { Difficulty } from './types';

export const CONFIG = {
  basePoints: { mini: 5, easy: 10, medium: 20, hard: 35, epic: 50 } as Record<Difficulty, number>,
  /** [minStreakDays, multiplier] küçükten büyüğe */
  streakMultipliers: [
    [0, 1.0],
    [3, 1.1],
    [7, 1.2],
    [14, 1.3],
    [30, 1.4],
    [60, 1.5],
  ] as Array<[number, number]>,
  perfectDay: { minTasks: 3, pct: 0.15, min: 10, max: 40, almostPct: 0.8, almostBonus: 5 },
  weeklyPerfectBonus: 25,
  early: { pct: 0.1, min: 1, max: 5, dailyMax: 15, minLeadMinutes: 30 },
  plannedBaseCapPerDay: 200,
  softCap: { points: 300, overRate: 0.25 },
  hardCap: 350,
  limits: { mini: 6, hard: 3, epic: 1 } as Partial<Record<Difficulty, number>>,
  newTaskFirst24hRate: 0.5,
  undoWindowMinutes: 5,
  dayBoundaryHour: 3,
  weekStart: 'monday' as const,
  winThresholds: { dailyMinSp: 40, dailyMinTasks: 3, weeklyMinSp: 150, weeklyMinDays: 3, monthlyMinDays: 10 },
  shield: { earnEveryStreakDays: 7, maxStock: 2 },
  nudge: { perDay: 3, minGapHours: 2, rewardBonusXp: 2 },
  championBonusXp: { day: 20, week: 75, month: 200 },
  badgeBonusXp: { bronze: 25, silver: 75, gold: 200, legendary: 500 },
  /** Görev dışı puanlar (awardBonus). Ekranlar bu değerleri kullanır. */
  bonus: {
    maxPoints: 50,
    wheel: { points: 10, perDay: 5 },
    lucky: { points: 10, perDay: 3 },
  },
};
