/**
 * Haftalık rapor dilimi (yalnız cihazda). Anahtar: all2me-report-v1.
 * Rutin panosundaki "Haftanı gör" bandının kapatma durumu: kapatılan gün anahtarı saklanır
 * (aynı gün tekrar görünmez; Pazartesi ile Pazar ayrı günlerdir).
 */
import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReportState {
  hydrated: boolean;
  /** bandın kapatıldığı gün anahtarı ('' = hiç) */
  bannerDismissedDay: string;
  dismissBanner: (dayKey: string) => void;
  reset: () => void;
}

export const useReportPrefs = create<ReportState>()(
  persist(
    (set) => ({
      hydrated: false,
      bannerDismissedDay: '',
      dismissBanner: (bannerDismissedDay) => set({ bannerDismissedDay }),
      reset: () => set({ bannerDismissedDay: '' }),
    }),
    {
      name: 'all2me-report-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({ bannerDismissedDay: s.bannerDismissedDay }),
      onRehydrateStorage: () => () => {
        useReportPrefs.setState({ hydrated: true });
      },
    },
  ),
);
