/**
 * Haftalık rapor içgörüleri ve öneriler: saf, kural tabanlı, cihazda.
 *
 * Dürüstlük kuralları:
 *  - Bir içgörü için en az MIN_DAYS (4) gün çift-değişkenli veri ve her grupta en az MIN_GROUP (2) gün gerekir.
 *  - Etki küçükse (eşiğin altında) gösterilmez. Dil "birlikte görülüyor"dur; nedensellik iddia edilmez.
 *  - Her içgörü kaç güne dayandığını taşır (`n`).
 *  - Pencere: seçili haftanın bitişinden geriye 28 gün (bugünden ilerisi hariç); bugün gibi kapanmamış günler,
 *    kısmi olabilecek ölçüler (sigara, öğün, su hedefi) için dışlanır.
 * Test: tests/report.test.ts
 */
import { addDays, eachDay } from '../../engine/dates';
import type { Slot } from '../../engine/types';
import { buildDayFacts, SLOTS, type DayFacts, type ReportData, type WeekStats } from './calc';

export const MIN_DAYS = 4;
export const MIN_GROUP = 2;
export const WINDOW_DAYS = 28;
export const MAX_INSIGHTS = 5;
export const SLEEP_HI = 7;

export type InsightId = 'sleepMood' | 'sleepRate' | 'morningRate' | 'moodRate' | 'smokeStress' | 'fastWater' | 'waterRate';

export interface Insight {
  id: InsightId;
  /** A grubunun ölçüsü B'ye göre daha yüksek mi düşük mü */
  dir: 'higher' | 'lower';
  /** dayandığı toplam gün */
  n: number;
  nA: number;
  nB: number;
  /** A / B grup ortalamaları (oranlar 0..1) */
  a: number;
  b: number;
  /** a - b */
  diff: number;
  /** ilgi puanı 0..1 */
  score: number;
}

export interface GroupCompare {
  n: number;
  nA: number;
  nB: number;
  a: number;
  b: number;
  diff: number;
}

/**
 * Günleri `inA` ile iki gruba ayırıp `metric` ortalamalarını karşılaştırır.
 * Ölçüsü ya da grubu null olan gün dışlanır. Yetersiz veri → null.
 */
export function splitCompare(
  facts: DayFacts[],
  inA: (f: DayFacts) => boolean | null,
  metric: (f: DayFacts) => number | null,
): GroupCompare | null {
  const A: number[] = [];
  const B: number[] = [];
  for (const f of facts) {
    const g = inA(f);
    const m = metric(f);
    if (g === null || m === null) continue;
    (g ? A : B).push(m);
  }
  const n = A.length + B.length;
  if (n < MIN_DAYS || A.length < MIN_GROUP || B.length < MIN_GROUP) return null;
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const a = mean(A);
  const b = mean(B);
  return { n, nA: A.length, nB: B.length, a, b, diff: a - b };
}

/** İlgi puanı: etki büyüklüğü (ölçeğe göre) × örnek büyüklüğü ağırlığı. */
export function interestScore(absDiff: number, scale: number, n: number): number {
  return Math.min(1, absDiff / scale) * (0.5 + 0.5 * Math.min(1, n / 14));
}

const dayRate = (f: DayFacts): number | null => (f.planned > 0 ? f.done / f.planned : null);

interface Def {
  id: InsightId;
  /** gösterim için en küçük |fark| */
  threshold: number;
  /** puan normalizasyonu */
  scale: number;
  inA: (f: DayFacts) => boolean | null;
  metric: (f: DayFacts) => number | null;
}

const closed = (f: DayFacts) => !f.open;

const DEFS: Def[] = [
  // 7+ saat uyunan günler ↔ aynı günün ruh hali (1..5)
  { id: 'sleepMood', threshold: 0.3, scale: 1.5, inA: (f) => (f.sleepH === null ? null : f.sleepH >= SLEEP_HI), metric: (f) => f.mood },
  // 7+ saat uyunan günler ↔ planlı görev tamamlama oranı
  { id: 'sleepRate', threshold: 0.1, scale: 0.4, inA: (f) => (f.sleepH === null ? null : f.sleepH >= SLEEP_HI), metric: (f) => (closed(f) ? dayRate(f) : null) },
  // sabah görevlerinin tümü bitince, günün kalan görevleri
  {
    id: 'morningRate',
    threshold: 0.1,
    scale: 0.4,
    inA: (f) => (closed(f) && f.slots.morning.planned > 0 ? f.slots.morning.done === f.slots.morning.planned : null),
    metric: (f) => {
      const p = f.planned - f.slots.morning.planned;
      return p > 0 ? (f.done - f.slots.morning.done) / p : null;
    },
  },
  // ruh hali 4-5 olan günler ↔ tamamlama oranı
  { id: 'moodRate', threshold: 0.1, scale: 0.4, inA: (f) => (f.mood === null ? null : f.mood >= 4), metric: (f) => (closed(f) ? dayRate(f) : null) },
  // "stresli" etiketli günler ↔ içilen sigara adedi
  {
    id: 'smokeStress',
    threshold: 1,
    scale: 4,
    inA: (f) => (f.mood === null || f.smoke === null || f.open ? null : f.moodTags.includes('stressed')),
    metric: (f) => (f.open ? null : f.smoke),
  },
  // fast food yenen günler ↔ su hedefi tutturuldu mu (0/1)
  {
    id: 'fastWater',
    threshold: 0.2,
    scale: 0.6,
    inA: (f) => (f.mealsN === 0 || f.open ? null : f.fast > 0),
    metric: (f) => (f.waterHit === null || f.open ? null : f.waterHit ? 1 : 0),
  },
  // su hedefi tutturulan günler ↔ tamamlama oranı
  { id: 'waterRate', threshold: 0.1, scale: 0.4, inA: (f) => (f.open ? null : f.waterHit), metric: (f) => (closed(f) ? dayRate(f) : null) },
];

/** Analiz penceresi: haftanın bitişinden (en fazla bugün) geriye WINDOW_DAYS gün. */
export function windowDays(weekEnd: string, today: string, size = WINDOW_DAYS): string[] {
  const to = weekEnd < today ? weekEnd : today;
  return eachDay(addDays(to, -(size - 1)), to);
}

/** Verilen gün olgularından içgörüler (ilgi puanına göre sıralı, en fazla `max`). */
export function insightsFromFacts(facts: DayFacts[], max = MAX_INSIGHTS): Insight[] {
  const out: Insight[] = [];
  for (const def of DEFS) {
    const g = splitCompare(facts, def.inA, def.metric);
    if (!g) continue;
    if (Math.abs(g.diff) < def.threshold) continue;
    out.push({
      id: def.id,
      dir: g.diff > 0 ? 'higher' : 'lower',
      n: g.n,
      nA: g.nA,
      nB: g.nB,
      a: g.a,
      b: g.b,
      diff: g.diff,
      score: interestScore(Math.abs(g.diff), def.scale, g.n),
    });
  }
  out.sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : 1));
  return out.slice(0, max);
}

/** Seçili hafta için içgörüler. */
export function computeInsights(data: ReportData, weekEnd: string): Insight[] {
  const days = windowDays(weekEnd, data.today);
  return insightsFromFacts(buildDayFacts(data, days));
}

// ---------------------------------------------------------------- öneriler

export type SuggestionId =
  | 'slot'
  | 'weakDay'
  | 'sleep'
  | 'sleepLink'
  | 'water'
  | 'smoke'
  | 'fast'
  | 'study'
  | 'growth'
  | 'activeDays'
  | 'keep'
  | 'planSunday'
  | 'smallStart'
  | 'anchor';

export interface Suggestion {
  id: SuggestionId;
  prio: number;
  /** i18n yer tutucuları (sayılar ham; ekran biçimler) */
  params: Record<string, number>;
  slot?: Slot;
  /** 0 = Pazartesi */
  weekday?: number;
}

/**
 * Gelecek hafta için 3 somut öneri: hafta istatistiklerinden ve içgörülerden kural tabanlı türetilir.
 * Her zaman tam 3 öneri döner (veri azsa genel, küçük adımlar eklenir).
 */
export function suggestions(stats: WeekStats, insights: Insight[]): Suggestion[] {
  const c: Suggestion[] = [];

  // en zayıf zaman dilimi
  const weakSlot = stats.slots
    .filter((s) => s.planned >= 3 && s.rate !== null && s.rate < 0.6)
    .sort((a, b) => (a.rate as number) - (b.rate as number))[0];
  if (weakSlot) c.push({ id: 'slot', prio: 80 + Math.round((1 - (weakSlot.rate as number)) * 10), params: { pct: Math.round((weakSlot.rate as number) * 100) }, slot: weakSlot.slot });

  if (stats.weakDay && stats.weakDay.rate < 0.6) {
    c.push({ id: 'weakDay', prio: 70, params: { pct: Math.round(stats.weakDay.rate * 100) }, weekday: stats.weakDay.weekday });
  }

  if (stats.sleep && stats.sleep.avgH < stats.sleep.goalH - 0.5) {
    c.push({ id: 'sleep', prio: 85, params: { avg: stats.sleep.avgH, goal: stats.sleep.goalH } });
  }
  const sm = insights.find((i) => i.id === 'sleepMood' && i.dir === 'higher');
  if (sm) c.push({ id: 'sleepLink', prio: 75, params: { hours: SLEEP_HI } });

  if (stats.water && stats.water.days >= 3 && stats.water.goalDays < Math.ceil(stats.water.days / 2)) {
    c.push({ id: 'water', prio: 72, params: { n: stats.water.goalDays, m: stats.water.days } });
  }
  if (stats.smoke && stats.smoke.overDays > 0) {
    c.push({ id: 'smoke', prio: 88, params: { n: stats.smoke.overDays } });
  }
  if (stats.meals && stats.meals.fast > stats.meals.fastMax) {
    c.push({ id: 'fast', prio: 78, params: { n: stats.meals.fast, max: stats.meals.fastMax } });
  }
  if (stats.study && stats.study.goalMinutes > 0 && stats.study.minutes < stats.study.goalMinutes) {
    c.push({ id: 'study', prio: 74, params: { h: Math.round((stats.study.minutes / 60) * 10) / 10, goal: Math.round((stats.study.goalMinutes / 60) * 10) / 10 } });
  }
  if (stats.growth && stats.growth.topDays < stats.growth.plannedDays) {
    c.push({ id: 'growth', prio: 68, params: { n: stats.growth.topDays, m: stats.growth.plannedDays } });
  }
  if (stats.ended && stats.activeDays < 5 && stats.activeDays > 0) {
    c.push({ id: 'activeDays', prio: 65, params: { n: stats.activeDays } });
  }
  if (stats.rate !== null && stats.rate >= 0.8) c.push({ id: 'keep', prio: 60, params: { pct: Math.round(stats.rate * 100) } });

  // genel, küçük adımlar (her zaman 3'e tamamlar)
  c.push({ id: 'planSunday', prio: 30, params: {} });
  c.push({ id: 'smallStart', prio: 20, params: {} });
  c.push({ id: 'anchor', prio: 10, params: {} });

  return c.sort((a, b) => b.prio - a.prio).slice(0, 3);
}

export { SLOTS };
