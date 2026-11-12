import { safeJSONStorage, safeMerge } from './safeStorage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../i18n/types';

export type Units = 'ml' | 'oz';
export type ThemePref = 'system' | 'light' | 'dark';
export type TaskOrder = 'auto' | 'manual';

/** Sessiz saatler: bu aralıkta tekrarlayan hatırlatıcılar kurulmaz, tek seferlikler aralık sonuna ertelenir (alarm hariç). */
export interface QuietHours {
  enabled: boolean;
  /** 'HH:MM' */
  start: string;
  /** 'HH:MM' (start'tan küçükse gece yarısını aşar) */
  end: string;
}

/** Günlük bildirim üst sınırı seçenekleri (0 = sınırsız). */
export const DAILY_CAP_OPTIONS = [0, 6, 8, 12, 16, 24] as const;
export const DEFAULT_DAILY_CAP = 12;

export interface SettingsState {
  hydrated: boolean;
  lang: Lang;
  units: Units;
  theme: ThemePref;
  /** Tüm yerel bildirimler için ana anahtar. */
  notifications: boolean;
  onboarded: boolean;
  /** Rutin görev sırası: saate göre otomatik ya da elle */
  taskOrder: TaskOrder;
  quietHours: QuietHours;
  /** Bir günde en çok kaç hatırlatıcı (alarm/zamanlayıcı hariç); 0 = sınırsız */
  dailyCap: number;
  setLang: (l: Lang) => void;
  setUnits: (u: Units) => void;
  setTheme: (t: ThemePref) => void;
  setNotifications: (on: boolean) => void;
  setOnboarded: (on: boolean) => void;
  setTaskOrder: (o: TaskOrder) => void;
  setQuietHours: (q: Partial<QuietHours>) => void;
  setDailyCap: (n: number) => void;
  resetSettings: () => void;
}

/** Cihaz dili: Türkçe ise 'tr', değilse 'en'. */
export function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return code === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

const defaults = () => ({
  lang: deviceLang(),
  units: 'ml' as Units,
  theme: 'system' as ThemePref,
  notifications: true,
  onboarded: false,
  taskOrder: 'auto' as TaskOrder,
  quietHours: { enabled: false, start: '22:00', end: '07:00' } as QuietHours,
  dailyCap: DEFAULT_DAILY_CAP,
});

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      ...defaults(),
      setLang: (lang) => set({ lang }),
      setUnits: (units) => set({ units }),
      setTheme: (theme) => set({ theme }),
      setNotifications: (notifications) => set({ notifications }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setTaskOrder: (taskOrder) => set({ taskOrder }),
      setQuietHours: (q) => set((s) => ({ quietHours: { ...s.quietHours, ...q } })),
      setDailyCap: (dailyCap) => set({ dailyCap: Math.max(0, Math.round(dailyCap)) }),
      resetSettings: () => set({ ...defaults() }),
    }),
    {
      name: 'all2me-settings-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: ({ lang, units, theme, notifications, onboarded, taskOrder, quietHours, dailyCap }) => ({
        lang,
        units,
        theme,
        notifications,
        onboarded,
        taskOrder,
        quietHours,
        dailyCap,
      }),
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
