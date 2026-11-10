import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Weekday } from '../../engine/types';

export interface AlarmItem {
  id: string;
  hour: number;
  minute: number;
  /** boş = bir kez (sonraki oluşum) */
  days: Weekday[];
  label: string;
  enabled: boolean;
  /** tek seferlik alarmda planlanan an (ISO); geçince kapatılır */
  onceAt?: string;
}

interface AlarmState {
  hydrated: boolean;
  alarms: AlarmItem[];
  save: (a: Omit<AlarmItem, 'id'> & { id?: string }) => string;
  toggle: (id: string, enabled: boolean) => void;
  remove: (id: string) => void;
  setAll: (alarms: AlarmItem[]) => void;
  reset: () => void;
}

export const useAlarm = create<AlarmState>()(
  persist(
    (set) => ({
      hydrated: false,
      alarms: [],
      save: (a) => {
        const id = a.id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        const item: AlarmItem = { ...a, id };
        set((s) => {
          const exists = s.alarms.some((x) => x.id === id);
          return { alarms: exists ? s.alarms.map((x) => (x.id === id ? item : x)) : [...s.alarms, item] };
        });
        return id;
      },
      toggle: (id, enabled) => set((s) => ({ alarms: s.alarms.map((x) => (x.id === id ? { ...x, enabled } : x)) })),
      remove: (id) => set((s) => ({ alarms: s.alarms.filter((x) => x.id !== id) })),
      setAll: (alarms) => set({ alarms }),
      reset: () => set({ alarms: [] }),
    }),
    {
      name: 'all2me-alarm-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ alarms: s.alarms }),
      onRehydrateStorage: () => () => {
        useAlarm.setState({ hydrated: true });
      },
    },
  ),
);
