import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';
import { uuid } from '../../lib/id';

export interface DrinkEntry {
  id: string;
  dayKey: string;
  ml: number;
  at: string; // ISO
}

/** Hatırlatıcı aralığı (saat); 0 = kapalı */
export type DrinkReminder = 0 | 1 | 2 | 3;

interface DrinkState {
  hydrated: boolean;
  entries: Record<string, DrinkEntry>;
  /** günlük hedef (ml) */
  goalMl: number;
  reminder: DrinkReminder;
  /** logActivity('drink') en son hangi gün çağrıldı */
  activityDay: string;
  add: (ml: number, dayKey?: string) => DrinkEntry;
  remove: (id: string) => void;
  /** bugünün son kaydını geri alır, silineni döner */
  undoLast: (dayKey?: string) => DrinkEntry | null;
  setGoal: (ml: number) => void;
  setReminder: (r: DrinkReminder) => void;
  markActivity: (dayKey: string) => void;
  reset: () => void;
}

export const DEFAULT_GOAL_ML = 2000;

export const useDrink = create<DrinkState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      entries: {},
      goalMl: DEFAULT_GOAL_ML,
      reminder: 0,
      activityDay: '',
      add: (ml, dayKey) => {
        const e: DrinkEntry = { id: uuid(), dayKey: dayKey ?? dayKeyOf(), ml: Math.max(1, Math.round(ml)), at: new Date().toISOString() };
        set((s) => ({ entries: { ...s.entries, [e.id]: e } }));
        return e;
      },
      remove: (id) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[id];
          return { entries };
        }),
      undoLast: (dayKey) => {
        const day = dayKey ?? dayKeyOf();
        const list = Object.values(get().entries)
          .filter((e) => e.dayKey === day)
          .sort((a, b) => (a.at < b.at ? 1 : -1));
        const last = list[0];
        if (!last) return null;
        get().remove(last.id);
        return last;
      },
      setGoal: (ml) => set({ goalMl: Math.min(6000, Math.max(500, Math.round(ml))) }),
      setReminder: (reminder) => set({ reminder }),
      markActivity: (activityDay) => set({ activityDay }),
      reset: () => set({ entries: {}, goalMl: DEFAULT_GOAL_ML, reminder: 0, activityDay: '' }),
    }),
    {
      name: 'all2me-drink-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries, goalMl: s.goalMl, reminder: s.reminder, activityDay: s.activityDay }),
      onRehydrateStorage: () => () => {
        useDrink.setState({ hydrated: true });
      },
    },
  ),
);

/** Belirli günün toplamı (ml). İlkel değer döner. */
export const drinkTotalOn = (s: DrinkState, day: string) =>
  Object.values(s.entries).reduce((a, e) => (e.dayKey === day ? a + e.ml : a), 0);
