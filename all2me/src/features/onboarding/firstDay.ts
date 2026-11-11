/** "İlk günün planı": profil cevaplarından saatli başlangıç rutini (saf, çevrimdışı). */
import type { Difficulty, HabitKind, HabitLink, Loc, PastelKey, Slot } from '../../engine/types';
import type { PlanArea, PlanBlock } from '../../data/plannerPool';
import { fromMin, generatePeakPlan, toMin, type PlanMinutes } from '../planner/plan';
import type { EnergyPeak, FocusArea, RoutineType } from '../../store/slices/profile';
import { rankStarter, type QuestionId } from './starter';

export const DEFAULT_WAKE = '07:00';
export const DEFAULT_SLEEP = '23:00';

export interface FirstDayRow {
  id: string;
  emoji: string;
  title: Loc;
  slot: Slot;
  /** 'HH:MM' ya da gün içinde herhangi bir zaman */
  time: string | null;
  minutes?: number;
  pastel: PastelKey;
  difficulty: Difficulty;
  kind?: HabitKind;
  target?: number;
  link?: HabitLink;
}

export interface FirstDayInput {
  wake?: string | null;
  sleep?: string | null;
  energyPeak?: EnergyPeak | null;
  focus?: FocusArea[];
  answers?: Partial<Record<QuestionId, boolean>>;
  type?: RoutineType | null;
}

export const FOCUS_AREAS: FocusArea[] = ['home', 'health', 'smoke', 'nutrition', 'school', 'career', 'selfcare', 'relationship'];
export const FOCUS_EMOJI: Record<FocusArea, string> = { home: '🏠', health: '❤️', smoke: '🚭', nutrition: '🥗', school: '🎓', career: '💼', selfcare: '🛁', relationship: '💞' };
const FOCUS_TO_AREAS: Record<FocusArea, PlanArea[]> = {
  home: ['home'],
  health: ['health'],
  smoke: ['health', 'wellness'],
  nutrition: ['health', 'home'],
  school: ['study'],
  career: ['work'],
  selfcare: ['self', 'wellness'],
  relationship: ['self'],
};
const FOCUS_TO_Q: Partial<Record<FocusArea, QuestionId[]>> = {
  home: ['organize'],
  health: ['habits', 'move'],
  smoke: ['smoke'],
  nutrition: ['habits'],
  school: ['goals'],
  career: ['goals', 'focus'],
  selfcare: ['sleep'],
};
const PEAK_BLOCK: Record<EnergyPeak, PlanBlock> = { morning: 'morning', noon: 'afternoon', evening: 'evening' };
const TYPE_MINUTES: Record<RoutineType, PlanMinutes> = { planner: 60, explorer: 30, steady: 30, spark: 15 };
const MAX_ROWS = 9;

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const ceil5 = (n: number) => Math.ceil(n / 5) * 5;

export function buildFirstDay(i: FirstDayInput): FirstDayRow[] {
  const wake = i.wake || DEFAULT_WAKE;
  const sleep = i.sleep || DEFAULT_SLEEP;
  const focus = i.focus ?? [];
  const areas = [...new Set(focus.flatMap((f) => FOCUS_TO_AREAS[f]))];
  const type = i.type ?? null;
  const seed = hash(`${wake}|${sleep}|${i.energyPeak ?? ''}|${focus.join(',')}|${type ?? ''}`);
  const plan = generatePeakPlan(
    { wake, energy: type === 'planner' ? 'mid' : 'low', areas, minutes: type ? TYPE_MINUTES[type] : 30 },
    seed,
    i.energyPeak ? PEAK_BLOCK[i.energyPeak] : null,
    sleep,
  );
  const rows: FirstDayRow[] = plan.map((p) => ({
    id: `p:${p.id}`,
    emoji: p.task.emoji,
    title: p.task.title,
    slot: p.block,
    time: p.time,
    minutes: p.task.minutes,
    pastel: ({ home: 'peach', work: 'blue', study: 'purple', health: 'green', wellness: 'mint', self: 'pink' } as Record<PlanArea, PastelKey>)[p.task.area],
    difficulty: p.task.minutes <= 3 ? 'mini' : p.task.effort === 1 ? 'easy' : p.task.effort === 2 ? 'medium' : 'hard',
  }));

  // Evet/Hayır cevapları ve odak alanlarıyla öne çıkan hazır önerilerden 3 tanesi (planda olmayanlar)
  const answers: Partial<Record<QuestionId, boolean>> = { ...(i.answers ?? {}) };
  for (const f of focus) for (const q of FOCUS_TO_Q[f] ?? []) answers[q] = true;
  const have = new Set(rows.map((r) => r.title.tr));
  const wakeMin = toMin(wake);
  const sleepMin = toMin(sleep) <= wakeMin ? toMin(sleep) + 1440 : toMin(sleep);
  const slotTime = (s: Slot): string | null =>
    s === 'morning' ? fromMin(ceil5(wakeMin + 20)) : s === 'afternoon' ? '15:30' : s === 'evening' ? fromMin(Math.min(21 * 60, sleepMin - 90)) : null;
  for (const s of rankStarter(answers)) {
    if (rows.length >= MAX_ROWS || rows.filter((r) => r.id.startsWith('s:')).length >= 3) break;
    if (have.has(s.title.tr)) continue;
    have.add(s.title.tr);
    rows.push({ id: `s:${s.id}`, emoji: s.icon, title: s.title, slot: s.slot, time: slotTime(s.slot), pastel: s.pastel, difficulty: s.difficulty, kind: s.kind, target: s.target, link: s.link });
  }
  const order = (r: FirstDayRow) => (r.time ? toMin(r.time) : 24 * 60 + 1);
  return rows.sort((a, b) => order(a) - order(b));
}
