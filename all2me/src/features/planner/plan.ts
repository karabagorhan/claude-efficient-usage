/** Akıllı planlayıcı: saf, çevrimdışı, kural tabanlı plan üretimi. */
import { PLANNER_POOL, type PlanArea, type PlanBlock, type PoolTask } from '../../data/plannerPool';

export type PlanEnergy = 'low' | 'mid' | 'high';
export type PlanMinutes = 15 | 30 | 60 | 90;

export interface PlanAnswers {
  /** kalkış saati 'HH:MM' */
  wake: string;
  energy: PlanEnergy;
  /** boşsa tüm alanlar eşit */
  areas: PlanArea[];
  /** ayrılabilen toplam süre (90 = 90+ dk) */
  minutes: PlanMinutes;
}

export interface PlanItem {
  /** liste anahtarı (görev id'si; havuzda tekrar yok) */
  id: string;
  task: PoolTask;
  block: PlanBlock;
  /** 'HH:MM' */
  time: string;
}

export const BLOCKS: readonly PlanBlock[] = ['morning', 'afternoon', 'evening'];

/** Toplam süre bütçesi (dk). "90+" için 120. */
export const budgetOf = (m: PlanMinutes): number => (m === 90 ? 120 : m);

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const fromMin = (n: number): string => {
  const c = Math.max(0, Math.min(23 * 60 + 55, n));
  return `${String(Math.floor(c / 60)).padStart(2, '0')}:${String(c % 60).padStart(2, '0')}`;
};
const ceil5 = (n: number) => Math.ceil(n / 5) * 5;

const maxEffort = (e: PlanEnergy) => (e === 'low' ? 1 : e === 'mid' ? 2 : 3);

/** Görev sayısı: düşük enerji 5, orta 6-7, yüksek 8-9. */
export function targetCount(energy: PlanEnergy, rnd: () => number): number {
  if (energy === 'low') return 5;
  if (energy === 'mid') return 6 + Math.floor(rnd() * 2);
  return 8 + Math.floor(rnd() * 2);
}

/** n görevi sabah/öğleden sonra/akşam arasında böler: 5→2/2/1, 7→3/2/2, 9→3/3/3. */
export function blockPlan(n: number): PlanBlock[] {
  const base = Math.floor(n / 3);
  const extra = n - base * 3;
  const counts = [base + (extra > 0 ? 1 : 0), base + (extra > 1 ? 1 : 0), base];
  const out: PlanBlock[] = [];
  const left = [...counts];
  while (out.length < n) {
    for (let i = 0; i < 3; i++) {
      if (left[i] > 0) {
        out.push(BLOCKS[i]);
        left[i]--;
      }
    }
  }
  return out;
}

/**
 * Plan üretir. `seed` aynıysa sonuç aynı; `avoid` önceki planın görevleridir (yeniden oluşturmada ağırlığı düşer).
 */
export function generatePlan(a: PlanAnswers, seed: number, avoid: string[] = [], pool: PoolTask[] = PLANNER_POOL): PlanItem[] {
  const rnd = mulberry32(seed);
  const budget = budgetOf(a.minutes);
  const eligible = pool.filter((t) => t.effort <= maxEffort(a.energy));
  if (!eligible.length) return [];
  const minMin = Math.min(...eligible.map((t) => t.minutes));
  const n = targetCount(a.energy, rnd);
  const avoidSet = new Set(avoid);
  const areaW = (t: PoolTask) => (a.areas.length === 0 ? 2 : a.areas.includes(t.area) ? 4 : 1);
  const weight = (t: PoolTask) => areaW(t) * (avoidSet.has(t.id) ? 0.1 : 1);

  const picked: { task: PoolTask; block: PlanBlock }[] = [];
  const used = new Set<string>();
  let rem = budget;
  const seq = blockPlan(n);

  const pickFor = (block: PlanBlock, left: number): PoolTask | null => {
    const reserve = Math.max(0, left - 1) * minMin;
    const cands = eligible.filter((t) => !used.has(t.id) && t.parts.includes(block) && t.minutes + reserve <= rem);
    if (!cands.length) return null;
    const total = cands.reduce((s, t) => s + weight(t), 0);
    let r = rnd() * total;
    for (const t of cands) {
      r -= weight(t);
      if (r <= 0) return t;
    }
    return cands[cands.length - 1];
  };

  for (let i = 0; i < seq.length; i++) {
    const left = seq.length - i;
    let block = seq[i];
    let t = pickFor(block, left);
    if (!t) {
      for (const b of BLOCKS) {
        if (b === block) continue;
        t = pickFor(b, left);
        if (t) {
          block = b;
          break;
        }
      }
    }
    if (!t) continue; // bütçe doldu
    used.add(t.id);
    rem -= t.minutes;
    picked.push({ task: t, block });
  }
  return schedule(picked, a.wake);
}

/** Seçilen görevleri bloklara yerleştirip saat verir. */
export function schedule(picked: { task: PoolTask; block: PlanBlock }[], wake: string): PlanItem[] {
  const out: PlanItem[] = [];
  let cursor = toMin(wake) + 30;
  const starts: Record<PlanBlock, number> = { morning: 0, afternoon: 13 * 60, evening: 18 * 60 + 30 };
  for (const block of BLOCKS) {
    const items = picked.filter((p) => p.block === block);
    if (!items.length) continue;
    // sabah/öğleden sonra: yoğun işler önce; akşam: sakinleşerek
    items.sort((x, y) => (block === 'evening' ? x.task.effort - y.task.effort : y.task.effort - x.task.effort));
    cursor = block === 'morning' ? ceil5(cursor) : ceil5(Math.max(starts[block], cursor + 45));
    for (const it of items) {
      out.push({ id: it.task.id, task: it.task, block, time: fromMin(cursor) });
      cursor = ceil5(cursor + it.task.minutes + 10);
    }
  }
  return out;
}

export const totalMinutes = (items: PlanItem[]): number => items.reduce((s, i) => s + i.task.minutes, 0);
