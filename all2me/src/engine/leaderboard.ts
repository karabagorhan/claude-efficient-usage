import { CONFIG } from './config';
import { eachDay, periodRange } from './dates';
import { countsForScore, isScoreEvent, type Completion, type Period, type PointEvent } from './types';

export interface DayStat {
  dayKey: string;
  points: number;
  tasks: number;
}

export interface UserStanding {
  userId: string;
  points: number;
  tasks: number;
  activeDays: number;
  dayWins: number;
}

export interface Standings {
  period: Period;
  from: string;
  to: string;
  rows: UserStanding[]; // puana göre sıralı
  winnerId: string | null; // beraberlik / eşik altı ise null
  tie: boolean;
  /** Birincilik için gereken eşik sağlandı mı */
  qualified: boolean;
}

export function dayStats(
  userId: string,
  events: PointEvent[],
  completions: Completion[],
  from: string,
  to: string,
): Record<string, DayStat> {
  const out: Record<string, DayStat> = {};
  for (const d of eachDay(from, to)) out[d] = { dayKey: d, points: 0, tasks: 0 };
  for (const e of events) {
    if (e.userId !== userId || !isScoreEvent(e) || e.dayKey < from || e.dayKey > to) continue;
    out[e.dayKey].points += e.points;
  }
  for (const c of completions) {
    if (c.userId !== userId || !countsForScore(c) || c.dayKey < from || c.dayKey > to) continue;
    out[c.dayKey].tasks += 1;
  }
  return out;
}

function dayWinner(a: DayStat, b: DayStat): 'a' | 'b' | null {
  const t = CONFIG.winThresholds;
  const aOk = a.points >= t.dailyMinSp && a.tasks >= t.dailyMinTasks;
  const bOk = b.points >= t.dailyMinSp && b.tasks >= t.dailyMinTasks;
  if (!aOk && !bOk) return null;
  if (aOk && !bOk) return 'a';
  if (bOk && !aOk) return 'b';
  if (a.points > b.points) return 'a';
  if (b.points > a.points) return 'b';
  return null;
}

export function standings(
  period: Period,
  anchor: string,
  userIds: [string, string],
  events: PointEvent[],
  completions: Completion[],
  /** Dönem içi sadece geçmiş günlerde kazanan sayılır (bugünü dahil etmek için today ver) */
  today: string,
): Standings {
  const [from, to] = periodRange(period, anchor);
  const [A, B] = userIds;
  const sa = dayStats(A, events, completions, from, to);
  const sb = dayStats(B, events, completions, from, to);

  const rows: UserStanding[] = [A, B].map((userId) => {
    const stats = userId === A ? sa : sb;
    const list = Object.values(stats);
    return {
      userId,
      points: list.reduce((s, d) => s + d.points, 0),
      tasks: list.reduce((s, d) => s + d.tasks, 0),
      activeDays: list.filter((d) => d.tasks > 0).length,
      dayWins: 0,
    };
  });

  for (const d of eachDay(from, to)) {
    if (d > today) break;
    const w = dayWinner(sa[d], sb[d]);
    if (w === 'a') rows[0].dayWins++;
    if (w === 'b') rows[1].dayWins++;
  }

  const sorted = [...rows].sort((x, y) => y.points - x.points || y.dayWins - x.dayWins);
  const t = CONFIG.winThresholds;
  let qualified = true;
  if (period === 'day') qualified = sorted[0].points >= t.dailyMinSp && sorted[0].tasks >= t.dailyMinTasks;
  if (period === 'week') qualified = sorted[0].points >= t.weeklyMinSp && sorted[0].activeDays >= t.weeklyMinDays;
  if (period === 'month') qualified = sorted[0].activeDays >= t.monthlyMinDays;

  const tie = sorted[0].points === sorted[1].points && sorted[0].dayWins === sorted[1].dayWins;
  return {
    period,
    from,
    to,
    rows: sorted,
    winnerId: qualified && !tie ? sorted[0].userId : null,
    tie,
    qualified,
  };
}

/** Geçmiş şampiyonluk sayacı: kapanmış dönemlerde kim kaç kez kazandı. */
export function championCounts(
  period: Period,
  userIds: [string, string],
  events: PointEvent[],
  completions: Completion[],
  firstDay: string,
  today: string,
): { wins: Record<string, number>; ties: number } {
  const wins: Record<string, number> = { [userIds[0]]: 0, [userIds[1]]: 0 };
  let ties = 0;
  const seen = new Set<string>();
  for (const d of eachDay(firstDay, today)) {
    const [from, to] = periodRange(period, d);
    if (to >= today || seen.has(from)) continue; // dönem henüz kapanmadı
    seen.add(from);
    const s = standings(period, d, userIds, events, completions, today);
    if (s.winnerId) wins[s.winnerId]++;
    else if (s.tie && s.qualified) ties++;
  }
  return { wins, ties };
}
