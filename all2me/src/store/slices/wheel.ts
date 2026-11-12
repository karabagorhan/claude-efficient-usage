/** Çark dilimi: özelleştirilmiş çarklar, seçili çark, son sonuç. Yalnız cihazda. */
import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WHEELS, MAX_SLICES, MIN_SLICES, WHEEL_IDS, type WheelId, type WheelSlice } from '../../data/wheels';

export interface WheelResult {
  wheelId: WheelId;
  sliceId: string;
}

interface WheelState {
  hydrated: boolean;
  /** yalnız kullanıcının değiştirdiği çarklar; yoksa varsayılan */
  custom: Partial<Record<WheelId, WheelSlice[]>>;
  selected: WheelId;
  last: WheelResult | null;
  select: (id: WheelId) => void;
  setSlices: (id: WheelId, slices: WheelSlice[]) => void;
  resetWheel: (id: WheelId) => void;
  setLast: (r: WheelResult | null) => void;
  reset: () => void;
}

export const useWheel = create<WheelState>()(
  persist(
    (set) => ({
      hydrated: false,
      custom: {},
      selected: 'chores',
      last: null,
      select: (id) => set({ selected: id }),
      setSlices: (id, slices) =>
        set((s) => {
          if (slices.length < MIN_SLICES || slices.length > MAX_SLICES) return s;
          return { custom: { ...s.custom, [id]: slices } };
        }),
      resetWheel: (id) =>
        set((s) => {
          const custom = { ...s.custom };
          delete custom[id];
          return { custom, last: s.last?.wheelId === id ? null : s.last };
        }),
      setLast: (last) => set({ last }),
      reset: () => set({ custom: {}, selected: 'chores', last: null }),
    }),
    {
      name: 'all2me-wheel-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ custom: s.custom, selected: s.selected, last: s.last }),
      onRehydrateStorage: () => () => {
        useWheel.setState({ hydrated: true });
      },
    },
  ),
);

/** Çarkın geçerli dilimleri (özel ya da varsayılan). Kararlı referans döner. */
export const slicesOf = (custom: Partial<Record<WheelId, WheelSlice[]>>, id: WheelId): WheelSlice[] =>
  custom[id] ?? DEFAULT_WHEELS[id];

export const isWheelId = (v: unknown): v is WheelId => typeof v === 'string' && (WHEEL_IDS as readonly string[]).includes(v);
