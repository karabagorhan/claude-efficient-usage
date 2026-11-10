/** Seri Takvimi yardımcıları (Pazartesi başlar). */
import { addDays, daysInMonth, monthStartKey, weekdayOf } from '../../engine/dates';

/** Ayın ızgarası: baştaki boşluklar null, sonra gün anahtarları. */
export function monthCells(anyDayInMonth: string): Array<string | null> {
  const start = monthStartKey(anyDayInMonth);
  const lead = weekdayOf(start);
  const n = daysInMonth(start);
  const cells: Array<string | null> = Array.from({ length: lead }, () => null);
  for (let i = 0; i < n; i++) cells.push(addDays(start, i));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Ay kaydır: ayın 1'i + n ay. */
export function shiftMonth(anyDayInMonth: string, delta: number): string {
  const [y, m] = anyDayInMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1, 12);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-01`;
}

/** Kümedeki en uzun ardışık gün sayısı. */
export function longestStreak(days: Set<string>): number {
  let best = 0;
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue; // zincirin başı değil
    let n = 0;
    let k = d;
    while (days.has(k)) {
      n++;
      k = addDays(k, 1);
    }
    if (n > best) best = n;
  }
  return best;
}
