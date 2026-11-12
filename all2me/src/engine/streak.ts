import { addDays } from './dates';
import { countsForScore, type Completion } from './types';

/** Kullanıcının en az 1 (geri alınmamış, önceden işaretlenmemiş) tamamlaması olan gün anahtarları. */
export function activeDaySet(completions: Iterable<Completion>, userId: string): Set<string> {
  const out = new Set<string>();
  for (const c of completions) if (c.userId === userId && countsForScore(c)) out.add(c.dayKey);
  return out;
}

/**
 * Gün serisi: art arda en az 1 tamamlama olan gün sayısı.
 * Bugün henüz tamamlama yoksa seri dünden sayılır (bozulmaz).
 */
export function dayStreakFrom(days: Set<string>, today: string): number {
  let k = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  for (let i = 0; i < 2000 && days.has(k); i++) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}
