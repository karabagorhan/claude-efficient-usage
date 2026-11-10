/**
 * Okul panosu için saf hesaplamalar (React/RN yok). Test: tests/study.test.ts
 */
import { addDays, fmtDate, parseDayKey, weekStartKey } from '../../engine/dates';
import { isClosed, type StudyItem, type StudyLog, type StudyTimerTag } from './types';

export type CountdownTone = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later' | 'none' | 'closed';
export interface Countdown {
  /** i18n anahtarı (study.cd.*) */
  key: string;
  params?: { n?: number; time?: string };
  tone: CountdownTone;
  /** bugünden teslime gün farkı (negatif = gecikmiş) */
  days: number | null;
}

/** İki gün anahtarı arasındaki gün farkı (b - a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86400000);
}

const hhmmNow = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * Geri sayım: "3 gün kaldı / Yarın / Bugün 23:59 / 2 gün gecikti".
 * `todayKey` gün sınırlı bugün (today()), `now` saat karşılaştırması için.
 */
export function countdown(due: string | undefined, time: string | undefined, todayKey: string, now: Date = new Date()): Countdown {
  if (!due) return { key: 'study.cd.noDate', tone: 'none', days: null };
  const d = dayDiff(todayKey, due);
  if (d < 0) return { key: d === -1 ? 'study.cd.overdue1' : 'study.cd.overdue', params: { n: -d }, tone: 'overdue', days: d };
  if (d === 0) {
    // saat geçtiyse (takvim günü teslim günüyse) gecikmiş say
    if (time && fmtDate(now) === due && hhmmNow(now) > time) return { key: 'study.cd.passed', tone: 'overdue', days: 0 };
    return { key: 'study.cd.today', params: { time: time ?? '23:59' }, tone: 'today', days: 0 };
  }
  if (d === 1) return { key: time ? 'study.cd.tomorrowAt' : 'study.cd.tomorrow', params: time ? { time } : undefined, tone: 'tomorrow', days: 1 };
  return { key: 'study.cd.days', params: { n: d }, tone: d <= 7 ? 'soon' : 'later', days: d };
}

/** Öğe ilerlemesi 0..1: bitti → 1; makale → sayfa; alt görev → oran; aksi halde durum. */
export function itemProgress(it: StudyItem): number {
  if (isClosed(it.status)) return 1;
  if (it.type === 'reading' && it.paper && it.paper.pagesTotal > 0) return Math.min(1, it.paper.pagesRead / it.paper.pagesTotal);
  if (it.subtasks.length) return it.subtasks.filter((s) => s.done).length / it.subtasks.length;
  return it.status === 'doing' ? 0.25 : 0;
}

/** Kalan tahmini saat: tahmin × (1 − ilerleme). */
export const remainingHours = (it: StudyItem): number => (isClosed(it.status) ? 0 : (it.estHours ?? 0) * (1 - itemProgress(it)));

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Bu haftanın yükü: bu hafta (Pzt-Paz) teslim edilecek + gecikmiş açık öğelerin kalan tahmini saati. */
export function weekLoad(items: StudyItem[], todayKey: string): { hours: number; count: number } {
  const end = addDays(weekStartKey(todayKey), 6);
  let hours = 0;
  let count = 0;
  for (const it of items) {
    if (isClosed(it.status) || !it.due || it.due > end) continue;
    hours += remainingHours(it);
    count++;
  }
  return { hours: round1(hours), count };
}

export const overdueCount = (items: StudyItem[], todayKey: string): number =>
  items.filter((it) => !isClosed(it.status) && !!it.due && it.due < todayKey).length;

/** Bugünden hafta sonuna (Pazar) kadar teslimi olan açık öğe sayısı. */
export function dueThisWeekCount(items: StudyItem[], todayKey: string): number {
  const end = addDays(weekStartKey(todayKey), 6);
  return items.filter((it) => !isClosed(it.status) && !!it.due && it.due >= todayKey && it.due <= end).length;
}

/** Açık öğeler teslim sırasına göre (gecikmiş önce, tarihsizler sonda; aynı günde saat ve öncelik). */
export function upcoming(items: StudyItem[], limit = Infinity): StudyItem[] {
  const pr = { high: 0, med: 1, low: 2 } as const;
  return items
    .filter((it) => !isClosed(it.status))
    .sort((a, b) => {
      const ad = a.due ?? '9999-12-31';
      const bd = b.due ?? '9999-12-31';
      if (ad !== bd) return ad < bd ? -1 : 1;
      const at = a.time ?? '23:59';
      const bt = b.time ?? '23:59';
      if (at !== bt) return at < bt ? -1 : 1;
      if (pr[a.priority] !== pr[b.priority]) return pr[a.priority] - pr[b.priority];
      return a.createdAt < b.createdAt ? -1 : 1;
    })
    .slice(0, limit);
}

/** Ders ilerlemesi: kapanan / toplam öğe. */
export function courseProgress(items: StudyItem[]): { done: number; total: number; ratio: number } {
  const total = items.length;
  const done = items.filter((i) => isClosed(i.status)).length;
  return { done, total, ratio: total ? done / total : 0 };
}

/** Okuma listesi toplamı. */
export function readingTotals(items: StudyItem[]): { read: number; total: number; papers: number; finished: number } {
  let read = 0;
  let total = 0;
  let finished = 0;
  const papers = items.filter((i) => i.type === 'reading');
  for (const p of papers) {
    read += p.paper?.pagesRead ?? 0;
    total += p.paper?.pagesTotal ?? 0;
    if (isClosed(p.status)) finished++;
  }
  return { read, total, papers: papers.length, finished };
}

/** Hafta (Pzt-Paz) gün anahtarları. */
export const weekDays = (todayKey: string): string[] => {
  const s = weekStartKey(todayKey);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
};

type TagMinutes = Partial<Record<string, number>>;
/** Haftalık çalışma dakikası: zamanlayıcı etiketleri (Ders+Ödev+Makale) + elle kayıtlar. */
export function studyMinutes(timer: TagMinutes, logs: StudyLog[], from: string, to: string): number {
  const tags: StudyTimerTag[] = ['lesson', 'homework', 'article'];
  let m = 0;
  for (const tg of tags) m += timer[tg] ?? 0;
  for (const l of logs) if (l.dayKey >= from && l.dayKey <= to) m += l.minutes;
  return Math.round(m);
}

/** Gün gün çalışma dakikası (grafik için). sessions: zamanlayıcı oturumları {dayKey, minutes, tag}. */
export function dailyStudyMinutes(
  sessions: Array<{ dayKey: string; minutes: number; tag?: string }>,
  logs: StudyLog[],
  days: string[],
): number[] {
  const idx = new Map(days.map((d, i) => [d, i]));
  const out = days.map(() => 0);
  for (const s of sessions) {
    const i = idx.get(s.dayKey);
    if (i !== undefined && (s.tag === 'lesson' || s.tag === 'homework' || s.tag === 'article')) out[i] += s.minutes;
  }
  for (const l of logs) {
    const i = idx.get(l.dayKey);
    if (i !== undefined) out[i] += l.minutes;
  }
  return out.map((x) => Math.round(x));
}

/**
 * Bir öğe için hatırlatma anları (yalnız gelecektekiler):
 * dayBefore → teslimden bir gün önce 09:00 (saat verildiyse teslimden 24 saat önce), morning → teslim günü 09:00.
 */
export function reminderTimes(it: StudyItem, now: Date = new Date()): Array<{ kind: 'dayBefore' | 'morning'; date: Date }> {
  if (!it.due || isClosed(it.status)) return [];
  const base = parseDayKey(it.due);
  const out: Array<{ kind: 'dayBefore' | 'morning'; date: Date }> = [];
  if (it.remind.dayBefore) {
    const d = new Date(base);
    d.setDate(d.getDate() - 1);
    if (it.time) {
      const [h, m] = it.time.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    } else d.setHours(9, 0, 0, 0);
    out.push({ kind: 'dayBefore', date: d });
  }
  if (it.remind.morning) {
    const d = new Date(base);
    d.setHours(9, 0, 0, 0);
    // teslim saati 09:00'dan önceyse sabah hatırlatıcısı teslimden 1 saat önce
    if (it.time && it.time <= '09:00') {
      const [h, m] = it.time.split(':').map(Number);
      d.setHours(Math.max(0, h - 1), m, 0, 0);
    }
    out.push({ kind: 'morning', date: d });
  }
  return out.filter((x) => x.date.getTime() > now.getTime());
}

/** Teşvik mesajı anahtarı (pano üstü). */
export function studyCheerKey(p: { overdue: number; dueToday: number; weekMinutes: number; weekGoalMinutes: number; closedThisWeek: number }): string {
  if (p.overdue > 0) return 'study.cheer.overdue';
  if (p.dueToday > 0) return 'study.cheer.today';
  if (p.weekGoalMinutes > 0 && p.weekMinutes >= p.weekGoalMinutes) return 'study.cheer.goal';
  if (p.closedThisWeek > 0) return 'study.cheer.progress';
  return 'study.cheer.start';
}

/** Saat:dakika biçimi "3 sa 20 dk" için parçalar. */
export const splitMinutes = (m: number) => ({ h: Math.floor(m / 60), m: Math.round(m % 60) });
