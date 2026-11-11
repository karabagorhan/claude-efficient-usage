// Yaşam takibi saf hesaplamaları (RN/store bağımlılığı yok; tsx ile test edilir).
import { addDays, eachDay, parseDayKey, weekStartKey, weekdayOf } from '../../engine/dates';
import { IDEA_BY_ID } from '../../data/mealIdeas';
import type { MsgTone } from '../../data/lifeMessages';
import type { Loc } from '../../engine/types';
import type { Chore, ChoreLog, MealEntry, MealKind, MealSlot, SmokePlan, SmokeTrigger } from './types';

export const daysBetween = (a: string, b: string): number =>
  Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86400000);

// ---------------------------------------------------------------- Sigara

/** Gün için limit: her `everyDays` günde 1 azalır, hedefin altına inmez. */
export function reductionLimit(plan: SmokePlan, day: string): number {
  const elapsed = Math.max(0, daysBetween(plan.startDay, day));
  const every = Math.max(1, plan.everyDays);
  return Math.max(plan.goalPerDay, plan.startPerDay - Math.floor(elapsed / every));
}

export interface ReductionStep {
  limit: number;
  from: string;
  /** son adımda null (süresiz) */
  to: string | null;
}
/** Azaltma takvimi: başlangıç limitinden hedefe kadar adımlar. */
export function reductionSteps(plan: SmokePlan): ReductionStep[] {
  const every = Math.max(1, plan.everyDays);
  const steps: ReductionStep[] = [];
  let limit = Math.min(plan.startPerDay, 200);
  let i = 0;
  while (limit > plan.goalPerDay) {
    steps.push({ limit, from: addDays(plan.startDay, i * every), to: addDays(plan.startDay, (i + 1) * every - 1) });
    limit--;
    i++;
  }
  steps.push({ limit: plan.goalPerDay, from: addDays(plan.startDay, i * every), to: null });
  return steps;
}
/** Hedef limite inilen ilk gün. */
export const planEndDay = (plan: SmokePlan): string => {
  const s = reductionSteps(plan);
  return s[s.length - 1].from;
};
/** Bir sonraki limit düşüşü (hedefteyse null). */
export function nextReduction(plan: SmokePlan, day: string): { day: string; limit: number } | null {
  const cur = reductionLimit(plan, day);
  if (cur <= plan.goalPerDay) return null;
  const elapsed = Math.max(0, daysBetween(plan.startDay, day));
  const every = Math.max(1, plan.everyDays);
  return { day: addDays(plan.startDay, (Math.floor(elapsed / every) + 1) * every), limit: cur - 1 };
}

export function dayCounts(logs: Array<{ dayKey: string }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of logs) out[l.dayKey] = (out[l.dayKey] ?? 0) + 1;
  return out;
}

/** Başlangıç düzeyine göre içilmeyen sigara sayısı (startDay..upTo, dahil). */
export function unsmokedCount(plan: SmokePlan, counts: Record<string, number>, upTo: string): number {
  if (upTo < plan.startDay) return 0;
  let sum = 0;
  for (const d of eachDay(plan.startDay, upTo)) sum += Math.max(0, plan.startPerDay - (counts[d] ?? 0));
  return sum;
}
export const moneySaved = (unsmoked: number, packPrice: number, packSize: number): number =>
  packSize > 0 ? (unsmoked * packPrice) / packSize : 0;

/**
 * Limitte kalma serisi. Günler startDay'e kadar geriye sayılır. Kapanmamış bugün, limiti
 * zaten aştıysa seriyi sıfırlar; aşmadıysa henüz sayılmaz (kapanınca sayılır).
 */
export function limitStreaks(
  plan: SmokePlan,
  counts: Record<string, number>,
  todayKey: string,
  todayClosed: boolean,
): { current: number; best: number } {
  const ok = (d: string) => (counts[d] ?? 0) <= reductionLimit(plan, d);
  const end = todayClosed ? todayKey : addDays(todayKey, -1);
  let best = 0;
  let run = 0;
  let last = 0;
  if (end >= plan.startDay) {
    for (const d of eachDay(plan.startDay, end)) {
      run = ok(d) ? run + 1 : 0;
      best = Math.max(best, run);
    }
    last = run;
  }
  const current = !todayClosed && !ok(todayKey) ? 0 : last;
  return { current, best: Math.max(best, current) };
}

export function hardestHours(logs: Array<{ at: string }>): { hist: number[]; top: number[] } {
  const hist = new Array(24).fill(0) as number[];
  for (const l of logs) {
    const h = new Date(l.at).getHours();
    if (!Number.isNaN(h)) hist[h]++;
  }
  const top = hist
    .map((c, h) => ({ c, h }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c || a.h - b.h)
    .slice(0, 3)
    .map((x) => x.h);
  return { hist, top };
}

export function triggerCounts(logs: Array<{ trigger?: SmokeTrigger }>): Array<{ trigger: SmokeTrigger; count: number }> {
  const m: Partial<Record<SmokeTrigger, number>> = {};
  for (const l of logs) if (l.trigger) m[l.trigger] = (m[l.trigger] ?? 0) + 1;
  return (Object.entries(m) as Array<[SmokeTrigger, number]>)
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count);
}

/** Gün kapatma penceresi: 18:00'dan sonra, ertesi gün 03:00'a kadar. */
export const canCloseDay = (now: Date): boolean => now.getHours() >= 18 || now.getHours() < 3;

export const MONEY_MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000];
/** Para kilometre taşları para birimine göre (TRY için daha büyük adımlar). */
export const moneyMilestonesFor = (currency: string): number[] =>
  currency === 'TRY' ? [100, 250, 500, 1000, 2500, 5000, 10000] : [10, 25, 50, 100, 250, 500, 1000];
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
export function nextMilestone(list: number[], value: number): { reached: number[]; next: number | null } {
  return { reached: list.filter((m) => value >= m), next: list.find((m) => value < m) ?? null };
}

export function elapsedParts(ms: number): { d: number; h: number; m: number } {
  const total = Math.max(0, Math.floor(ms / 60000));
  return { d: Math.floor(total / 1440), h: Math.floor((total % 1440) / 60), m: total % 60 };
}

export type Tone = MsgTone;
export function smokeTone(count: number, limit: number): Tone {
  if (count > limit) return 'low';
  return count <= Math.floor(limit * 0.6) ? 'high' : 'mid';
}

// ---------------------------------------------------------------- Yemek

export interface WeekCounts {
  home: number;
  healthy: number;
  fast: number;
  skipped: number;
}
export function weekCounts(entries: MealEntry[], anchor: string): WeekCounts {
  const from = weekStartKey(anchor);
  const to = addDays(from, 6);
  const out: WeekCounts = { home: 0, healthy: 0, fast: 0, skipped: 0 };
  for (const e of entries) if (e.dayKey >= from && e.dayKey <= to) out[e.kind]++;
  return out;
}

/**
 * Fast food'suz gün serisi: gün, en az bir kayıt içerip fast food içermiyorsa "temiz" sayılır.
 * Bugün henüz kayıt yoksa seriyi kesmez; geçmişte kayıtsız gün seriyi keser.
 */
export function fastFoodFreeStreak(entries: MealEntry[], todayKey: string): number {
  const byDay: Record<string, MealEntry[]> = {};
  for (const e of entries) (byDay[e.dayKey] ??= []).push(e);
  let streak = 0;
  let d = todayKey;
  for (let guard = 0; guard < 800; guard++) {
    const list = byDay[d];
    if (!list || list.length === 0) {
      if (d === todayKey) {
        d = addDays(d, -1);
        continue;
      }
      break;
    }
    if (list.some((e) => e.kind === 'fast')) break;
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

export function weekGrid(entries: MealEntry[], anchor: string): Array<{ day: string; cells: Partial<Record<MealSlot, MealKind>> }> {
  const from = weekStartKey(anchor);
  const sorted = [...entries].sort((a, b) => (a.at < b.at ? -1 : 1));
  return eachDay(from, addDays(from, 6)).map((day) => {
    const cells: Partial<Record<MealSlot, MealKind>> = {};
    for (const e of sorted) if (e.dayKey === day) cells[e.slot] = e.kind;
    return { day, cells };
  });
}

/** Ay içi harcama (anchor'ın ayı); kind verilmezse hepsi. */
export function monthSpend(entries: MealEntry[], anchor: string, kind: MealKind = 'fast'): number {
  const prefix = anchor.slice(0, 7);
  return entries.reduce((a, e) => (e.dayKey.startsWith(prefix) && e.kind === kind ? a + (e.amount ?? 0) : a), 0);
}

export interface WeekGoal {
  fastMax: number;
  homeMin: number;
}
export function mealsTone(c: WeekCounts, g: WeekGoal): Tone {
  const fastOk = c.fast <= g.fastMax;
  const homeOk = c.home >= g.homeMin;
  if (fastOk && homeOk) return 'high';
  if (!fastOk && !homeOk) return 'low';
  return 'mid';
}

export interface ShopItem {
  key: string;
  name: Loc;
  count: number;
}
/** Menü planından (anahtar `<gün>|<öğün>` → fikir id'si) birleşik alışveriş listesi. */
export function shoppingList(plan: Record<string, string>): ShopItem[] {
  const map = new Map<string, ShopItem>();
  for (const id of Object.values(plan)) {
    const idea = IDEA_BY_ID[id];
    if (!idea) continue;
    for (const it of idea.items) {
      const cur = map.get(it.tr);
      if (cur) cur.count++;
      else map.set(it.tr, { key: it.tr, name: it, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key, 'tr'));
}

// ---------------------------------------------------------------- Ev işleri

export type ChoreState = 'overdue' | 'today' | 'soon' | 'later';
export const SOON_DAYS = 2;

export function choreDue(c: Pick<Chore, 'every' | 'lastDone' | 'firstDue' | 'createdDay' | 'snoozeUntil'>): string {
  const base = c.lastDone ? addDays(c.lastDone, Math.max(1, c.every)) : (c.firstDue ?? c.createdDay);
  return c.snoozeUntil && c.snoozeUntil > base ? c.snoozeUntil : base;
}
/** diff: vadeye kalan gün (negatif = gecikme). */
export function choreStatus(c: Parameters<typeof choreDue>[0], day: string): { state: ChoreState; due: string; diff: number } {
  const due = choreDue(c);
  const diff = daysBetween(day, due);
  const state: ChoreState = diff < 0 ? 'overdue' : diff === 0 ? 'today' : diff <= SOON_DAYS ? 'soon' : 'later';
  return { state, due, diff };
}
const ORDER: Record<ChoreState, number> = { overdue: 0, today: 1, soon: 2, later: 3 };
export function sortChores<T extends Chore>(list: T[], day: string): Array<T & { state: ChoreState; due: string; diff: number }> {
  return list
    .map((c) => ({ ...c, ...choreStatus(c, day) }))
    .sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.diff - b.diff);
}
export function choreCounts(list: Chore[], day: string): Record<ChoreState, number> {
  const out: Record<ChoreState, number> = { overdue: 0, today: 0, soon: 0, later: 0 };
  for (const c of list) out[choreStatus(c, day).state]++;
  return out;
}

/** Haftalık temizlik ilerlemesi: bu hafta yapılan / beklenen (aralıklardan) iş. */
export function weeklyChoreScore(chores: Chore[], history: ChoreLog[], anchor: string): { done: number; expected: number; score: number } {
  const from = weekStartKey(anchor);
  const to = addDays(from, 6);
  const done = history.filter((h) => h.dayKey >= from && h.dayKey <= to).length;
  const expected = Math.max(1, Math.round(chores.reduce((a, c) => a + 7 / Math.max(1, c.every), 0)));
  return { done, expected, score: Math.min(100, Math.round((100 * done) / expected)) };
}
export function choresTone(score: number, overdue: number): Tone {
  if (overdue >= 4 || score < 35) return 'low';
  return score >= 70 && overdue === 0 ? 'high' : 'mid';
}
export const mostPostponed = (chores: Chore[], n = 3): Chore[] =>
  chores
    .filter((c) => c.postponed > 0)
    .sort((a, b) => b.postponed - a.postponed)
    .slice(0, n);
export const weekdayIndex = weekdayOf;
