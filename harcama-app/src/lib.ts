// Veri tipleri, tarih/para yardımcıları ve analiz hesapları.
// Web sürümüyle (harcama-defteri.html) aynı veri biçimini kullanır; yedekler iki yönde de taşınabilir.

export type Expense = {
  id: string;
  amount: number;
  cat: string;
  note: string;
  date: string; // YYYY-MM-DD
  ts: number;
  sub?: string; // abonelik ödemesiyse aboneliğin id'si
  period?: string; // abonelik dönemi: "2026-10" (aylık) ya da "2026" (yıllık)
};

export type Sub = {
  id: string;
  name: string;
  amount: number;
  day: number;
  freq: 'monthly' | 'yearly';
  month: number; // yıllık aboneliklerde 1-12
  cat: string;
  skip: string; // atlanan son dönem
};

export type Settings = {
  budget: number;
  remind: boolean;
  remindHour: number;
  subRemind: boolean;
};

export const CATS = ['Market', 'Yeme-İçme', 'Ulaşım', 'Fatura', 'Sağlık', 'Eğlence', 'Giyim', 'Diğer'];
export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function catIndex(c: string) {
  const i = CATS.indexOf(c);
  return i < 0 ? CATS.length - 1 : i;
}

/* ---------- Tarih ---------- */
export const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function parseIso(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export const todayIso = () => iso(new Date());
export const today0 = () => parseIso(todayIso());
export function daysIn(ym: string) {
  const d = parseIso(ym + '-01');
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
export function addMonths(ym: string, n: number) {
  const d = parseIso(ym + '-01');
  d.setMonth(d.getMonth() + n);
  return iso(d).slice(0, 7);
}
export function addDays(s: string, n: number) {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export function monthLabel(ym: string) {
  const d = parseIso(ym + '-01');
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function shortDay(s: string) {
  const d = parseIso(s);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
export function dayLabel(s: string) {
  if (s === todayIso()) return 'Bugün';
  if (s === addDays(todayIso(), -1)) return 'Dün';
  const d = parseIso(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${DAYS[d.getDay()]}`;
}

/* ---------- Para ---------- */
export function fmtTL(n: number, decimals = 2) {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '−' : ''}₺${grouped}${dec ? ',' + dec : ''}`;
}
export const fmtTL0 = (n: number) => fmtTL(n, 0);
export function compact(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' Mn';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.', ',').replace(',0', '') + ' B';
  return String(Math.round(n));
}
/** "1.250,50", "125.5", "₺ 40" gibi girdileri sayıya çevirir; geçersizse 0. */
export function parseAmount(s: string) {
  let t = String(s).trim().replace(/\s/g, '').replace(/₺/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}
export const amountText = (n: number) => String(n).replace('.', ',');

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const sum = (arr: { amount: number }[]) => arr.reduce((s, x) => s + x.amount, 0);

/* ---------- Ay analizi ---------- */
export type Analysis = {
  isCur: boolean;
  dim: number;
  elapsed: number;
  total: number;
  perDay: Record<string, number>;
  topDay: string | null;
  avg: number;
  prevSame: number;
  curSame: number;
  cutoff: number;
  projection: number;
};

export function analyse(items: Expense[], ym: string): Analysis {
  const now = new Date();
  const isCur = ym === todayIso().slice(0, 7);
  const dim = daysIn(ym);
  const elapsed = isCur ? now.getDate() : dim;
  const monthItems = items.filter((x) => x.date.slice(0, 7) === ym);
  const total = sum(monthItems);
  const perDay: Record<string, number> = {};
  monthItems.forEach((x) => (perDay[x.date] = (perDay[x.date] || 0) + x.amount));
  let topDay: string | null = null;
  Object.keys(perDay).forEach((k) => {
    if (!topDay || perDay[k] > perDay[topDay]) topDay = k;
  });
  // Geçen ayın aynı günleriyle karşılaştırma (ör. 1–16 Ekim ile 1–16 Eylül)
  const prevYm = addMonths(ym, -1);
  const cutoff = Math.min(elapsed, daysIn(prevYm));
  const prevSame = sum(items.filter((x) => x.date.slice(0, 7) === prevYm && +x.date.slice(8) <= cutoff));
  const curSame = sum(monthItems.filter((x) => +x.date.slice(8) <= cutoff));
  return {
    isCur, dim, elapsed, total, perDay, topDay,
    avg: elapsed ? total / elapsed : 0,
    prevSame, curSame, cutoff,
    projection: isCur && elapsed ? (total / elapsed) * dim : total,
  };
}

/* ---------- Abonelikler ---------- */
export type SubState =
  | { state: 'pending'; due: Date; period: string }
  | { state: 'upcoming'; due: Date; period: string; days: number }
  | { state: 'paid' | 'skipped'; due: Date; next: Date; period: string };

export function subPeriod(s: Sub, ref: Date) {
  return s.freq === 'yearly' ? String(ref.getFullYear()) : iso(ref).slice(0, 7);
}
export function dueDate(s: Sub, y: number, m: number) {
  const mm = s.freq === 'yearly' ? s.month - 1 : m;
  const last = new Date(y, mm + 1, 0).getDate();
  return new Date(y, mm, Math.min(s.day, last));
}
export function subStatus(s: Sub, items: Expense[]): SubState {
  const now = today0();
  const period = subPeriod(s, now);
  const due = dueDate(s, now.getFullYear(), now.getMonth());
  const paid = items.some((x) => x.sub === s.id && x.period === period);
  const skipped = s.skip === period;
  if (paid || skipped) {
    const next = s.freq === 'yearly' ? dueDate(s, now.getFullYear() + 1, 0) : dueDate(s, now.getFullYear(), now.getMonth() + 1);
    return { state: paid ? 'paid' : 'skipped', due, next, period };
  }
  if (due <= now) return { state: 'pending', due, period };
  return { state: 'upcoming', due, period, days: Math.round((due.getTime() - now.getTime()) / 864e5) };
}
export const monthlyCost = (s: Sub) => (s.freq === 'yearly' ? s.amount / 12 : s.amount);
