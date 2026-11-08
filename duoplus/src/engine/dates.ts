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

export const TR_DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export const TR_DAYS_LONG = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function prettyDay(key: string): string {
  const d = parseDayKey(key);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${TR_DAYS_LONG[weekdayOf(key)]}`;
}

/** "HH:MM" -> dakikalar */
export function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}
