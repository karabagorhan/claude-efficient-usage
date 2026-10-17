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
  cat: string; // ödendiğinde harcamaya yazılacak kategori
  skip: string; // atlanan son dönem
  type: string; // abonelik türü (SUB_TYPES anahtarı)
};

export type Settings = {
  budget: number;
  remind: boolean;
  remindHour: number;
  subRemind: boolean;
  catBudgets: Record<string, number>; // kategori başına aylık limit (0 / yok = limitsiz)
  theme: 'noir' | 'ivory' | 'system';
  name: string; // menüdeki profil satırında görünen ad
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

/* ---------- Raporlar ---------- */
const DAYS_SHORT_MON = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** Haftanın her günü için gün başına ortalama harcama (Pazartesi'den başlar). */
export function weekdayAverages(items: Expense[], ym: string) {
  const a = analyse(items, ym);
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let d = 1; d <= a.elapsed; d++) counts[(parseIso(`${ym}-${pad(d)}`).getDay() + 6) % 7]++;
  items.filter((x) => x.date.slice(0, 7) === ym).forEach((x) => (totals[(parseIso(x.date).getDay() + 6) % 7] += x.amount));
  return DAYS_SHORT_MON.map((label, i) => ({ key: label, label, value: counts[i] ? totals[i] / counts[i] : 0 }));
}

/** Kategori bazında bu ay ile geçen ayın aynı dönemi. */
export function categoryCompare(items: Expense[], ym: string) {
  const a = analyse(items, ym);
  const prevYm = addMonths(ym, -1);
  const cur: Record<string, number> = {};
  const prev: Record<string, number> = {};
  items.forEach((x) => {
    const day = +x.date.slice(8);
    if (x.date.slice(0, 7) === ym && day <= a.cutoff) cur[x.cat] = (cur[x.cat] || 0) + x.amount;
    if (x.date.slice(0, 7) === prevYm && day <= a.cutoff) prev[x.cat] = (prev[x.cat] || 0) + x.amount;
  });
  return { cur, prev };
}

/** Son 90 günde en sık girilen (kategori + not) ikilileri, son tutarlarıyla. */
export function frequentEntries(items: Expense[], limit = 6) {
  const since = addDays(todayIso(), -90);
  const map: Record<string, { cat: string; note: string; amount: number; count: number; ts: number }> = {};
  items.forEach((x) => {
    if (!x.note || x.sub || x.date < since) return;
    const k = x.cat + '|' + x.note.toLocaleLowerCase('tr-TR');
    const m = map[k];
    if (!m) map[k] = { cat: x.cat, note: x.note, amount: x.amount, count: 1, ts: x.ts };
    else {
      m.count++;
      if (x.ts > m.ts) { m.amount = x.amount; m.ts = x.ts; }
    }
  });
  return Object.values(map).filter((m) => m.count >= 2).sort((p, q) => q.count - p.count || q.ts - p.ts).slice(0, limit);
}

export type Insight = { kind: 'warn' | 'good' | 'info'; text: string };

/** Seçili ay için kısa, otomatik yorumlar. En önemlisi başta. */
export function insights(items: Expense[], ym: string, settings: Settings): Insight[] {
  const a = analyse(items, ym);
  const out: Insight[] = [];
  const month = items.filter((x) => x.date.slice(0, 7) === ym);
  if (!month.length) return out;
  const by: Record<string, number> = {};
  month.forEach((x) => (by[x.cat] = (by[x.cat] || 0) + x.amount));

  // Kategori limitleri
  Object.keys(settings.catBudgets).forEach((c) => {
    const lim = settings.catBudgets[c];
    const v = by[c] || 0;
    if (!lim) return;
    if (v > lim) out.push({ kind: 'warn', text: `${c} limitini ${fmtTL0(v - lim)} aştın (${fmtTL0(v)} / ${fmtTL0(lim)}).` });
    else if (v >= lim * 0.8) out.push({ kind: 'warn', text: `${c} limitinde doluluk %${Math.round((v / lim) * 100)}, ${fmtTL0(lim - v)} kaldı.` });
  });

  // Bütçe gidişatı
  if (a.isCur && settings.budget && a.elapsed >= 3) {
    const diff = a.projection - settings.budget;
    if (diff > 0) out.push({ kind: 'warn', text: `Bu hızla ay sonunda bütçeyi yaklaşık ${fmtTL0(diff)} aşacaksın.` });
    else out.push({ kind: 'good', text: `Bu hızla ay sonunda bütçeden yaklaşık ${fmtTL0(-diff)} artacak.` });
  }

  // En çok harcanan kategori
  const top = Object.keys(by).sort((p, q) => by[q] - by[p])[0];
  out.push({ kind: 'info', text: `En çok ${top} kategorisine harcadın: ${fmtTL0(by[top])} (ay toplamındaki payı %${Math.round((by[top] / a.total) * 100)}).` });

  // Geçen aya göre en çok değişen kategori
  const { cur, prev } = categoryCompare(items, ym);
  let best: { c: string; d: number } | null = null;
  Object.keys({ ...cur, ...prev }).forEach((c) => {
    const d = (cur[c] || 0) - (prev[c] || 0);
    if ((prev[c] || 0) > 0 && Math.abs(d) >= 100 && (!best || Math.abs(d) > Math.abs(best.d))) best = { c, d };
  });
  if (best) {
    const b = best as { c: string; d: number };
    out.push({
      kind: b.d > 0 ? 'warn' : 'good',
      text: `${b.c} harcaman geçen ayın aynı dönemine göre ${fmtTL0(Math.abs(b.d))} ${b.d > 0 ? 'arttı' : 'azaldı'}.`,
    });
  }

  // Hafta sonu / hafta içi
  const wd = weekdayAverages(items, ym);
  const weekday = (wd[0].value + wd[1].value + wd[2].value + wd[3].value + wd[4].value) / 5;
  const weekend = (wd[5].value + wd[6].value) / 2;
  if (weekday > 0 && weekend > weekday * 1.4) out.push({ kind: 'info', text: `Hafta sonları günde ortalama ${fmtTL0(weekend)} harcıyorsun, hafta içinin ${(weekend / weekday).toFixed(1).replace('.', ',')} katı.` });

  // Harcamasız günler
  const spentDays = new Set(month.map((x) => x.date)).size;
  const free = a.elapsed - spentDays;
  if (free >= 3) out.push({ kind: 'good', text: `Bu ay ${free} gün hiç harcama yapmadın.` });

  return out;
}

/* ---------- Abonelik türleri ---------- */
export type SubType = { key: string; label: string; icon: string; cat: string; words: string[] };

/** Abonelik türleri; her biri ödendiğinde harcamalara yazılacak varsayılan kategoriyi ve ad tahmini için anahtar kelimeleri taşır. */
export const SUB_TYPES: SubType[] = [
  { key: 'yayin', label: 'Dijital yayın', icon: 'tv-outline', cat: 'Eğlence',
    words: ['netflix', 'spotify', 'youtube', 'disney', 'exxen', 'blutv', 'blu tv', 'prime video', 'apple music', 'apple tv', 'tabii', 'gain', 'mubi', 'deezer', 'tidal', 'tod', 'hbo', 'max', 'twitch'] },
  { key: 'iletisim', label: 'Telefon & İnternet', icon: 'wifi-outline', cat: 'Fatura',
    words: ['turkcell', 'vodafone', 'türk telekom', 'turk telekom', 'superonline', 'türknet', 'turknet', 'internet', 'telefon', 'hat', 'fiber', 'mobil', 'gsm'] },
  { key: 'ev', label: 'Ev faturaları', icon: 'flash-outline', cat: 'Fatura',
    words: ['elektrik', 'su', 'doğalgaz', 'dogalgaz', 'doğal gaz', 'igdaş', 'igdas', 'enerjisa', 'ck enerji', 'iski', 'aski', 'başkentgaz', 'isınma'] },
  { key: 'kira', label: 'Kira & Aidat', icon: 'home-outline', cat: 'Fatura', words: ['kira', 'aidat', 'site', 'yönetim'] },
  { key: 'spor', label: 'Spor & Sağlık', icon: 'barbell-outline', cat: 'Sağlık',
    words: ['spor', 'gym', 'fitness', 'macfit', 'mac fit', 'pilates', 'yoga', 'salon', 'diyetisyen', 'eczane'] },
  { key: 'yazilim', label: 'Yazılım & Bulut', icon: 'cloud-outline', cat: 'Diğer',
    words: ['icloud', 'google one', 'chatgpt', 'claude', 'openai', 'office', 'microsoft', 'adobe', 'dropbox', 'canva', 'notion', 'apple one', 'github', 'vpn'] },
  { key: 'sigorta', label: 'Sigorta', icon: 'shield-checkmark-outline', cat: 'Diğer', words: ['sigorta', 'kasko', 'dask', 'trafik sigortası'] },
  { key: 'egitim', label: 'Eğitim', icon: 'school-outline', cat: 'Diğer', words: ['kurs', 'okul', 'udemy', 'duolingo', 'eğitim', 'egitim', 'dershane', 'babbel', 'kitap'] },
  { key: 'ulasim', label: 'Ulaşım', icon: 'car-outline', cat: 'Ulaşım', words: ['otopark', 'istanbulkart', 'hgs', 'ogs', 'araç', 'leasing', 'kiralık araç', 'akbil'] },
  { key: 'uyelik', label: 'Alışveriş üyeliği', icon: 'pricetag-outline', cat: 'Market',
    words: ['amazon prime', 'amazon', 'migros', 'trendyol', 'hepsiburada', 'getir', 'yemeksepeti', 'prime', 'premium'] },
  { key: 'diger', label: 'Diğer', icon: 'ellipsis-horizontal', cat: 'Diğer', words: [] },
];

export function subType(key: string | undefined) {
  return SUB_TYPES.find((x) => x.key === key) ?? SUB_TYPES[SUB_TYPES.length - 1];
}
export const subTypeIndex = (key: string | undefined) => Math.max(0, SUB_TYPES.findIndex((x) => x.key === key));

/** Abonelik adından tür tahmini ("Netflix" → Dijital yayın). */
export function guessSubType(name: string): string | null {
  const n = name.toLocaleLowerCase('tr-TR');
  const tokens = n.split(/[^a-zçğıöşü0-9]+/i).filter(Boolean);
  for (const tp of SUB_TYPES) {
    for (const w of tp.words) {
      // Türkçe ekler için kısa kelimelerde kelime başı aranır ("kursu", "hattı", "kirası"); iki harfliler tam eşleşmeli ("su" ≠ "susam")
      const hit = w.includes(' ') ? n.includes(w)
        : w.length <= 2 ? tokens.includes(w)
        : w.length <= 4 ? tokens.some((tk) => tk.startsWith(w))
        : n.includes(w);
      if (hit) return tp.key;
    }
  }
  return null;
}
