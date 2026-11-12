import { BADGES, type BadgeDef } from '../data/badges';
import { levelFromXp } from './levels';
import { currentStreak } from './points';
import { countsForScore, isScoreEvent, type Completion, type Habit, type PointEvent } from './types';

export interface BadgeContext {
  userId: string;
  today: string;
  habits: Habit[];
  completions: Completion[]; // yalnız bu kullanıcının
  events: PointEvent[]; // yalnız bu kullanıcının
  moodDays: number;
  journalCount: number;
  focusSessions: number;
  breathSessions: number;
  /** Gün serisi (art arda ≥1 tamamlama) */
  dayStreak: number;
  /** Puan almış çark görevi sayısı */
  wheelTasks: number;
  nudgesSent: number;
  cheersSent: number;
  paired: boolean;
  wins: { day: number; week: number; month: number };
  comeback: boolean;
  /** Yaşam takibi (çekirdek `activity` sayaçları + bonus olaylarından; dilimler import edilmez) */
  /** Sigarada limitinde kapatılan gün sayısı */
  smokeLimitDays?: number;
  /** Öğün kaydı olup fast food olmayan (kapanmış) gün sayısı */
  fastFoodFreeDays?: number;
  /** Yapılan ev işi sayısı */
  choresDone?: number;
  /** Biten okul öğesi sayısı */
  studyItemsDone?: number;
  /** Tamamlanan gelişim hedefi sayısı */
  goalsDone?: number;
}

export function userTotals(events: PointEvent[]) {
  let sp = 0;
  let xp = 0;
  for (const e of events) {
    xp += e.points;
    if (isScoreEvent(e)) sp += e.points;
  }
  return { sp, xp };
}

export function evaluateBadges(c: BadgeContext): string[] {
  const live = c.completions.filter(countsForScore);
  const { sp, xp } = userTotals(c.events);
  const level = levelFromXp(xp).level;
  const maxStreak = c.habits.reduce((m, h) => Math.max(m, currentStreak(h, live, c.today)), 0);
  const perfectDays = c.events.filter((e) => e.type === 'perfect_day').length;
  const early = live.filter((x) => x.earlyBonus > 0).length;
  const habitById = new Map(c.habits.map((h) => [h.id, h]));
  const together = live.filter((x) => habitById.get(x.habitId)?.together).length;
  const night = live.some((x) => {
    const h = new Date(x.completedAt).getHours();
    return h >= 0 && h < 3;
  });

  const earned: string[] = [];
  const add = (cond: boolean, id: string) => cond && earned.push(id);

  add(maxStreak >= 3, 'streak3');
  add(maxStreak >= 7, 'streak7');
  add(maxStreak >= 30, 'streak30');
  add(maxStreak >= 100, 'streak100');
  add(sp >= 500, 'sp500');
  add(sp >= 2500, 'sp2500');
  add(sp >= 10000, 'sp10000');
  add(sp >= 50000, 'sp50000');
  add(level >= 5, 'lvl5');
  add(level >= 10, 'lvl10');
  add(level >= 20, 'lvl20');
  add(level >= 50, 'lvl50');
  add(live.length >= 1, 'first');
  add(perfectDays >= 1, 'perfect1');
  add(perfectDays >= 7, 'perfect7');
  add(perfectDays >= 30, 'perfect30');
  add(early >= 10, 'early10');
  add(live.length >= 100, 'tasks100');
  add(live.length >= 1000, 'tasks1000');
  add(night, 'night');
  add(c.wins.day >= 1, 'dayWin');
  add(c.wins.week >= 1, 'weekWin');
  add(c.wins.month >= 1, 'monthWin');
  add(c.wins.day >= 10, 'dayWin10');
  add(c.comeback, 'comeback');
  add(c.paired, 'paired');
  add(c.nudgesSent >= 1, 'nudge1');
  add(c.cheersSent >= 10, 'cheer10');
  add(together >= 10, 'together10');
  add(c.moodDays >= 7, 'mood7');
  add(c.journalCount >= 10, 'journal10');
  add(c.focusSessions >= 10, 'focus10');
  add(c.breathSessions >= 10, 'breath10');
  add(c.dayStreak >= 7, 'daystreak7');
  add(c.wheelTasks >= 10, 'wheel10');
  add((c.smokeLimitDays ?? 0) >= 7, 'smoke7');
  add((c.fastFoodFreeDays ?? 0) >= 7, 'nofast7');
  add((c.choresDone ?? 0) >= 20, 'chores20');
  add((c.studyItemsDone ?? 0) >= 10, 'study10');
  add((c.goalsDone ?? 0) >= 1, 'goal1');
  return earned;
}

export const badgeById = (id: string): BadgeDef | undefined => BADGES.find((b) => b.id === id);
