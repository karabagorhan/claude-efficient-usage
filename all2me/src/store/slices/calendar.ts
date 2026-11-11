/**
 * Takvim eşlemesi (yalnız cihazda). Anahtar: all2me-calendar-v1.
 * `events`: bizim kimliğimiz ('item:<id>' | 'course:<id>' | 'habit:<id>') -> cihaz takvimindeki olay kimlikleri.
 * `calendarId`: "All2Me" takviminin cihazdaki kimliği.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CalendarState {
  hydrated: boolean;
  calendarId: string | null;
  events: Record<string, string[]>;
  setCalendarId: (id: string | null) => void;
  setEvents: (key: string, ids: string[]) => void;
  removeKey: (key: string) => void;
  clearEvents: () => void;
  reset: () => void;
}

export const useCalendar = create<CalendarState>()(
  persist(
    (set) => ({
      hydrated: false,
      calendarId: null,
      events: {},
      setCalendarId: (calendarId) => set({ calendarId }),
      setEvents: (key, ids) => set((s) => ({ events: { ...s.events, [key]: ids } })),
      removeKey: (key) =>
        set((s) => {
          const events = { ...s.events };
          delete events[key];
          return { events };
        }),
      clearEvents: () => set({ events: {} }),
      reset: () => set({ calendarId: null, events: {} }),
    }),
    {
      name: 'all2me-calendar-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ calendarId: s.calendarId, events: s.events }),
      onRehydrateStorage: () => () => {
        useCalendar.setState({ hydrated: true });
      },
    },
  ),
);
