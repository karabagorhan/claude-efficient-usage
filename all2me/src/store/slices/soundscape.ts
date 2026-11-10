import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SoundscapeState {
  hydrated: boolean;
  /** 0..1 ana ses düzeyi */
  volume: number;
  setVolume: (v: number) => void;
  reset: () => void;
}

export const useSoundscape = create<SoundscapeState>()(
  persist(
    (set) => ({
      hydrated: false,
      volume: 0.7,
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      reset: () => set({ volume: 0.7 }),
    }),
    {
      name: 'all2me-soundscape-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ volume: s.volume }),
      onRehydrateStorage: () => () => {
        useSoundscape.setState({ hydrated: true });
      },
    },
  ),
);
