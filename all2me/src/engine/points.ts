import { CONFIG } from './config';
import { addDays, dayKeyOf, daysInMonth, diffDays, diffMonths, hhmmToMinutes, parseDayKey, weekStartKey, weekdayOf } from './dates';
import { countsForScore, type Completion, type Every, type Habit, type PointEvent, type Schedule } from './types';

/** Puan/seri hesabına giren tamamlama (geri alınmamış, önceden işaretlenmemiş). */
const active = countsForScore;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Geçerli esnek tekrar mı? (bozuk/eksik veri planı bozmasın: geçersizse yok sayılır) */
export function validEvery(e: Every | undefined): e is Every {
  return Boolean(e && (e.unit === 'day' || e.unit === 'week' || e.unit === 'month') && Number.isFinite(e.n) && e.n >= 1 && DAY_RE.test(e.anchor ?? ''));
}

/** Esnek tekrara göre o gün planlı mı (çapa öncesi değil). */
export function everyMatches(every: Every, days: Schedule['days'], dayKey: string): boolean {
  const n = Math.max(1, Math.floor(every.n));
  if (dayKey < every.anchor) return false;
  if (every.unit === 'day') return diffDays(every.anchor, dayKey) % n === 0;
  if (every.unit === 'week') {
    const weeks = Math.round(diffDays(weekStartKey(every.anchor), weekStartKey(dayKey)) / 7);
    if (weeks % n !== 0) return false;
    const wd = weekdayOf(dayKey);
    return days && days.length ? days.includes(wd) : wd === weekdayOf(every.anchor);
  }
  // month: ayın çapa günü; kısa aylarda ayın son günü
  const months = diffMonths(every.anchor, dayKey);
  if (months % n !== 0) return false;
  const want = Math.min(Number(every.anchor.slice(8, 10)), daysInMonth(dayKey));
  return Number(dayKey.slice(8, 10)) === want;
}

/** Bir görev o gün planlı mı? (Kotalı görevler her gün "planlı" sayılmaz.) */
export function isPlannedOn(habit: Habit, dayKey: string): boolean {
  if (habit.archived) return false;
  if (dayKey < habit.createdAt.slice(0, 10)) return false;
  if (habit.schedule.weeklyQuota) return false;
  const days = habit.schedule.days;
  if (validEvery(habit.schedule.every)) return everyMatches(habit.schedule.every, days, dayKey);
  if (!days || days.length === 0) return true;
  return days.includes(weekdayOf(dayKey));
}

/** Görevin `from` gününden (dahil) itibaren planlı olduğu ilk `count` gün (en çok `horizon` gün ileri bakar). */
export function nextPlannedDays(habit: Habit, from: string, count: number, horizon = 400): string[] {
  const out: string[] = [];
  let k = from;
  for (let i = 0; i < horizon && out.length < count; i++) {
    if (isPlannedOn({ ...habit, archived: false }, k)) out.push(k);
    k = addDays(k, 1);
  }
  return out;
}

export function multiplierForStreak(streakDays: number): number {
  let m = 1;
  for (const [min, mult] of CONFIG.streakMultipliers) if (streakDays >= min) m = mult;
  return m;
}

/**
 * Görev serisi (gün). Planlı olmayan günler nötrdür.
 * Bugün planlı ama henüz yapılmadıysa seri bozulmaz.
 * Kotalı görevlerde birim haftadır; çarpan için hafta × 7 kullanılır.
 */
export function currentStreak(habit: Habit, completions: Completion[], today: string): number {
  const done = new Set(
    completions.filter((c) => c.habitId === habit.id && active(c)).map((c) => c.dayKey),
  );
  // önceden işaretlenen günler nötr: seriyi ne artırır ne bozar
  const advance = new Set(
    completions.filter((c) => c.habitId === habit.id && !c.undone && c.advance).map((c) => c.dayKey),
  );
  const created = habit.createdAt.slice(0, 10);

  if (habit.schedule.weeklyQuota) {
    const quota = habit.schedule.weeklyQuota;
    let streakWeeks = 0;
    let ws = weekStartKey(today);
    let first = true;
    for (let i = 0; i < 120; i++) {
      let n = 0;
      for (let d = 0; d < 7; d++) if (done.has(addDays(ws, d))) n++;
      if (n >= quota) streakWeeks++;
      else if (!first) break;
      first = false;
      ws = addDays(ws, -7);
      if (addDays(ws, 6) < created) break;
    }
    return streakWeeks * 7;
  }

  let streak = 0;
  let k = today;
  for (let i = 0; i < 400; i++) {
    if (k < created) break;
    if (isPlannedOn(habit, k) && !advance.has(k)) {
      if (done.has(k)) streak++;
      else if (k !== today) break;
    }
    k = addDays(k, -1);
  }
  return streak;
}

export interface CompletionScore {
  base: number;
  multiplier: number;
  earlyBonus: number;
  points: number;
  /** i18n anahtarı */
  note?: string;
}

interface ScoreInput {
  habit: Habit;
  /** Bu tamamlama dahil seri günü */
  streakDays: number;
  completedAt: Date;
  /** Aynı gün bu kullanıcının önceki (geri alınmamış) tamamlamaları */
  todays: Completion[];
  habitsById: Record<string, Habit>;
  /** Gün içinde önceden kazanılan toplam puan (bonuslar hariç tamamlamalar) */
  dayTotalSoFar: number;
}

export function scoreCompletion(i: ScoreInput): CompletionScore {
  const { habit, completedAt, todays, habitsById } = i;
  let base: number = CONFIG.basePoints[habit.difficulty];
  let note: string | undefined;

  // Yeni görev ilk 24 saatte %50
  const ageMs = completedAt.getTime() - new Date(habit.createdAt).getTime();
  if (ageMs < 24 * 3600 * 1000) {
    base = Math.round(base * CONFIG.newTaskFirst24hRate);
    note = 'points.note.newTask';
  }

  // Zorluk bazlı günlük limitler
  const limit = CONFIG.limits[habit.difficulty];
  if (limit !== undefined) {
    const sameTier = todays.filter((c) => habitsById[c.habitId]?.difficulty === habit.difficulty).length;
    if (sameTier >= limit) {
      return { base: 0, multiplier: 1, earlyBonus: 0, points: 0, note: 'points.note.tierLimit' };
    }
  }

  const multiplier = multiplierForStreak(i.streakDays);
  let points = Math.round(base * multiplier);

  // Erken bonus
  let earlyBonus = 0;
  if (habit.dueTime) {
    const nowMin = completedAt.getHours() * 60 + completedAt.getMinutes();
    const lead = hhmmToMinutes(habit.dueTime) - nowMin;
    if (lead >= CONFIG.early.minLeadMinutes) {
      const spent = todays.reduce((s, c) => s + c.earlyBonus, 0);
      const raw = Math.min(CONFIG.early.max, Math.max(CONFIG.early.min, Math.round(base * CONFIG.early.pct)));
      earlyBonus = Math.max(0, Math.min(raw, CONFIG.early.dailyMax - spent));
    }
  }
  points += earlyBonus;

  // Günlük yumuşak / sert tavan
  const before = i.dayTotalSoFar;
  let allowed = 0;
  let remaining = points;
  const soft = CONFIG.softCap.points;
  if (before < soft) {
    const full = Math.min(remaining, soft - before);
    allowed += full;
    remaining -= full;
  }
  if (remaining > 0) {
    const room = Math.max(0, CONFIG.hardCap - Math.max(before, soft));
    allowed += Math.min(room, Math.round(remaining * CONFIG.softCap.overRate));
    note = 'points.note.dailyCap';
  }
  return { base, multiplier, earlyBonus, points: allowed, note };
}

export interface DayBonuses {
  perfect: number;
  almost: number;
  plannedCount: number;
  doneCount: number;
}

/** Mükemmel gün / "neredeyse" bonusu: planlı görevler üzerinden, deterministik. */
export function computeDayBonuses(
  habits: Habit[],
  completions: Completion[],
  userId: string,
  dayKey: string,
  newbieProtection = false,
): DayBonuses {
  // önceden işaretlenen görevler o gün için nötr: plandan da tamamlananlardan da çıkar (bonus hesabına girmez)
  const advanced = new Set(
    completions.filter((c) => c.userId === userId && c.dayKey === dayKey && !c.undone && c.advance).map((c) => c.habitId),
  );
  const planned = habits.filter((h) => h.ownerId === userId && isPlannedOn(h, dayKey) && !advanced.has(h.id));
  const done = new Set(
    completions.filter((c) => c.userId === userId && c.dayKey === dayKey && active(c)).map((c) => c.habitId),
  );
  const doneCount = planned.filter((h) => done.has(h.id)).length;
  const out: DayBonuses = { perfect: 0, almost: 0, plannedCount: planned.length, doneCount };
  if (planned.length < CONFIG.perfectDay.minTasks) return out;

  const sumBase = planned.reduce((s, h) => s + CONFIG.basePoints[h.difficulty], 0);
  const ratio = doneCount / planned.length;
  const almostThreshold = newbieProtection ? CONFIG.perfectDay.almostPct : 1;
  if (ratio >= 1 || (newbieProtection && ratio >= almostThreshold)) {
    out.perfect = Math.min(
      CONFIG.perfectDay.max,
      Math.max(CONFIG.perfectDay.min, Math.round(sumBase * CONFIG.perfectDay.pct)),
    );
  } else if (ratio >= CONFIG.perfectDay.almostPct) {
    out.almost = CONFIG.perfectDay.almostBonus;
  }
  return out;
}

/** Haftalık kota bonusu: tüm kotalı görevler tamamlandıysa, haftada bir kez. */
export function weeklyQuotaMet(habits: Habit[], completions: Completion[], userId: string, weekStart: string): boolean {
  const quotaHabits = habits.filter((h) => h.ownerId === userId && !h.archived && h.schedule.weeklyQuota);
  if (quotaHabits.length === 0) return false;
  return quotaHabits.every((h) => {
    const n = new Set(
      completions
        .filter((c) => c.habitId === h.id && active(c) && c.dayKey >= weekStart && c.dayKey <= addDays(weekStart, 6))
        .map((c) => c.dayKey),
    ).size;
    return n >= (h.schedule.weeklyQuota ?? 1);
  });
}

/** Bir kullanıcının bir günde bonus olaylarını (derived) üretir. */
export function deriveBonusEvents(
  habits: Habit[],
  completions: Completion[],
  userId: string,
  dayKey: string,
  newbieProtection = false,
): PointEvent[] {
  const b = computeDayBonuses(habits, completions, userId, dayKey, newbieProtection);
  const events: PointEvent[] = [];
  const createdAt = parseDayKey(dayKey).toISOString();
  if (b.perfect > 0) {
    events.push({ id: `perfect:${userId}:${dayKey}`, userId, dayKey, type: 'perfect_day', points: b.perfect, createdAt, labelKey: 'points.event.perfect_day' });
  } else if (b.almost > 0) {
    events.push({ id: `almost:${userId}:${dayKey}`, userId, dayKey, type: 'almost_perfect', points: b.almost, createdAt, labelKey: 'points.event.almost_perfect' });
  }
  const ws = weekStartKey(dayKey);
  if (weeklyQuotaMet(habits, completions, userId, ws)) {
    // Bonus, kotanın tamamlandığı günün (haftanın en son kota tamamlaması) gününe yazılır.
    const lastDay = completions
      .filter((c) => c.userId === userId && active(c) && c.dayKey >= ws && c.dayKey <= addDays(ws, 6))
      .map((c) => c.dayKey)
      .sort()
      .pop();
    if (lastDay === dayKey) {
      events.push({ id: `weekly:${userId}:${ws}`, userId, dayKey, type: 'weekly_bonus', points: CONFIG.weeklyPerfectBonus, createdAt, labelKey: 'points.event.weekly_bonus' });
    }
  }
  return events;
}

export { dayKeyOf };
