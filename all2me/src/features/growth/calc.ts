/** Gelişim için saf hesaplamalar (React/RN yok). Test: tests/study.test.ts */
import { addDays } from '../../engine/dates';
import type { Goal, LearnItem, TopTask } from './types';

/** Hedef ilerlemesi 0..1. Sayısal: (mevcut − başlangıç) / (hedef − başlangıç); taşlar: biten / toplam. */
export function goalProgress(g: Goal): number {
  if (g.measure === 'milestones') {
    if (!g.milestones.length) return g.doneDay ? 1 : 0;
    return g.milestones.filter((m) => m.done).length / g.milestones.length;
  }
  const target = g.targetValue ?? 0;
  const start = g.startValue ?? 0;
  const cur = g.current ?? start;
  if (target === start) return cur >= target && target > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, (cur - start) / (target - start)));
}

export const goalPercent = (g: Goal): number => Math.round(goalProgress(g) * 100);

/** Hedef tamamlandı mı (ölçüme göre). */
export function isGoalComplete(g: Goal): boolean {
  if (g.measure === 'milestones') return g.milestones.length > 0 && g.milestones.every((m) => m.done);
  return (g.targetValue ?? 0) !== (g.startValue ?? 0) && goalProgress(g) >= 1;
}

export function avgProgress(goals: Goal[]): number {
  if (!goals.length) return 0;
  return goals.reduce((a, g) => a + goalProgress(g), 0) / goals.length;
}

export const TOP_MAX = 3;

export const learnProgress = (l: LearnItem): number => (l.status === 'done' ? 1 : l.total > 0 ? Math.min(1, l.current / l.total) : 0);

export const top3Done = (list: TopTask[] | undefined): { done: number; total: number; all: boolean } => {
  const total = list?.length ?? 0;
  const done = list?.filter((x) => x.done).length ?? 0;
  // "3 önemli işin tamamı": üç iş yazılmış ve hepsi bitmiş olmalı
  return { done, total, all: total >= TOP_MAX && done === total };
};

/**
 * Taşıma önerisi: bugünden önceki en yakın (en çok `lookback` gün) günün tamamlanmamış işleri.
 * Bugünde aynı başlıklı iş varsa atlanır; bugünün boş yeri kadar döner.
 */
export function carryOverSuggestion(
  tops: Record<string, TopTask[]>,
  todayKey: string,
  lookback = 7,
): { from: string; items: TopTask[] } | null {
  const todayList = tops[todayKey] ?? [];
  const room = TOP_MAX - todayList.length;
  if (room <= 0) return null;
  const titles = new Set(todayList.map((x) => x.title.trim().toLowerCase()));
  for (let i = 1; i <= lookback; i++) {
    const day = addDays(todayKey, -i);
    const list = tops[day];
    if (!list || !list.length) continue;
    const open = list.filter((x) => !x.done && !titles.has(x.title.trim().toLowerCase()));
    if (!open.length) return null; // en yakın planlı gün temiz kapanmış
    return { from: day, items: open.slice(0, room) };
  }
  return null;
}

/** Taşıma uygula: kaynak günden seçilenleri bugüne ekler (kaynakta kalır, `from` işaretli). */
export function applyCarry(
  tops: Record<string, TopTask[]>,
  todayKey: string,
  sugg: { from: string; items: TopTask[] },
  newId: () => string,
): Record<string, TopTask[]> {
  const cur = tops[todayKey] ?? [];
  const add = sugg.items.slice(0, TOP_MAX - cur.length).map((x) => ({ id: newId(), title: x.title, done: false, from: sugg.from }));
  return { ...tops, [todayKey]: [...cur, ...add] };
}

/** Haftalık "3 önemli işin tamamı" günleri (Pzt-Paz) için boolean dizi. */
export const weekTopDays = (tops: Record<string, TopTask[]>, days: string[]): boolean[] => days.map((d) => top3Done(tops[d]).all);

/** Teşvik anahtarı. */
export function growthCheerKey(p: { top: { done: number; total: number }; activeGoals: number }): string {
  if (p.top.total === 0) return 'growth.cheer.plan';
  if (p.top.done === p.top.total) return p.top.total >= TOP_MAX ? 'growth.cheer.allDone' : 'growth.cheer.addMore';
  if (p.top.done > 0) return 'growth.cheer.going';
  return 'growth.cheer.start';
}
