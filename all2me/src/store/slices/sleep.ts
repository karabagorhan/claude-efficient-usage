import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';

/** Kayıt, uyanılan günün anahtarıyla saklanır (dün gece → bugünün anahtarı). */
export interface SleepEntry {
  dayKey: string;
  bed: string; // HH:MM
  wake: string; // HH:MM
  minutes: number;
  quality: number; // 0 = verilmedi, 1..5
}

interface SleepState {
  hydrated: boolean;
  entries: Record<string, SleepEntry>;
  goalHours: number;
  /** yatma hatırlatıcısı HH:MM ya da null */
  bedReminder: string | null;
  save: (e: Omit<SleepEntry, 'minutes'>) => SleepEntry;
  setQuality: (dayKey: string, q: number) => void;
  remove: (dayKey: string) => void;
  setGoal: (h: number) => void;
  setBedReminder: (t: string | null) => void;
  reset: () => void;
}

const mins = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

/** Yatış → kalkış süresi (dk); kalkış yatıştan küçük ya da eşitse ertesi gün sayılır. */
export const sleepMinutes = (bed: string, wake: string) => {
  const d = mins(wake) - mins(bed);
  return d > 0 ? d : d + 24 * 60;
};

export const useSleep = create<SleepState>()(
  persist(
    (set) => ({
      hydrated: false,
      entries: {},
      goalHours: 8,
      bedReminder: null,
      save: (e) => {
        const entry: SleepEntry = { ...e, minutes: sleepMinutes(e.bed, e.wake) };
        set((s) => ({ entries: { ...s.entries, [entry.dayKey]: entry } }));
        return entry;
      },
      setQuality: (dayKey, quality) =>
        set((s) => (s.entries[dayKey] ? { entries: { ...s.entries, [dayKey]: { ...s.entries[dayKey], quality } } } : s)),
      remove: (dayKey) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[dayKey];
          return { entries };
        }),
      setGoal: (h) => set({ goalHours: Math.min(12, Math.max(4, h)) }),
      setBedReminder: (bedReminder) => set({ bedReminder }),
      reset: () => set({ entries: {}, goalHours: 8, bedReminder: null }),
    }),
    {
      name: 'all2me-sleep-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ entries: s.entries, goalHours: s.goalHours, bedReminder: s.bedReminder }),
      onRehydrateStorage: () => () => {
        useSleep.setState({ hydrated: true });
      },
    },
  ),
);

export const todayKey = () => dayKeyOf();
