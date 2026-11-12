/**
 * Bildirim bütçesi (saf, platformdan bağımsız; tests/notif.test.ts):
 *  1) Sessiz saatler: aralığa düşen TEKRARLAYAN hatırlatıcılar (günlük/haftalık) kurulmaz; TEK SEFERLİK
 *     (tarihli) hatırlatıcılar aralığın sonuna ertelenir. `EXEMPT` gruplar (alarm, zamanlayıcı, test) etkilenmez.
 *  2) Günlük üst sınır: önümüzdeki günlerin herhangi birinde kurulan hatırlatıcı sayısı `cap`'i aşmasın.
 *     Aşılırsa düşük öncelikli gruplardan başlanarak kırpılır (önce su/motivasyon/ruh hali, en son görevler).
 *     `EXEMPT` gruplar sayılmaz ve kırpılmaz.
 */

export type BudgetTrigger =
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekday: number; hour: number; minute: number }
  | { kind: 'date'; date: Date }
  | { kind: 'interval'; seconds: number; repeats?: boolean };

export interface BudgetItem<X = unknown> {
  group: string;
  trigger: BudgetTrigger;
  /** çağıranın taşıdığı veri (ör. NotifItem ya da planlı bildirim kimliği) */
  ref: X;
}

export interface QuietWindow {
  enabled: boolean;
  start: string;
  end: string;
}

/** Hiçbir kurala takılmayan gruplar. */
export const EXEMPT_GROUPS = new Set(['alarm', 'timer', 'test']);

/** Grup önceliği: küçük = önemli (en son kırpılır). Listede olmayan gruplar orta önceliklidir. */
export const GROUP_PRIORITY: Record<string, number> = {
  habit: 1,
  study: 1,
  sleep: 2,
  chores: 2,
  meals: 2,
  growth: 2,
  smoke: 2,
  report: 3,
  mood: 4,
  drink: 5,
  motivation: 5,
};
const prio = (g: string) => GROUP_PRIORITY[g] ?? 3;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Dakika (0..1439) sessiz aralıkta mı? Aralık gece yarısını aşabilir; start == end ise kapalı sayılır. */
export function inQuiet(minuteOfDay: number, q: QuietWindow): boolean {
  if (!q.enabled) return false;
  const s = toMin(q.start);
  const e = toMin(q.end);
  if (s === e) return false;
  return s < e ? minuteOfDay >= s && minuteOfDay < e : minuteOfDay >= s || minuteOfDay < e;
}

/** Sessiz aralık içindeki bir anı aralığın bittiği ana taşır (aralıkta değilse aynen döner). */
export function deferPastQuiet(d: Date, q: QuietWindow): Date {
  const m = d.getHours() * 60 + d.getMinutes();
  if (!inQuiet(m, q)) return d;
  const e = toMin(q.end);
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(e / 60), e % 60, 0, 0);
  if (out.getTime() <= d.getTime()) out.setDate(out.getDate() + 1);
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** 0 = Pazartesi */
const wd = (d: Date) => (d.getDay() + 6) % 7;

export interface QuietResult<X> {
  kept: BudgetItem<X>[];
  /** kurulmayan (tekrarlayan, sessiz aralıkta) */
  skipped: BudgetItem<X>[];
  /** ertelenen tek seferlikler (yeni tetikleyiciyle `kept` içinde) */
  deferred: number;
}

export function applyQuietHours<X>(items: BudgetItem<X>[], q: QuietWindow): QuietResult<X> {
  const kept: BudgetItem<X>[] = [];
  const skipped: BudgetItem<X>[] = [];
  let deferred = 0;
  for (const it of items) {
    const tr = it.trigger;
    if (!q.enabled || EXEMPT_GROUPS.has(it.group) || tr.kind === 'interval') {
      kept.push(it);
      continue;
    }
    if (tr.kind === 'daily' || tr.kind === 'weekly') {
      if (inQuiet(tr.hour * 60 + tr.minute, q)) skipped.push(it);
      else kept.push(it);
      continue;
    }
    const moved = deferPastQuiet(tr.date, q);
    if (moved.getTime() !== tr.date.getTime()) {
      deferred++;
      kept.push({ ...it, trigger: { kind: 'date', date: moved } });
    } else kept.push(it);
  }
  return { kept, skipped, deferred };
}

/** Bir hatırlatıcının verilen günlerdeki yükü (gün anahtarı → adet). */
function loadOf(tr: BudgetTrigger, days: { key: string; weekday: number }[], now: Date): Map<string, number> {
  const out = new Map<string, number>();
  const add = (k: string, n = 1) => out.set(k, (out.get(k) ?? 0) + n);
  switch (tr.kind) {
    case 'daily':
      for (const d of days) add(d.key);
      break;
    case 'weekly':
      for (const d of days) if (d.weekday === tr.weekday) add(d.key);
      break;
    case 'date':
      add(ymd(tr.date));
      break;
    case 'interval': {
      if (tr.repeats) {
        const perDay = Math.max(1, Math.ceil(86400 / Math.max(60, tr.seconds)));
        for (const d of days) add(d.key, perDay);
      } else add(ymd(new Date(now.getTime() + tr.seconds * 1000)));
      break;
    }
  }
  return out;
}

export interface CapResult<X> {
  kept: BudgetItem<X>[];
  trimmed: BudgetItem<X>[];
  /** kırpma sonrası en yoğun gündeki sayı (muaf gruplar hariç) */
  peak: number;
}

/**
 * Günlük üst sınırı uygular. Öncelik sırasıyla (önemli önce, eşitlikte girdi sırası) açgözlü yerleştirir:
 * bir öğe, ekleyince hiçbir gün `cap`'i aşmıyorsa tutulur. `cap <= 0` = sınırsız.
 * Pencere: bugünden itibaren `windowDays` gün + tarihli öğelerin günleri.
 */
export function applyDailyCap<X>(items: BudgetItem<X>[], cap: number, now: Date = new Date(), windowDays = 14): CapResult<X> {
  const exempt = items.filter((i) => EXEMPT_GROUPS.has(i.group));
  const rest = items.filter((i) => !EXEMPT_GROUPS.has(i.group));
  const days: { key: string; weekday: number }[] = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12);
    days.push({ key: ymd(d), weekday: wd(d) });
  }
  const used = new Map<string, number>();
  const peakOf = () => Math.max(0, ...used.values());
  if (!cap || cap <= 0) {
    for (const it of rest) for (const [k, n] of loadOf(it.trigger, days, now)) used.set(k, (used.get(k) ?? 0) + n);
    return { kept: [...exempt, ...rest], trimmed: [], peak: peakOf() };
  }
  const order = rest.map((it, i) => ({ it, i })).sort((a, b) => prio(a.it.group) - prio(b.it.group) || a.i - b.i);
  const keep = new Set<number>();
  const trimmed: BudgetItem<X>[] = [];
  for (const { it, i } of order) {
    const load = loadOf(it.trigger, days, now);
    let ok = true;
    for (const [k, n] of load) if ((used.get(k) ?? 0) + n > cap) ok = false;
    if (ok) {
      for (const [k, n] of load) used.set(k, (used.get(k) ?? 0) + n);
      keep.add(i);
    } else trimmed.push(it);
  }
  return { kept: [...exempt, ...rest.filter((_, i) => keep.has(i))], trimmed, peak: peakOf() };
}
