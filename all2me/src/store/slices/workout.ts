import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';

export interface WorkoutSession {
  id: string;
  dayKey: string;
  routineId: string;
  seconds: number;
  moves: number;
  at: string; // ISO
}

interface WorkoutState {
  hydrated: boolean;
  sessions: WorkoutSession[];
  addSession: (s: { routineId: string; seconds: number; moves: number }) => void;
  reset: () => void;
}

export const useWorkout = create<WorkoutState>()(
  persist(
    (set) => ({
      hydrated: false,
      sessions: [],
      addSession: (s) =>
        set((st) => ({
          sessions: [
            ...st.sessions,
            { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, dayKey: dayKeyOf(), routineId: s.routineId, seconds: Math.round(s.seconds), moves: s.moves, at: new Date().toISOString() },
          ].slice(-300),
        })),
      reset: () => set({ sessions: [] }),
    }),
    {
      name: 'all2me-workout-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ sessions: s.sessions }),
      onRehydrateStorage: () => () => {
        useWorkout.setState({ hydrated: true });
      },
    },
  ),
);
