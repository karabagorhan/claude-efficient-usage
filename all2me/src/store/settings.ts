import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Lang } from '../i18n/types';

export type Units = 'ml' | 'oz';
export type ThemePref = 'system' | 'light' | 'dark';

export interface SettingsState {
  hydrated: boolean;
  lang: Lang;
  units: Units;
  theme: ThemePref;
  /** Tüm yerel bildirimler için ana anahtar. */
  notifications: boolean;
  onboarded: boolean;
  setLang: (l: Lang) => void;
  setUnits: (u: Units) => void;
  setTheme: (t: ThemePref) => void;
  setNotifications: (on: boolean) => void;
  setOnboarded: (on: boolean) => void;
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
      resetSettings: () => set({ ...defaults() }),
    }),
    {
      name: 'all2me-settings-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ lang, units, theme, notifications, onboarded }) => ({ lang, units, theme, notifications, onboarded }),
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
