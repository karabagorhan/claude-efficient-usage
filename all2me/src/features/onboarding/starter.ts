/** Onboarding başlangıç görev önerileri (iki dilli) ve cevaplara göre seçim. */
import type { Difficulty, HabitKind, HabitLink, Loc, PastelKey, Slot } from '../../engine/types';

export type QuestionId = 'organize' | 'habits' | 'sleep' | 'focus' | 'move' | 'smoke' | 'goals';

export interface StarterTask {
  id: string;
  icon: string;
  title: Loc;
  slot: Slot;
  pastel: PastelKey;
  difficulty: Difficulty;
  kind?: HabitKind;
  target?: number;
  link?: HabitLink;
  /** Hangi sorularda "Evet" denince öne çıkar */
  tags: QuestionId[];
}

export const STARTER_TASKS: StarterTask[] = [
  { id: 'smokelimit', icon: '🚭', title: { tr: 'Günlük sigara limitime uy', en: 'Stay within my daily cigarette limit' }, slot: 'anytime', pastel: 'mint', difficulty: 'hard', tags: ['smoke'] },
  { id: 'craving', icon: '🌬️', title: { tr: 'Sigara isteğinde 5 nefes al, bir bardak su iç', en: 'When a craving hits, take 5 breaths and drink water' }, slot: 'anytime', pastel: 'blue', difficulty: 'medium', tags: ['smoke', 'focus'] },
  { id: 'homemeal', icon: '🍲', title: { tr: 'Bugün ev yemeği ye', en: 'Eat a home-cooked meal today' }, slot: 'evening', pastel: 'peach', difficulty: 'easy', tags: ['habits', 'move'] },
  { id: 'study25', icon: '📚', title: { tr: 'Derse/ödeve 25 dk çalış', en: 'Study or do homework for 25 min' }, slot: 'afternoon', pastel: 'purple', difficulty: 'medium', kind: 'timer', target: 25, tags: ['goals', 'focus'] },
  { id: 'tomorrow', icon: '🗓️', title: { tr: 'Yarının işlerini listele', en: 'List tomorrow’s to-dos' }, slot: 'evening', pastel: 'yellow', difficulty: 'easy', tags: ['goals', 'organize'] },
  { id: 'bed', icon: '🛏️', title: { tr: 'Yatağı topla', en: 'Make the bed' }, slot: 'morning', pastel: 'blue', difficulty: 'mini', tags: ['organize', 'habits'] },
  { id: 'breakfast', icon: '🍳', title: { tr: 'Kahvaltı yap', en: 'Eat breakfast' }, slot: 'morning', pastel: 'peach', difficulty: 'easy', tags: ['habits', 'move'] },
  { id: 'water', icon: '💧', title: { tr: 'Su iç', en: 'Drink water' }, slot: 'anytime', pastel: 'mint', difficulty: 'easy', kind: 'counter', target: 8, link: 'drink', tags: ['habits', 'move'] },
  { id: 'top3', icon: '📝', title: { tr: 'Günün 3 önceliğini yaz', en: 'Write your top 3 for the day' }, slot: 'morning', pastel: 'yellow', difficulty: 'easy', tags: ['organize', 'focus'] },
  { id: 'desk', icon: '🧹', title: { tr: 'Masayı topla', en: 'Tidy the desk' }, slot: 'afternoon', pastel: 'green', difficulty: 'mini', tags: ['organize', 'focus'] },
  { id: 'focus25', icon: '🎯', title: { tr: '25 dakika odaklan', en: 'Focus for 25 minutes' }, slot: 'afternoon', pastel: 'purple', difficulty: 'medium', kind: 'timer', target: 25, tags: ['focus', 'organize'] },
  { id: 'breathe', icon: '🧘', title: { tr: '5 dakika nefes al', en: 'Breathe for 5 minutes' }, slot: 'anytime', pastel: 'mint', difficulty: 'easy', tags: ['focus', 'sleep'] },
  { id: 'walk', icon: '🚶', title: { tr: '10 dakika yürüyüş', en: 'Walk for 10 minutes' }, slot: 'afternoon', pastel: 'green', difficulty: 'medium', tags: ['move', 'habits'] },
  { id: 'stretch', icon: '🤸', title: { tr: '5 dakika esne', en: 'Stretch for 5 minutes' }, slot: 'morning', pastel: 'pink', difficulty: 'easy', tags: ['move', 'sleep'] },
  { id: 'screens', icon: '📵', title: { tr: 'Yatmadan önce ekranı bırak', en: 'Put screens away before bed' }, slot: 'evening', pastel: 'purple', difficulty: 'medium', tags: ['sleep', 'focus'] },
  { id: 'mood', icon: '🙂', title: { tr: 'Ruh halini kaydet', en: 'Log your mood' }, slot: 'evening', pastel: 'pink', difficulty: 'mini', link: 'mood', tags: ['habits', 'sleep'] },
  { id: 'reflect', icon: '📓', title: { tr: 'Bugünü düşün ve yaz', en: 'Reflect on your day' }, slot: 'evening', pastel: 'blue', difficulty: 'easy', link: 'reflection', tags: ['habits', 'sleep'] },
];

/** Cevaplarla eşleşen etiket sayısına göre sıralar (eşitlikte sabit sıra), ilk `n` tanesi varsayılan seçili. */
export function rankStarter(answers: Partial<Record<QuestionId, boolean>>): StarterTask[] {
  const w = (q: QuestionId) => (q === 'smoke' || q === 'goals' ? 3 : 1);
  const score = (s: StarterTask) => s.tags.reduce((n, q) => n + (answers[q] ? w(q) : 0), 0);
  return STARTER_TASKS.map((s, i) => ({ s, i, sc: score(s) }))
    .sort((a, b) => b.sc - a.sc || a.i - b.i)
    .map((x) => x.s);
}

export const DEFAULT_SELECTED = 6;
