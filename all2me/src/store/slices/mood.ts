import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';

export interface MoodEntry {
  dayKey: string;
  level: number; // 1..5
  tags: string[];
  note: string;
  at: string; // ISO
}

interface MoodState {
  hydrated: boolean;
  /** gün başına tek kayıt (üzerine yazılır) */
  entries: Record<string, MoodEntry>;
  save: (e: { level: number; tags: string[]; note: string }, dayKey?: string) => MoodEntry;
  remove: (dayKey: string) => void;
  reset: () => void;
}

export const useMood = create<MoodState>()(
  persist(
    (set) => ({
      hydrated: false,
      entries: {},
      save: (e, dayKey) => {
        const day = dayKey ?? dayKeyOf();
        const entry: MoodEntry = { dayKey: day, level: e.level, tags: e.tags, note: e.note.trim(), at: new Date().toISOString() };
        set((s) => ({ entries: { ...s.entries, [day]: entry } }));
        return entry;
      },
      remove: (day) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[day];
          return { entries };
        }),
      reset: () => set({ entries: {} }),
    }),
    {
      name: 'all2me-mood-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries }),
      onRehydrateStorage: () => () => {
        useMood.setState({ hydrated: true });
      },
    },
  ),
);

/** Bugünün seviyesi (0 = kayıt yok) — ilkel değer. */
export const selectTodayMood = (s: MoodState) => s.entries[dayKeyOf()]?.level ?? 0;
