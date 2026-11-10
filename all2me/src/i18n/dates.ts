import { parseDayKey, weekdayOf } from '../engine/dates';
import type { Lang } from './types';

/** Pazartesi ile başlar (engine Weekday: 0 = Pazartesi). */
export const DAYS_SHORT: Record<Lang, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};
/** Tek harfli gün başlıkları (takvim ızgarası). */
export const DAYS_LETTER: Record<Lang, string[]> = {
  tr: ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};
export const DAYS_LONG: Record<Lang, string[]> = {
  tr: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};
export const MONTHS: Record<Lang, string[]> = {
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
export const MONTHS_SHORT: Record<Lang, string[]> = {
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/**
 * Gün anahtarını biçimlendirir.
 *  long : "10 Kasım Salı"     / "Tuesday, November 10"
 *  short: "10 Kas"            / "Nov 10"
 *  month: "Kasım 2026"        / "November 2026"   (ay başlığı)
 */
export function fmtDay(key: string, lang: Lang, style: 'long' | 'short' | 'month' = 'long'): string {
  const d = parseDayKey(key);
  const day = d.getDate();
  const m = d.getMonth();
  if (style === 'month') return `${MONTHS[lang][m]} ${d.getFullYear()}`;
  if (style === 'short') return lang === 'tr' ? `${day} ${MONTHS_SHORT.tr[m]}` : `${MONTHS_SHORT.en[m]} ${day}`;
  const wd = DAYS_LONG[lang][weekdayOf(key)];
  return lang === 'tr' ? `${day} ${MONTHS.tr[m]} ${wd}` : `${wd}, ${MONTHS.en[m]} ${day}`;
}

/** "HH:MM" -> dile göre (tr: 07:30, en: 7:30 AM). */
export function fmtTime(hhmm: string, lang: Lang): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (lang === 'tr') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const ap = h < 12 ? 'AM' : 'PM';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${ap}`;
}
