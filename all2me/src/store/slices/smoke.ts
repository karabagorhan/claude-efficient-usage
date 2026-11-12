import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';
import { uuid } from '../../lib/id';
import type { SmokeLog, SmokePlan, SmokePricing, SmokeResist, SmokeTrigger } from '../../features/life/types';

export interface SmokeRemind {
  /** gün içi destek mesajları */
  support: boolean;
  hours: number[];
  /** akşam kapanış hatırlatıcısı */
  closing: boolean;
  closingTime: string; // HH:MM
}

interface SmokeState {
  hydrated: boolean;
  plan: SmokePlan | null;
  pricing: SmokePricing;
  /** kurulum anı (ISO) — hiç kayıt yokken "son sigaradan beri" bunun üzerinden */
  startedAt: string | null;
  logs: Record<string, SmokeLog>;
  resists: Record<string, SmokeResist>;
  closed: Record<string, true>;
  /** erteleme sayacının bitiş anı (epoch ms) */
  craving: number | null;
  remind: SmokeRemind;
  activityDay: string;
  setup: (plan: SmokePlan, pricing: SmokePricing) => void;
  log: (trigger?: SmokeTrigger, dayKey?: string) => SmokeLog;
  setTrigger: (id: string, trigger?: SmokeTrigger) => void;
  /** bugünün son kaydını geri alır */
  undoLast: (dayKey?: string) => SmokeLog | null;
  /** direnme kaydı; n = o günün kaçıncı direnişi */
  resist: (dayKey?: string) => SmokeResist & { n: number };
  closeDay: (dayKey: string) => void;
  startCraving: (endsAt: number) => void;
  stopCraving: () => void;
  setRemind: (r: Partial<SmokeRemind>) => void;
  markActivity: (day: string) => void;
  reset: () => void;
}

export const DEFAULT_REMIND: SmokeRemind = { support: false, hours: [11, 15, 20], closing: true, closingTime: '21:00' };
export const DEFAULT_PRICING: SmokePricing = { packPrice: 100, packSize: 20, currency: 'TRY' };

const initial = {
  plan: null as SmokePlan | null,
  pricing: DEFAULT_PRICING,
  startedAt: null as string | null,
  logs: {} as Record<string, SmokeLog>,
  resists: {} as Record<string, SmokeResist>,
  closed: {} as Record<string, true>,
  craving: null as number | null,
  remind: DEFAULT_REMIND,
  activityDay: '',
};

export const useSmoke = create<SmokeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,
      setup: (plan, pricing) => set((s) => ({ plan, pricing, startedAt: s.startedAt ?? new Date().toISOString() })),
      log: (trigger, dayKey) => {
        const e: SmokeLog = { id: uuid(), dayKey: dayKey ?? dayKeyOf(), at: new Date().toISOString(), ...(trigger ? { trigger } : {}) };
        set((s) => ({ logs: { ...s.logs, [e.id]: e } }));
        return e;
      },
      setTrigger: (id, trigger) =>
        set((s) => {
          const cur = s.logs[id];
          if (!cur) return {};
          const next = { ...cur };
          if (trigger) next.trigger = trigger;
          else delete next.trigger;
          return { logs: { ...s.logs, [id]: next } };
        }),
      undoLast: (dayKey) => {
        const day = dayKey ?? dayKeyOf();
        const last = Object.values(get().logs)
          .filter((e) => e.dayKey === day)
          .sort((a, b) => (a.at < b.at ? 1 : -1))[0];
        if (!last) return null;
        set((s) => {
          const logs = { ...s.logs };
          delete logs[last.id];
          return { logs };
        });
        return last;
      },
      resist: (dayKey) => {
        const day = dayKey ?? dayKeyOf();
        const n = Object.values(get().resists).filter((r) => r.dayKey === day).length + 1;
        const r: SmokeResist = { id: `smoke:resist:${day}:${n}`, dayKey: day, at: new Date().toISOString() };
        set((s) => ({ resists: { ...s.resists, [r.id]: r } }));
        return { ...r, n };
      },
      closeDay: (dayKey) => set((s) => ({ closed: { ...s.closed, [dayKey]: true } })),
      startCraving: (endsAt) => set({ craving: endsAt }),
      stopCraving: () => set({ craving: null }),
      setRemind: (r) => set((s) => ({ remind: { ...s.remind, ...r } })),
      markActivity: (day) => set({ activityDay: day }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'all2me-smoke-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({
        plan: s.plan,
        pricing: s.pricing,
        startedAt: s.startedAt,
        logs: s.logs,
        resists: s.resists,
        closed: s.closed,
        craving: s.craving,
        remind: s.remind,
        activityDay: s.activityDay,
      }),
      onRehydrateStorage: () => () => {
        useSmoke.setState({ hydrated: true });
      },
    },
  ),
);
