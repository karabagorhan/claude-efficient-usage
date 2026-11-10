import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';
import { uuid } from '../../lib/id';
import type { Currency, MealEntry, MealKind, MealSlot } from '../../features/life/types';

export interface MealsRemind {
  /** akşam yemeği planı hatırlatıcısı (her gün) */
  dinner: boolean;
  dinnerTime: string;
  /** haftalık hazırlık günü */
  prep: boolean;
  prepWeekday: number; // 0 = Pzt
  prepTime: string;
}

interface MealsState {
  hydrated: boolean;
  entries: Record<string, MealEntry>;
  goal: { fastMax: number; homeMin: number };
  /** null = henüz seçilmedi (dil varsayılanı kullanılır) */
  currency: Currency | null;
  /** haftalık tekrar eden menü: `<gün 0=Pzt>|<lunch|dinner>` → fikir id'si */
  plan: Record<string, string>;
  shopChecked: Record<string, true>;
  remind: MealsRemind;
  activityDay: string;
  add: (p: { slot: MealSlot; kind: MealKind; note?: string; amount?: number; dayKey?: string }) => MealEntry;
  remove: (id: string) => void;
  setGoal: (g: Partial<{ fastMax: number; homeMin: number }>) => void;
  setCurrency: (c: Currency) => void;
  setPlanCell: (key: string, ideaId: string | null) => void;
  fillPlan: (cells: Record<string, string>) => void;
  clearPlan: () => void;
  toggleShop: (key: string) => void;
  clearShop: () => void;
  setRemind: (r: Partial<MealsRemind>) => void;
  markActivity: (day: string) => void;
  reset: () => void;
}

export const DEFAULT_MEALS_REMIND: MealsRemind = { dinner: false, dinnerTime: '17:00', prep: false, prepWeekday: 6, prepTime: '18:00' };

const initial = {
  entries: {} as Record<string, MealEntry>,
  goal: { fastMax: 2, homeMin: 10 },
  currency: null as Currency | null,
  plan: {} as Record<string, string>,
  shopChecked: {} as Record<string, true>,
  remind: DEFAULT_MEALS_REMIND,
  activityDay: '',
};

export const useMeals = create<MealsState>()(
  persist(
    (set) => ({
      hydrated: false,
      ...initial,
      add: ({ slot, kind, note, amount, dayKey }) => {
        const e: MealEntry = {
          id: uuid(),
          dayKey: dayKey ?? dayKeyOf(),
          slot,
          kind,
          at: new Date().toISOString(),
          ...(note ? { note } : {}),
          ...(amount && amount > 0 ? { amount } : {}),
        };
        set((s) => ({ entries: { ...s.entries, [e.id]: e } }));
        return e;
      },
      remove: (id) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[id];
          return { entries };
        }),
      setGoal: (g) => set((s) => ({ goal: { ...s.goal, ...g } })),
      setCurrency: (currency) => set({ currency }),
      setPlanCell: (key, ideaId) =>
        set((s) => {
          const plan = { ...s.plan };
          if (ideaId) plan[key] = ideaId;
          else delete plan[key];
          return { plan, shopChecked: {} };
        }),
      fillPlan: (cells) => set((s) => ({ plan: { ...s.plan, ...cells }, shopChecked: {} })),
      clearPlan: () => set({ plan: {}, shopChecked: {} }),
      toggleShop: (key) =>
        set((s) => {
          const shopChecked = { ...s.shopChecked };
          if (shopChecked[key]) delete shopChecked[key];
          else shopChecked[key] = true;
          return { shopChecked };
        }),
      clearShop: () => set({ shopChecked: {} }),
      setRemind: (r) => set((s) => ({ remind: { ...s.remind, ...r } })),
      markActivity: (day) => set({ activityDay: day }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'all2me-meals-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        entries: s.entries,
        goal: s.goal,
        currency: s.currency,
        plan: s.plan,
        shopChecked: s.shopChecked,
        remind: s.remind,
        activityDay: s.activityDay,
      }),
      onRehydrateStorage: () => () => {
        useMeals.setState({ hydrated: true });
      },
    },
  ),
);
