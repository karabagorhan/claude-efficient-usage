import { CONFIG } from './config';
import type { Weekday } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Tarihin yerel YYYY-MM-DD biçimi (gün sınırı uygulanmadan). */
export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" -> yerel öğlen Date (DST kaymalarından güvenli). */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Gün sınırı (varsayılan 03:00): 02:59'daki iş hâlâ önceki güne yazılır. */
export function dayKeyOf(date: Date = new Date(), boundaryHour = CONFIG.dayBoundaryHour): string {
  return fmtDate(new Date(date.getTime() - boundaryHour * 3600 * 1000));
}

export function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

/** 0 = Pazartesi ... 6 = Pazar */
export function weekdayOf(key: string): Weekday {
  return ((parseDayKey(key).getDay() + 6) % 7) as Weekday;
}

export function weekStartKey(key: string): string {
  return addDays(key, -weekdayOf(key));
}

export function monthKeyOf(key: string): string {
  return key.slice(0, 7); // YYYY-MM
}

export function monthStartKey(key: string): string {
  return `${monthKeyOf(key)}-01`;
}

export function daysInMonth(key: string): number {
  const d = parseDayKey(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** [başlangıç, bitiş] (dahil) gün anahtarları. */
export function periodRange(period: 'day' | 'week' | 'month', anchor: string): [string, string] {
  if (period === 'day') return [anchor, anchor];
  if (period === 'week') {
    const s = weekStartKey(anchor);
    return [s, addDays(s, 6)];
  }
  const s = monthStartKey(anchor);
  return [s, addDays(s, daysInMonth(anchor) - 1)];
}

/** b - a (gün). Öğlen tabanlı olduğu için yaz saati kaymasından etkilenmez. */
export function diffDays(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86400000);
}

/** b'nin ayı - a'nın ayı (takvim ayı farkı). */
export function diffMonths(a: string, b: string): number {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  let k = from;
  let guard = 0;
  while (k <= to && guard++ < 800) {
    out.push(k);
    k = addDays(k, 1);
  }
  return out;
}

// Gün / ay adları ve biçimlendirme: src/i18n/dates.ts (iki dilli).

/** "HH:MM" -> dakikalar */
export function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}
