/** İlham sekmesi dilimi: favori şablonlar, son aramalar, test sonuçları (yalnız cihazda). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface QuizRecord {
  resultId: string;
  at: string; // ISO
}

interface FavoritesState {
  hydrated: boolean;
  /** favori şablon kimlikleri (en yeni başta) */
  favorites: string[];
  /** son aramalar (en yeni başta) */
  recent: string[];
  quizResults: Record<string, QuizRecord>;
  toggleFavorite: (id: string) => boolean;
  addRecent: (q: string) => void;
  clearRecent: () => void;
  setQuizResult: (quizId: string, resultId: string) => void;
  reset: () => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      favorites: [],
      recent: [],
      quizResults: {},
      toggleFavorite: (id) => {
        const has = get().favorites.includes(id);
        set((s) => ({ favorites: has ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites] }));
        return !has;
      },
      addRecent: (q) => {
        const v = q.trim();
        if (!v) return;
        set((s) => ({ recent: [v, ...s.recent.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 8) }));
      },
      clearRecent: () => set({ recent: [] }),
      setQuizResult: (quizId, resultId) =>
        set((s) => ({ quizResults: { ...s.quizResults, [quizId]: { resultId, at: new Date().toISOString() } } })),
      reset: () => set({ favorites: [], recent: [], quizResults: {} }),
    }),
    {
      name: 'all2me-favorites-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ favorites: s.favorites, recent: s.recent, quizResults: s.quizResults }),
      onRehydrateStorage: () => () => {
        useFavorites.setState({ hydrated: true });
      },
    },
  ),
);
