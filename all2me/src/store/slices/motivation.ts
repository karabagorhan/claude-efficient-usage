import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MotivationState {
  hydrated: boolean;
  /** favori söz dizinleri */
  favorites: number[];
  toggleFavorite: (i: number) => void;
  reset: () => void;
}

export const useMotivation = create<MotivationState>()(
  persist(
    (set) => ({
      hydrated: false,
      favorites: [],
      toggleFavorite: (i) =>
        set((s) => ({ favorites: s.favorites.includes(i) ? s.favorites.filter((x) => x !== i) : [...s.favorites, i] })),
      reset: () => set({ favorites: [] }),
    }),
    {
      name: 'all2me-motivation-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ favorites: s.favorites }),
      onRehydrateStorage: () => () => {
        useMotivation.setState({ hydrated: true });
      },
    },
  ),
);
