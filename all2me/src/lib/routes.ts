/**
 * Rota URL'si kurucuları — parametre sözleşmesinin tek kaynağı (docs/CONTRACTS.md §8).
 * Kullanım: router.push(routes.actionHabit(h.id, 'wheel'))
 */
import type { Difficulty, HabitKind, HabitLink, PastelKey, Slot } from '../engine/types';

const qs = (o: Record<string, string | number | undefined | null>) => {
  const parts = Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export type ActionSource = 'wheel' | 'lucky' | 'reminder' | 'planner' | 'routine';
export type BonusGroup = 'wheel' | 'lucky';

export const routes = {
  /** Harekete Geç — gerçek görev */
  actionHabit: (habitId: string, source?: ActionSource) => `/action${qs({ habitId, source })}`,
  /** Harekete Geç — görev dışı bonus (çark dilimi, şanslı görev). title GÖRÜNEN dilde verilir. */
  actionBonus: (p: { bonusId: string; title: string; emoji: string; points: number; group: BonusGroup; pastel?: PastelKey; source?: ActionSource }) =>
    `/action${qs(p)}`,
  newTask: () => '/new-task',
  /** Görev düzenleyici: mevcut görev */
  editTask: (id: string) => `/task/${encodeURIComponent(id)}`,
  /** Görev düzenleyici: yeni görev, ön dolu */
  createTask: (p: {
    title?: string;
    icon?: string;
    pastel?: PastelKey;
    slot?: Slot;
    kind?: HabitKind;
    target?: number;
    link?: HabitLink;
    source?: string;
    difficulty?: Difficulty;
  } = {}) => `/task/new${qs(p)}`,
  /** Bağlı görevin aracı/takipçisi (Rutin'de bağlı göreve dokununca) */
  linkTarget: (link: HabitLink): string =>
    ({ drink: '/tools/drink', mood: '/tools/mood', reflection: '/tools/reflection', smoke: '/life/smoke', meal: '/life/meals', chore: '/life/chores', study: '/study', growth: '/growth' })[link],
  streak: () => '/streak',
  duel: (period?: 'day' | 'week' | 'month') => `/duel${qs({ period })}`,
  lucky: () => '/lucky',
  planner: () => '/planner',
  pairing: () => '/pairing',
  stats: () => '/stats',
  badges: () => '/badges',
  settings: () => '/settings',
  wheelEdit: (wheelId?: string) => `/wheel-edit${qs({ wheelId })}`,
  inspireTemplate: (id: string) => `/inspire/${encodeURIComponent(id)}`,
  inspireCategory: (id: string) => `/inspire/category/${encodeURIComponent(id)}`,
  inspireFavorites: () => '/inspire/favorites',
  inspireSearch: (q?: string) => `/inspire/search${qs({ q })}`,
  inspireQuiz: (id: string) => `/inspire/quiz/${encodeURIComponent(id)}`,
  tool: (
    name: 'timer' | 'drink' | 'sleep' | 'reflection' | 'meditate' | 'workout' | 'motivation' | 'soundscape' | 'alarm' | 'mood' | 'love',
  ) => `/tools/${name}`,
  /** Zamanlayıcı bir göreve bağlı açılabilir */
  timer: (p: { habitId?: string; minutes?: number } = {}) => `/tools/timer${qs(p)}`,
  reflectionWrite: (topicId?: string, entryId?: string) => `/tools/reflection-write${qs({ topicId, entryId })}`,
  /** Yaşam takibi: merkez ve alt takipçiler */
  life: (name: 'hub' | 'smoke' | 'meals' | 'chores' = 'hub') => (name === 'hub' ? '/life' : `/life/${name}`),
  /** Okul / yüksek lisans */
  study: () => '/study',
  studyCourse: (id: string) => `/study/course/${encodeURIComponent(id)}`,
  /** id = öğe id veya 'new'; yeni öğede courseId/type ön dolu */
  studyItem: (id: string, p: { courseId?: string; type?: string } = {}) => `/study/item/${encodeURIComponent(id)}${qs(p)}`,
  /** İş ve kişisel gelişim */
  growth: () => '/growth',
  growthGoal: (id: string) => `/growth/goal/${encodeURIComponent(id)}`,
} as const;
