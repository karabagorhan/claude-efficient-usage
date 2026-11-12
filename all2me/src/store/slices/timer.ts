import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';

/** Çalışma oturumu etiketleri (yüksek lisans takibi bunları okur) */
export const TIMER_TAGS = ['focus', 'lesson', 'homework', 'article', 'work'] as const;
export type TimerTag = (typeof TIMER_TAGS)[number];

export interface FocusSession {
  id: string;
  dayKey: string;
  /** tamamlanan odak dakikası (ondalık olabilir) */
  minutes: number;
  mode: 'focus' | 'pomodoro';
  habitId?: string;
  tag: TimerTag;
  at: string; // ISO
}

interface TimerState {
  hydrated: boolean;
  sessions: FocusSession[];
  lastMinutes: number;
  lastMode: 'focus' | 'pomodoro';
  lastTag: TimerTag;
  setTag: (tag: TimerTag) => void;
  addSession: (s: { minutes: number; mode: 'focus' | 'pomodoro'; habitId?: string; tag?: TimerTag }) => void;
  setLast: (minutes: number, mode: 'focus' | 'pomodoro') => void;
  reset: () => void;
}

const KEEP = 400;

export const useTimer = create<TimerState>()(
  persist(
    (set) => ({
      hydrated: false,
      sessions: [],
      lastMinutes: 25,
      lastMode: 'focus',
      lastTag: 'focus',
      setTag: (lastTag) => set({ lastTag }),
      addSession: (s) =>
        set((st) => ({
          sessions: [
            ...st.sessions,
            {
              id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
              dayKey: dayKeyOf(),
              minutes: Math.round(s.minutes * 10) / 10,
              mode: s.mode,
              habitId: s.habitId,
              tag: s.tag ?? st.lastTag,
              at: new Date().toISOString(),
            },
          ].slice(-KEEP),
        })),
      setLast: (lastMinutes, lastMode) => set({ lastMinutes, lastMode }),
      reset: () => set({ sessions: [], lastMinutes: 25, lastMode: 'focus', lastTag: 'focus' }),
    }),
    {
      name: 'all2me-timer-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ sessions: s.sessions, lastMinutes: s.lastMinutes, lastMode: s.lastMode, lastTag: s.lastTag }),
      // eski kayıtlarda tag yoksa 'focus' say
      migrate: (p: any) => p,
      onRehydrateStorage: () => () => {
        useTimer.setState((st) => ({ hydrated: true, sessions: st.sessions.map((x) => (x.tag ? x : { ...x, tag: 'focus' as TimerTag })) }));
      },
    },
  ),
);

/** [fromDay, toDay] (dahil, YYYY-MM-DD) aralığında etikete göre toplam dakika. */
export function minutesByTagOf(sessions: FocusSession[], fromDay: string, toDay: string): Record<TimerTag, number> {
  const out = { focus: 0, lesson: 0, homework: 0, article: 0, work: 0 } as Record<TimerTag, number>;
  for (const s of sessions) {
    if (s.dayKey >= fromDay && s.dayKey <= toDay) out[s.tag ?? 'focus'] += s.minutes;
  }
  return out;
}

/** Anlık değer (reaktif değil): etikete göre toplam dakika. */
export const minutesByTag = (fromDay: string, toDay: string): Record<TimerTag, number> =>
  minutesByTagOf(useTimer.getState().sessions, fromDay, toDay);
