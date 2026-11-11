/**
 * "Rutin tipin" profil testi: 8 iki seçenekli soru, 2 eksen (4 + 4), sonuç 4 özgün tipten biri.
 * Eğlence ve öz farkındalık amaçlıdır; tanı ya da bilimsel kişilik ölçümü değildir.
 *  - Eksen "plan": önceden planlamak (yüksek) ↔ akışa bırakmak (düşük)
 *  - Eksen "start": küçük adımla hemen başlamak (yüksek) ↔ derinlemesine hazırlanıp odaklanmak (düşük)
 * Tipler: plan+hazırlık → planner · plan+küçük adım → steady · akış+hazırlık → explorer · akış+küçük adım → spark.
 */
import type { PastelKey } from '../../engine/types';
import type { RoutineType } from '../../store/slices/profile';

export interface QuizQuestion {
  id: string;
  axis: 'plan' | 'start';
  /** Yüksek kutba giden seçenek: 0 = A, 1 = B (yanlılığı dağıtmak için karışık) */
  high: 0 | 1;
  /** İlk soru eşitlikte belirleyici olsun diye hafif ağır */
  weight: number;
}

export const QUIZ: QuizQuestion[] = [
  { id: 'q1', axis: 'plan', high: 0, weight: 1.1 },
  { id: 'q2', axis: 'start', high: 0, weight: 1.1 },
  { id: 'q3', axis: 'plan', high: 1, weight: 1 },
  { id: 'q4', axis: 'start', high: 1, weight: 1 },
  { id: 'q5', axis: 'plan', high: 0, weight: 1 },
  { id: 'q6', axis: 'start', high: 0, weight: 1 },
  { id: 'q7', axis: 'plan', high: 1, weight: 1 },
  { id: 'q8', axis: 'start', high: 1, weight: 1 },
];

export const TYPES: RoutineType[] = ['planner', 'explorer', 'steady', 'spark'];

export const TYPE_ART: Record<RoutineType, { emoji: string; pastel: PastelKey }> = {
  planner: { emoji: '🗓️', pastel: 'blue' },
  explorer: { emoji: '🧭', pastel: 'green' },
  steady: { emoji: '🌿', pastel: 'mint' },
  spark: { emoji: '⚡', pastel: 'peach' },
};

/** Cevaplar (0/1 dizisi, soru sırasıyla) tamamsa tipi hesaplar; değilse null. */
export function quizResult(answers: ReadonlyArray<number | null | undefined>): RoutineType | null {
  if (answers.length < QUIZ.length || QUIZ.some((_, i) => answers[i] !== 0 && answers[i] !== 1)) return null;
  const high = (axis: QuizQuestion['axis']) => {
    const qs = QUIZ.map((q, i) => ({ q, i })).filter((x) => x.q.axis === axis);
    const total = qs.reduce((s, x) => s + x.q.weight, 0);
    const got = qs.reduce((s, x) => s + (answers[x.i] === x.q.high ? x.q.weight : 0), 0);
    return got > total / 2;
  };
  const plan = high('plan');
  const start = high('start');
  if (plan) return start ? 'steady' : 'planner';
  return start ? 'spark' : 'explorer';
}
