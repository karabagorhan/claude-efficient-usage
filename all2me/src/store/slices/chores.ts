import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedChores } from '../../data/chores';
import { addDays, dayKeyOf } from '../../engine/dates';
import { uuid } from '../../lib/id';
import type { Chore, ChoreArea, ChoreLog } from '../../features/life/types';

export type FlowKind = 'laundry' | 'dish';
export interface FlowState {
  /** -1 = boşta; 0.. = şu anki adım */
  step: number;
  /** makine bitiş anı (epoch ms) */
  endsAt: number | null;
  minutes: number;
}
export const FLOW_STEPS: Record<FlowKind, string[]> = {
  laundry: ['laundry-wash', 'laundry-dry', 'laundry-fold', 'laundry-put'],
  dish: ['dish-run', 'dish-empty'],
};
const DEFAULT_FLOWS: Record<FlowKind, FlowState> = {
  laundry: { step: -1, endsAt: null, minutes: 60 },
  dish: { step: -1, endsAt: null, minutes: 120 },
};

export interface ChoresRemind {
  on: boolean;
  time: string; // HH:MM
}

interface ChoresState {
  hydrated: boolean;
  seeded: boolean;
  chores: Record<string, Chore>;
  history: Record<string, ChoreLog>;
  flows: Record<FlowKind, FlowState>;
  remind: ChoresRemind;
  activityDay: string;
  /** işi yapıldı say; yeni ChoreLog döner */
  done: (id: string, dayKey?: string) => ChoreLog | null;
  /** yarına ertele (sayaç artar) */
  postpone: (id: string, dayKey?: string) => void;
  upsert: (p: { id?: string; name: string; emoji: string; area: ChoreArea; every: number }) => string;
  remove: (id: string) => void;
  setFlow: (kind: FlowKind, patch: Partial<FlowState>) => void;
  setRemind: (r: Partial<ChoresRemind>) => void;
  markActivity: (day: string) => void;
  reset: () => void;
}

const initial = () => ({
  seeded: true,
  chores: seedChores(dayKeyOf()),
  history: {} as Record<string, ChoreLog>,
  flows: DEFAULT_FLOWS,
  remind: { on: false, time: '19:00' } as ChoresRemind,
  activityDay: '',
});

export const useChores = create<ChoresState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial(),
      seeded: false,
      chores: {} as Record<string, Chore>,
      done: (id, dayKey) => {
        const c = get().chores[id];
        if (!c) return null;
        const day = dayKey ?? dayKeyOf();
        // Aynı iş aynı gün bir kez sayılır (BUG-004): ikinci dokunuş yeni kayıt / sayaç üretmez.
        if (Object.values(get().history).some((h) => h.choreId === id && h.dayKey === day)) return null;
        const log: ChoreLog = { id: uuid(), choreId: id, dayKey: day, at: new Date().toISOString() };
        set((s) => {
          const next = { ...c, lastDone: day, doneCount: c.doneCount + 1 };
          delete next.snoozeUntil;
          return { chores: { ...s.chores, [id]: next }, history: { ...s.history, [log.id]: log } };
        });
        return log;
      },
      postpone: (id, dayKey) => {
        const c = get().chores[id];
        if (!c) return;
        const day = dayKey ?? dayKeyOf();
        set((s) => ({ chores: { ...s.chores, [id]: { ...c, snoozeUntil: addDays(day, 1), postponed: c.postponed + 1 } } }));
      },
      upsert: ({ id, name, emoji, area, every }) => {
        const cur = id ? get().chores[id] : undefined;
        const nid = cur?.id ?? `u:${uuid()}`;
        const day = dayKeyOf();
        const next: Chore = cur
          ? { ...cur, emoji, area, every, ...(cur.key ? {} : { name }) }
          : { id: nid, name, emoji, area, every, createdDay: day, firstDue: day, postponed: 0, doneCount: 0 };
        set((s) => ({ chores: { ...s.chores, [nid]: next } }));
        return nid;
      },
      remove: (id) =>
        set((s) => {
          const chores = { ...s.chores };
          delete chores[id];
          return { chores };
        }),
      setFlow: (kind, patch) => set((s) => ({ flows: { ...s.flows, [kind]: { ...s.flows[kind], ...patch } } })),
      setRemind: (r) => set((s) => ({ remind: { ...s.remind, ...r } })),
      markActivity: (day) => set({ activityDay: day }),
      reset: () => set({ ...initial() }),
    }),
    {
      name: 'all2me-chores-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({
        seeded: s.seeded,
        chores: s.chores,
        history: s.history,
        flows: s.flows,
        remind: s.remind,
        activityDay: s.activityDay,
      }),
      onRehydrateStorage: () => () => {
        const s = useChores.getState();
        // ilk açılışta varsayılan işleri kur
        useChores.setState(s.seeded ? { hydrated: true } : { hydrated: true, seeded: true, chores: seedChores(dayKeyOf()) });
      },
    },
  ),
);
