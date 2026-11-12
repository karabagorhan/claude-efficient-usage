/** Planlayıcı dilimi: son cevaplar (yalnız cihazda). */
import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanAnswers } from '../../features/planner/plan';

interface PlannerState {
  hydrated: boolean;
  answers: PlanAnswers | null;
  setAnswers: (a: PlanAnswers) => void;
  reset: () => void;
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set) => ({
      hydrated: false,
      answers: null,
      setAnswers: (answers) => set({ answers }),
      reset: () => set({ answers: null }),
    }),
    {
      name: 'all2me-planner-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ answers: s.answers }),
      onRehydrateStorage: () => () => {
        usePlanner.setState({ hydrated: true });
      },
    },
  ),
);
