/**
 * Haftalık rapor: saf hesaplamalar (React / RN / store yok; yalnız tipler içe aktarılır).
 * Hafta Pazartesi başlar, gün sınırı 03:00 (gün anahtarları engine/dates ile aynı).
 * Devam eden haftada yalnız geçmiş günler sayılır; geçen hafta ile karşılaştırma aynı gün sayısı üzerinden yapılır.
 * Test: tests/report.test.ts
 */
import { addDays, eachDay, weekStartKey, weekdayOf } from '../../engine/dates';
import { dayStats, standings } from '../../engine/leaderboard';
import { isPlannedOn } from '../../engine/points';
import type { Completion, Habit, PointEvent, Slot } from '../../engine/types';
import { dayCounts, moneySaved, reductionLimit } from '../life/calc';
import type { ChoreLog, MealEntry, SmokePlan, SmokePricing } from '../life/types';
import type { StudyItem, StudyLog } from '../study/types';
import type { TopTask } from '../growth/types';
import type { Lang } from '../../i18n/types';
import type { DrinkEntry } from '../../store/slices/drink';
import type { MoodEntry } from '../../store/slices/mood';
import type { SleepEntry } from '../../store/slices/sleep';

export const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'anytime'];

export interface TimerSessionLite {
  dayKey: string;
  minutes: number;
  tag?: string;
}

/** Raporun girdisi: store'lardan alınmış düz diziler / kayıtlar. */
export interface ReportData {
  meId: string;
  partnerId: string | null;
  /** hesaplamada "bugün" (gün sınırı uygulanmış gün anahtarı) */
  today: string;
  habits: Habit[];
  completions: Completion[];
  events: PointEvent[];
  mood: MoodEntry[];
  sleep: SleepEntry[];
  sleepGoalH: number;
  drink: DrinkEntry[];
  drinkGoalMl: number;
  smokeLogs: Array<{ dayKey: string }>;
  smokePlan: SmokePlan | null;
  smokePricing: SmokePricing | null;
  smokeClosed: Record<string, true>;
  meals: MealEntry[];
  mealsGoal: { fastMax: number; homeMin: number };
  choreLogs: ChoreLog[];
  studyItems: StudyItem[];
  studyLogs: StudyLog[];
  studyGoalH: number;
  timerSessions: TimerSessionLite[];
  tops: Record<string, TopTask[]>;
}

// ---------------------------------------------------------------- hafta aritmetiği

export const weekStartOf = (key: string): string => weekStartKey(key);
export const weekEndOf = (start: string): string => addDays(start, 6);
export const shiftWeek = (start: string, n: number): string => addDays(weekStartKey(start), 7 * n);
export const weekDaysOf = (start: string): string[] => eachDay(start, addDays(start, 6));

/** Karşılaştırma: delta, yüzde fark (önceki 0 ise null) ve yön. */
export interface Delta {
  cur: number;
  prev: number;
  delta: number;
  /** yüzde fark (tam sayıya yuvarlanır); önceki 0 ise null */
  pct: number | null;
  dir: 'up' | 'down' | 'same';
}
export function compare(cur: number, prev: number): Delta {
  const delta = cur - prev;
  const pct = prev === 0 ? null : Math.round(((cur - prev) / Math.abs(prev)) * 100);
  return { cur, prev, delta, pct, dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same' };
}

// ---------------------------------------------------------------- günlük olgular

export interface DayFacts {
  day: string;
  /** o gün kapanmadı (bugün): kısmi sayılabilecek takipçi ölçüleri insights'ta dışlanır */
  open: boolean;
  planned: number;
  done: number;
  slots: Record<Slot, { planned: number; done: number }>;
  points: number;
  tasks: number;
  mood: number | null;
  moodTags: string[];
  sleepH: number | null;
  /** su takibi başlamadıysa null */
  waterMl: number | null;
  waterHit: boolean | null;
  /** sigara planı yoksa / plan öncesi null */
  smoke: number | null;
  smokeLimit: number | null;
  mealsN: number;
  fast: number;
  home: number;
  healthy: number;
}

const emptySlots = (): DayFacts['slots'] => ({
  morning: { planned: 0, done: 0 },
  afternoon: { planned: 0, done: 0 },
  evening: { planned: 0, done: 0 },
  anytime: { planned: 0, done: 0 },
});

export function buildDayFacts(data: ReportData, days: string[]): DayFacts[] {
  const mine = data.habits.filter((h) => h.ownerId === data.meId);
  const doneSet = new Set<string>();
  for (const c of data.completions) if (c.userId === data.meId && !c.undone) doneSet.add(`${c.habitId}|${c.dayKey}`);

  const first = days[0];
  const last = days[days.length - 1];
  const stats = dayStats(data.meId, data.events, data.completions, first, last);

  const moodBy = new Map(data.mood.map((m) => [m.dayKey, m]));
  const sleepBy = new Map(data.sleep.map((s) => [s.dayKey, s]));
  const waterBy = new Map<string, number>();
  let firstWater: string | null = null;
  for (const e of data.drink) {
    waterBy.set(e.dayKey, (waterBy.get(e.dayKey) ?? 0) + e.ml);
    if (firstWater === null || e.dayKey < firstWater) firstWater = e.dayKey;
  }
  const smokeBy = dayCounts(data.smokeLogs);
  const mealsBy = new Map<string, MealEntry[]>();
  for (const m of data.meals) {
    const l = mealsBy.get(m.dayKey);
    if (l) l.push(m);
    else mealsBy.set(m.dayKey, [m]);
  }

  return days.map((day) => {
    const slots = emptySlots();
    let planned = 0;
    let done = 0;
    for (const h of mine) {
      if (!isPlannedOn(h, day)) continue;
      const s = slots[h.slot ?? 'anytime'];
      planned++;
      s.planned++;
      if (doneSet.has(`${h.id}|${day}`)) {
        done++;
        s.done++;
      }
    }
    const mood = moodBy.get(day);
    const sleep = sleepBy.get(day);
    const water = waterBy.get(day) ?? 0;
    const trackingWater = firstWater !== null && day >= firstWater;
    const plan = data.smokePlan;
    const smokeOn = !!plan && day >= plan.startDay;
    const meals = mealsBy.get(day) ?? [];
    const st = stats[day];
    return {
      day,
      open: day >= data.today,
      planned,
      done,
      slots,
      points: st?.points ?? 0,
      tasks: st?.tasks ?? 0,
      mood: mood ? mood.level : null,
      moodTags: mood?.tags ?? [],
      sleepH: sleep && sleep.minutes > 0 ? sleep.minutes / 60 : null,
      waterMl: trackingWater ? water : null,
      waterHit: trackingWater ? water >= data.drinkGoalMl : null,
      smoke: smokeOn ? (smokeBy[day] ?? 0) : null,
      smokeLimit: smokeOn && plan ? reductionLimit(plan, day) : null,
      mealsN: meals.length,
      fast: meals.filter((m) => m.kind === 'fast').length,
      home: meals.filter((m) => m.kind === 'home').length,
      healthy: meals.filter((m) => m.kind === 'healthy').length,
    };
  });
}

// ---------------------------------------------------------------- hafta istatistikleri

export interface SlotStat {
  slot: Slot;
  planned: number;
  done: number;
  rate: number | null;
}

export type RaceResult = 'win' | 'lose' | 'tie' | 'none';

export interface WeekStats {
  start: string;
  end: string;
  /** sayılan günler (geçmiş + bugün; gelecek hariç) */
  days: string[];
  /** hafta bitti mi (son gün geçmişte) */
  ended: boolean;
  hasData: boolean;
  points: number;
  tasks: number;
  planned: number;
  done: number;
  /** planlı görevlerin tamamlanma oranı 0..1 (planlı yoksa null) */
  rate: number | null;
  activeDays: number;
  /** hafta içi en uzun ardışık aktif gün */
  longestRun: number;
  slots: SlotStat[];
  bestDay: { day: string; points: number } | null;
  /** planlı görevi olan en zayıf gün */
  weakDay: { day: string; weekday: number; rate: number } | null;
  /** 7 günlük grafik: gelecek günlerde null */
  perDay: Array<{ day: string; points: number | null; rate: number | null }>;
  race: { mePoints: number; partnerPoints: number; result: RaceResult } | null;
  sleep: { avgH: number; n: number; goalH: number } | null;
  mood: { avg: number; n: number } | null;
  water: { goalDays: number; days: number; avgMl: number } | null;
  smoke: { limitDays: number; tracked: number; total: number; overDays: number; saved: number; currency: string } | null;
  meals: { fastFreeDays: number; tracked: number; home: number; fast: number; healthy: number; fastMax: number } | null;
  chores: { done: number } | null;
  study: { minutes: number; closed: number; goalMinutes: number } | null;
  growth: { topDays: number; plannedDays: number } | null;
}

/** Ondalık biçim: TR virgül, EN nokta; sondaki ",0" atılır. */
export function num(x: number, lang: Lang, digits = 1): string {
  const s = (Math.round(x * 10 ** digits) / 10 ** digits).toFixed(digits);
  const trimmed = digits > 0 ? s.replace(/\.0+$/, '') : s;
  return lang === 'tr' ? trimmed.replace('.', ',') : trimmed;
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Bir haftanın istatistikleri. `limitDays` verilirse yalnız haftanın ilk N günü sayılır
 * (devam eden haftayı geçen haftanın aynı günleriyle karşılaştırmak için).
 */
export function weekStats(data: ReportData, anyDayInWeek: string, limitDays?: number): WeekStats {
  const start = weekStartKey(anyDayInWeek);
  const end = addDays(start, 6);
  const all = weekDaysOf(start);
  let days = all.filter((d) => d <= data.today);
  if (limitDays !== undefined) days = days.slice(0, limitDays);
  const ended = end < data.today;
  const facts = days.length ? buildDayFacts(data, days) : [];

  const points = facts.reduce((a, f) => a + f.points, 0);
  const tasks = facts.reduce((a, f) => a + f.tasks, 0);
  const planned = facts.reduce((a, f) => a + f.planned, 0);
  const done = facts.reduce((a, f) => a + f.done, 0);
  const activeFlags = facts.map((f) => f.tasks > 0);
  const activeDays = activeFlags.filter(Boolean).length;
  let longestRun = 0;
  let run = 0;
  for (const a of activeFlags) {
    run = a ? run + 1 : 0;
    longestRun = Math.max(longestRun, run);
  }

  const slots: SlotStat[] = SLOTS.map((slot) => {
    const p = facts.reduce((a, f) => a + f.slots[slot].planned, 0);
    const d = facts.reduce((a, f) => a + f.slots[slot].done, 0);
    return { slot, planned: p, done: d, rate: p > 0 ? d / p : null };
  });

  let bestDay: WeekStats['bestDay'] = null;
  for (const f of facts) {
    if (f.points > 0 && (!bestDay || f.points > bestDay.points)) bestDay = { day: f.day, points: f.points };
  }
  let weakDay: WeekStats['weakDay'] = null;
  for (const f of facts) {
    if (f.planned < 2 || f.open) continue;
    const r = f.done / f.planned;
    if (!weakDay || r < weakDay.rate) weakDay = { day: f.day, weekday: weekdayOf(f.day), rate: r };
  }

  const factBy = new Map(facts.map((f) => [f.day, f]));
  const perDay = all.map((d) => {
    const f = factBy.get(d);
    return { day: d, points: f ? f.points : null, rate: f && f.planned > 0 ? f.done / f.planned : null };
  });

  let race: WeekStats['race'] = null;
  if (data.partnerId && days.length) {
    const last = days[days.length - 1];
    const s = standings('week', start, [data.meId, data.partnerId], data.events, data.completions, last);
    const me = s.rows.find((r) => r.userId === data.meId);
    const pa = s.rows.find((r) => r.userId === data.partnerId);
    const result: RaceResult = s.tie ? 'tie' : s.winnerId === data.meId ? 'win' : s.winnerId === data.partnerId ? 'lose' : 'none';
    race = { mePoints: me?.points ?? 0, partnerPoints: pa?.points ?? 0, result };
  }

  const sleeps = facts.filter((f) => f.sleepH !== null).map((f) => f.sleepH as number);
  const moods = facts.filter((f) => f.mood !== null).map((f) => f.mood as number);
  const sleep = sleeps.length ? { avgH: mean(sleeps), n: sleeps.length, goalH: data.sleepGoalH } : null;
  const mood = moods.length ? { avg: mean(moods), n: moods.length } : null;

  const waterDays = days.filter((d) => data.drink.some((e) => e.dayKey === d));
  const water = waterDays.length
    ? {
        goalDays: facts.filter((f) => f.waterHit === true).length,
        days: days.length,
        avgMl: Math.round(mean(facts.map((f) => f.waterMl ?? 0))),
      }
    : null;

  // sigara: kapanmış günler (bugün yalnız "günü kapat" yapıldıysa)
  let smoke: WeekStats['smoke'] = null;
  if (data.smokePlan) {
    const tr = facts.filter((f) => f.smoke !== null && (!f.open || data.smokeClosed[f.day]));
    if (tr.length) {
      const plan = data.smokePlan;
      const unsmoked = tr.reduce((a, f) => a + Math.max(0, plan.startPerDay - (f.smoke ?? 0)), 0);
      const pr = data.smokePricing;
      const limitDays = tr.filter((f) => (f.smoke ?? 0) <= (f.smokeLimit ?? 0)).length;
      smoke = {
        limitDays,
        tracked: tr.length,
        total: tr.reduce((a, f) => a + (f.smoke ?? 0), 0),
        overDays: tr.length - limitDays,
        saved: pr ? Math.round(moneySaved(unsmoked, pr.packPrice, pr.packSize)) : 0,
        currency: pr?.currency ?? 'TRY',
      };
    }
  }

  const mealFacts = facts.filter((f) => f.mealsN > 0);
  const meals: WeekStats['meals'] = mealFacts.length
    ? {
        fastFreeDays: mealFacts.filter((f) => f.fast === 0 && !f.open).length,
        tracked: mealFacts.filter((f) => !f.open).length,
        home: mealFacts.reduce((a, f) => a + f.home, 0),
        fast: mealFacts.reduce((a, f) => a + f.fast, 0),
        healthy: mealFacts.reduce((a, f) => a + f.healthy, 0),
        fastMax: data.mealsGoal.fastMax,
      }
    : null;

  const inDays = new Set(days);
  const choreDone = data.choreLogs.filter((l) => inDays.has(l.dayKey)).length;
  const chores = choreDone > 0 ? { done: choreDone } : null;

  let studyMin = 0;
  for (const s of data.timerSessions) if (inDays.has(s.dayKey) && (s.tag === 'lesson' || s.tag === 'homework' || s.tag === 'article')) studyMin += s.minutes;
  for (const l of data.studyLogs) if (inDays.has(l.dayKey)) studyMin += l.minutes;
  const closed = data.studyItems.filter((i) => i.doneDay && inDays.has(i.doneDay)).length;
  const study = studyMin > 0 || closed > 0 ? { minutes: Math.round(studyMin), closed, goalMinutes: Math.round(data.studyGoalH * 60) } : null;

  const topLists = days.map((d) => data.tops[d]).filter((l): l is TopTask[] => !!l && l.length > 0);
  const growth = topLists.length
    ? { topDays: topLists.filter((l) => l.length >= 3 && l.every((x) => x.done)).length, plannedDays: topLists.length }
    : null;

  const hasData =
    points > 0 || tasks > 0 || !!(sleep || mood || water || smoke || meals || chores || study || growth);

  return {
    start,
    end,
    days,
    ended,
    hasData,
    points,
    tasks,
    planned,
    done,
    rate: planned > 0 ? done / planned : null,
    activeDays,
    longestRun,
    slots,
    bestDay,
    weakDay,
    perDay,
    race,
    sleep,
    mood,
    water,
    smoke,
    meals,
    chores,
    study,
    growth,
  };
}

export interface WeekComparison {
  points: Delta;
  tasks: Delta;
  activeDays: Delta;
  /** tamamlama oranı, yüzde puan olarak (0..100); iki hafta da planlıysa */
  rate: Delta | null;
  /** karşılaştırma geçen haftanın ilk N günü ile mi yapıldı (devam eden hafta) */
  partial: boolean;
  prevHasData: boolean;
}

/** Bu hafta ↔ geçen hafta. Devam eden haftada geçen haftanın aynı sayıda günü alınır. */
export function weekComparison(data: ReportData, cur: WeekStats): WeekComparison {
  const partial = cur.days.length < 7;
  const prev = weekStats(data, shiftWeek(cur.start, -1), partial ? cur.days.length : undefined);
  const rate = cur.rate !== null && prev.rate !== null ? compare(Math.round(cur.rate * 100), Math.round(prev.rate * 100)) : null;
  return {
    points: compare(cur.points, prev.points),
    tasks: compare(cur.tasks, prev.tasks),
    activeDays: compare(cur.activeDays, prev.activeDays),
    rate,
    partial,
    prevHasData: prev.hasData,
  };
}

/** Veride görülen en eski gün (yoksa null) — hafta seçicinin alt sınırı. */
export function firstDataDay(data: ReportData): string | null {
  let min: string | null = null;
  const see = (d: string | undefined) => {
    if (d && (min === null || d < min)) min = d;
  };
  for (const c of data.completions) see(c.dayKey);
  for (const e of data.events) see(e.dayKey);
  for (const m of data.mood) see(m.dayKey);
  for (const s of data.sleep) see(s.dayKey);
  for (const e of data.drink) see(e.dayKey);
  for (const l of data.smokeLogs) see(l.dayKey);
  for (const m of data.meals) see(m.dayKey);
  for (const l of data.choreLogs) see(l.dayKey);
  for (const l of data.studyLogs) see(l.dayKey);
  for (const s of data.timerSessions) see(s.dayKey);
  return min;
}

/** Hiç anlamlı veri yok mu (yeni kullanıcı)? */
export const isEmptyData = (data: ReportData): boolean => firstDataDay(data) === null;
