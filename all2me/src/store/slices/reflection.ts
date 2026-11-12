import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';
import { uuid } from '../../lib/id';

export interface ReflectionEntry {
  id: string;
  /** konu yoksa serbest yazı */
  topicId: string | null;
  dayKey: string;
  /** soru sırasıyla cevaplar (serbest yazıda tek eleman) */
  answers: string[];
  at: string; // ISO
  updatedAt: string;
}

interface ReflectionState {
  hydrated: boolean;
  entries: Record<string, ReflectionEntry>;
  add: (topicId: string | null, answers: string[]) => ReflectionEntry;
  update: (id: string, answers: string[]) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useReflection = create<ReflectionState>()(
  persist(
    (set) => ({
      hydrated: false,
      entries: {},
      add: (topicId, answers) => {
        const now = new Date().toISOString();
        const e: ReflectionEntry = { id: uuid(), topicId, dayKey: dayKeyOf(), answers, at: now, updatedAt: now };
        set((s) => ({ entries: { ...s.entries, [e.id]: e } }));
        return e;
      },
      update: (id, answers) =>
        set((s) => (s.entries[id] ? { entries: { ...s.entries, [id]: { ...s.entries[id], answers, updatedAt: new Date().toISOString() } } } : s)),
      remove: (id) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[id];
          return { entries };
        }),
      reset: () => set({ entries: {} }),
    }),
    {
      name: 'all2me-reflection-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ entries: s.entries }),
      onRehydrateStorage: () => () => {
        useReflection.setState({ hydrated: true });
      },
    },
  ),
);
