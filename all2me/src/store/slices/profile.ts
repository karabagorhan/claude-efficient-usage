/**
 * Kişiselleştirme tercihleri (onboarding + "Rutin tipin" testi). Yalnızca cihazda.
 * Anahtar 'all2me-profile-v1'. Kullanıcıya görünen metin saklanmaz; kimlikler saklanır.
 */
import { safeJSONStorage, safeMerge } from '../safeStorage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EnergyPeak = 'morning' | 'noon' | 'evening';
export type FocusArea = 'home' | 'health' | 'smoke' | 'nutrition' | 'school' | 'career' | 'selfcare' | 'relationship';
export type RoutineType = 'planner' | 'explorer' | 'steady' | 'spark';

export interface ProfileData {
  /** 'HH:MM' ya da henüz seçilmedi */
  wake: string | null;
  sleep: string | null;
  weekendDiff: boolean;
  energyPeak: EnergyPeak | null;
  focusAreas: FocusArea[];
  routineType: RoutineType | null;
  /** Profil testi cevapları: soru sırasına göre 0 (A) / 1 (B); boş = test yapılmadı */
  quizAnswers: number[];
}

interface ProfileState extends ProfileData {
  hydrated: boolean;
  /** Birden çok alanı birden yazar (ör. onboarding sonunda). */
  save: (p: Partial<ProfileData>) => void;
  reset: () => void;
}

const empty = (): ProfileData => ({
  wake: null,
  sleep: null,
  weekendDiff: false,
  energyPeak: null,
  focusAreas: [],
  routineType: null,
  quizAnswers: [],
});

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      hydrated: false,
      ...empty(),
      save: (p) => set(p),
      reset: () => set(empty()),
    }),
    {
      name: 'all2me-profile-v1',
      version: 1,
      storage: safeJSONStorage(),
      merge: safeMerge,
      partialize: (s) => ({
        wake: s.wake,
        sleep: s.sleep,
        weekendDiff: s.weekendDiff,
        energyPeak: s.energyPeak,
        focusAreas: s.focusAreas,
        routineType: s.routineType,
        quizAnswers: s.quizAnswers,
      }),
      onRehydrateStorage: () => () => {
        useProfile.setState({ hydrated: true });
      },
    },
  ),
);
