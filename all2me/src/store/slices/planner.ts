/** Planlayıcı dilimi: son cevaplar (yalnız cihazda). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ answers: s.answers }),
      onRehydrateStorage: () => () => {
        usePlanner.setState({ hydrated: true });
      },
    },
  ),
);
