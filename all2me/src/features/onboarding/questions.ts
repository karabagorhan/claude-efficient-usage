import type { PastelKey } from '../../engine/types';
import type { QuestionId } from './starter';

export interface QuestionDef {
  id: QuestionId;
  pastel: PastelKey;
  before: { main: string; tag: string; bits: string[] };
  after: { main: string; tag: string; bits: string[] };
}

export const QUESTIONS: QuestionDef[] = [
  { id: 'organize', pastel: 'blue', before: { main: '😵', tag: '🪫', bits: ['📚', '🧦', '🥡'] }, after: { main: '😎', tag: '🔋', bits: ['📅', '✅', '☕'] } },
  { id: 'habits', pastel: 'mint', before: { main: '😩', tag: '🌧️', bits: ['🍟', '📱', '🧦'] }, after: { main: '💪', tag: '☀️', bits: ['🥗', '🧺', '🌱'] } },
  { id: 'sleep', pastel: 'purple', before: { main: '🥱', tag: '🪫', bits: ['☕', '📱', '💭'] }, after: { main: '😊', tag: '🔋', bits: ['🛏️', '🌙', '⭐'] } },
  { id: 'focus', pastel: 'peach', before: { main: '🤯', tag: '🌪️', bits: ['📱', '🔔', '💬'] }, after: { main: '🧘', tag: '🎯', bits: ['🎧', '📖', '✨'] } },
  { id: 'move', pastel: 'green', before: { main: '🐌', tag: '🪫', bits: ['🪑', '🍿', '📺'] }, after: { main: '🏃', tag: '🔋', bits: ['👟', '💧', '⚡'] } },
  { id: 'smoke', pastel: 'yellow', before: { main: '😮‍💨', tag: '🌫️', bits: ['🚬', '🥱', '💨'] }, after: { main: '😌', tag: '🌤️', bits: ['🚭', '💧', '🫁'] } },
  { id: 'goals', pastel: 'pink', before: { main: '😰', tag: '⏳', bits: ['📚', '💼', '📌'] }, after: { main: '🤩', tag: '🏆', bits: ['🎓', '✅', '📈'] } },
];

export type MetricId = 'selfControl' | 'concentration' | 'productivity' | 'energy';
export type Level = 'low' | 'mid' | 'high';

export const METRICS: Array<{ id: MetricId; icon: string; from: QuestionId[] }> = [
  { id: 'selfControl', icon: '📵', from: ['habits', 'focus', 'smoke'] },
  { id: 'concentration', icon: '🧘', from: ['focus', 'organize'] },
  { id: 'productivity', icon: '✅', from: ['organize', 'habits', 'goals'] },
  { id: 'energy', icon: '☕', from: ['sleep', 'move'] },
];

/** "Evet" = bu alanda gelişmek istiyor demektir; iki soruda da "Hayır" ise alan zaten iyi. */
export function metricLevel(answers: Partial<Record<QuestionId, boolean>>, from: QuestionId[]): { level: Level; value: number } {
  const yes = from.filter((q) => answers[q]).length;
  if (yes === 0) return { level: 'high', value: 0.9 };
  if (yes === 1) return { level: 'mid', value: 0.62 };
  return { level: 'low', value: 0.34 };
}
