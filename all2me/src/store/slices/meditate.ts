import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';

export interface MeditateSession {
  id: string;
  dayKey: string;
  seconds: number;
  patternId: string;
  at: string; // ISO
}

interface MeditateState {
  hydrated: boolean;
  sessions: MeditateSession[];
  lastPattern: string;
  lastMinutes: number;
  addSession: (s: { seconds: number; patternId: string }) => void;
  setLast: (patternId: string, minutes: number) => void;
  reset: () => void;
}

export const useMeditate = create<MeditateState>()(
  persist(
    (set) => ({
      hydrated: false,
      sessions: [],
      lastPattern: 'box',
      lastMinutes: 3,
      addSession: (s) =>
        set((st) => ({
          sessions: [
            ...st.sessions,
            { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, dayKey: dayKeyOf(), seconds: Math.round(s.seconds), patternId: s.patternId, at: new Date().toISOString() },
          ].slice(-300),
        })),
      setLast: (lastPattern, lastMinutes) => set({ lastPattern, lastMinutes }),
      reset: () => set({ sessions: [], lastPattern: 'box', lastMinutes: 3 }),
    }),
    {
      name: 'all2me-meditate-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ sessions: s.sessions, lastPattern: s.lastPattern, lastMinutes: s.lastMinutes }),
      onRehydrateStorage: () => () => {
        useMeditate.setState({ hydrated: true });
      },
    },
  ),
);
