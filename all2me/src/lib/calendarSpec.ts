/**
 * Takvim olaylarının saf (platformdan bağımsız) tanımları: tarih/saat, süre, hatırlatma ve tekrar kuralı.
 * Yerel takvime yazan kısım src/lib/calendar.ts'tedir; burası node'da test edilir (tests/calendar.test.ts).
 * Gün/saat YEREL saat dilimindedir. Haftanın günü engine ile aynı: 0 = Pazartesi.
 */

export type RecurFreq = 'daily' | 'weekly';

export interface EventSpec {
  title: string;
  notes?: string;
  startDate: Date;
  endDate: Date;
  /** tekrar: varsayılan yok; bitiş tarihi her zaman var (sonsuz tekrar yok) */
  recurrence?: { frequency: RecurFreq; interval: number; endDate: Date };
  /** başlangıca göre dakika farkı (negatif = önce) */
  alarmOffsets: number[];
}

/** Saatsiz teslim tarihi için varsayılan saat (gün boyu olaylar platformlar arası güvenilmez, bu yüzden saatli) */
export const DEFAULT_DUE_TIME = '09:00';
export const DUE_MINUTES = 30;
export const HABIT_MINUTES = 15;
/** ders saatleri için haftalık tekrar süresi */
export const COURSE_WEEKS = 16;
/** hatırlatıcılı görev için tekrar süresi (gün) */
export const HABIT_DAYS = 365;

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** 'YYYY-MM-DD' + 'HH:MM' -> yerel Date; geçersizse null */
export function localDate(day: string, time: string = '00:00'): Date | null {
  const d = DAY_RE.exec(day);
  const t = TIME_RE.exec(time);
  if (!d || !t) return null;
  const date = new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]), 0, 0);
  // 31 Şubat gibi taşan tarihleri reddet
  if (date.getFullYear() !== Number(d[1]) || date.getMonth() !== Number(d[2]) - 1 || date.getDate() !== Number(d[3])) return null;
  return date;
}

const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
const addDaysDate = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), 0, 0);

/** 0 = Pazartesi ... 6 = Pazar */
export const weekdayIndex = (d: Date): number => (d.getDay() + 6) % 7;

/** `from` gününden (dahil) itibaren `weekday` gününün `time` saatindeki ilk anı; geçmişse sonraki hafta. */
export function nextWeekdayAt(weekday: number, time: string, from: Date): Date | null {
  const t = TIME_RE.exec(time);
  if (!t) return null;
  for (let add = 0; add <= 7; add++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + add, Number(t[1]), Number(t[2]), 0, 0);
    if (weekdayIndex(d) === weekday && d.getTime() >= from.getTime()) return d;
  }
  return null;
}

/** Teslim tarihi (ödev/sınav/proje). Saat yoksa 09:00. Hatırlatma: 1 gün ve 1 saat önce (saat yoksa yalnız 1 gün önce 09:00). */
export function dueEventSpec(p: { title: string; due: string; time?: string; notes?: string }): EventSpec | null {
  const hasTime = !!p.time && TIME_RE.test(p.time);
  const start = localDate(p.due, hasTime ? p.time! : DEFAULT_DUE_TIME);
  if (!start) return null;
  return {
    title: p.title,
    notes: p.notes,
    startDate: start,
    endDate: addMinutes(start, DUE_MINUTES),
    alarmOffsets: hasTime ? [-1440, -60] : [-1440],
  };
}

export interface ClassSlotInput {
  day: number;
  start: string;
  end: string;
}

/** Ders saatleri: her slot için bir haftalık tekrarlı olay (yalnız o gün; iOS/Android ortak). `from` sonrası ilk oluşumdan COURSE_WEEKS hafta. */
export function courseEventSpecs(p: { title: string; notes?: string; slots: ClassSlotInput[] }, from: Date = new Date()): EventSpec[] {
  const out: EventSpec[] = [];
  for (const s of p.slots) {
    if (!TIME_RE.test(s.end)) continue;
    const start = nextWeekdayAt(s.day, s.start, from);
    if (!start) continue;
    const [eh, em] = s.end.split(':').map(Number);
    let end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), eh, em, 0, 0);
    if (end.getTime() <= start.getTime()) end = addMinutes(start, 60);
    out.push({
      title: p.title,
      notes: p.notes,
      startDate: start,
      endDate: end,
      recurrence: { frequency: 'weekly', interval: 1, endDate: addDaysDate(start, COURSE_WEEKS * 7 - 1) },
      alarmOffsets: [-15],
    });
  }
  return out;
}

/**
 * Hatırlatıcılı görev: her gün / günlük kota -> tek günlük tekrarlı olay; belirli günler -> gün başına bir haftalık olay.
 * Hatırlatma saatinde başlar, HABIT_MINUTES sürer, HABIT_DAYS gün tekrarlar.
 */
export function habitEventSpecs(p: { title: string; time: string; days: number[]; weeklyQuota?: boolean; notes?: string }, from: Date = new Date()): EventSpec[] {
  if (!TIME_RE.test(p.time)) return [];
  const base = { title: p.title, notes: p.notes, alarmOffsets: [0] as number[] };
  const daily = p.weeklyQuota || p.days.length === 0 || p.days.length === 7;
  if (daily) {
    let start = localDate(ymd(from), p.time)!;
    if (start.getTime() < from.getTime()) start = addDaysDate(start, 1);
    return [{ ...base, startDate: start, endDate: addMinutes(start, HABIT_MINUTES), recurrence: { frequency: 'daily', interval: 1, endDate: addDaysDate(start, HABIT_DAYS) } }];
  }
  const out: EventSpec[] = [];
  for (const d of [...new Set(p.days)].sort()) {
    const start = nextWeekdayAt(d, p.time, from);
    if (!start) continue;
    out.push({ ...base, startDate: start, endDate: addMinutes(start, HABIT_MINUTES), recurrence: { frequency: 'weekly', interval: 1, endDate: addDaysDate(start, HABIT_DAYS) } });
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** yerel takvim günü YYYY-MM-DD (gün sınırı 03:00 DEĞİL: takvim gerçek tarihle çalışır) */
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Eşleme anahtarları: bizim kimliğimiz -> takvim olay kimlikleri */
export const calKey = {
  item: (id: string) => `item:${id}`,
  course: (id: string) => `course:${id}`,
  habit: (id: string) => `habit:${id}`,
};
