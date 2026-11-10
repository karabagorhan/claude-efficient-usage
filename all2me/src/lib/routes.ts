/**
 * Rota URL'si kurucuları — parametre sözleşmesinin tek kaynağı (docs/CONTRACTS.md §8).
 * Kullanım: router.push(routes.actionHabit(h.id, 'wheel'))
 */
import type { HabitKind, HabitLink, PastelKey, Slot } from '../engine/types';

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
  } = {}) => `/task/new${qs(p)}`,
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
  reflectionWrite: (topicId?: string) => `/tools/reflection-write${qs({ topicId })}`,
} as const;
