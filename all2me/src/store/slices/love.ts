import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';

interface LoveState {
  hydrated: boolean;
  /** işaretlenen kart dizini → işaretlendiği gün */
  done: Record<number, string>;
  /** son bakılan kart dizini */
  index: number;
  setIndex: (i: number) => void;
  /** true dönerse ilk kez işaretlendi */
  toggle: (i: number) => boolean;
  reset: () => void;
}

export const useLove = create<LoveState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      done: {},
      index: 0,
      setIndex: (index) => set({ index }),
      toggle: (i) => {
        const done = { ...get().done };
        if (done[i]) {
          delete done[i];
          set({ done });
          return false;
        }
        done[i] = dayKeyOf();
        set({ done });
        return true;
      },
      reset: () => set({ done: {}, index: 0 }),
    }),
    {
      name: 'all2me-love-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ done: s.done, index: s.index }),
      onRehydrateStorage: () => () => {
        useLove.setState({ hydrated: true });
      },
    },
  ),
);
