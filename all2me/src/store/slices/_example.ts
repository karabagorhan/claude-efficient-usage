/**
 * ÖRNEK DİLİM ŞABLONU — kopyala, yeniden adlandır, doldur. Bu dosyayı içe aktarma.
 *
 * Kurallar (docs/CONTRACTS.md §6):
 *  - Dosya: src/store/slices/<ad>.ts, hook adı use<Ad>, persist anahtarı 'all2me-<ad>-v1'.
 *  - Yalnızca cihazda (senkron yok). Gün anahtarı için engine/dates `dayKeyOf()` kullan.
 *  - Kullanıcıya görünen metin SAKLAMA; i18n anahtarı ya da kullanıcı girdisi sakla.
 *  - Görev bağlantısı gerekiyorsa çekirdek store'u çağır: useCore.getState().completeLinked('drink').
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKeyOf } from '../../engine/dates';

export interface ExampleEntry {
  id: string;
  dayKey: string;
  value: number;
  at: string; // ISO
}

interface ExampleState {
  /** persist geri yüklemesi bitti mi (ekranlar ilk karede boş veri göstermesin diye) */
  hydrated: boolean;
  entries: Record<string, ExampleEntry>;
  add: (value: number, dayKey?: string) => ExampleEntry;
  remove: (id: string) => void;
  reset: () => void;
}

export const useExample = create<ExampleState>()(
  persist(
    (set) => ({
      hydrated: false,
      entries: {},
      add: (value, dayKey) => {
        const e: ExampleEntry = {
          id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          dayKey: dayKey ?? dayKeyOf(),
          value,
          at: new Date().toISOString(),
        };
        set((s) => ({ entries: { ...s.entries, [e.id]: e } }));
        return e;
      },
      remove: (id) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[id];
          return { entries };
        }),
      reset: () => set({ entries: {} }),
    }),
    {
      name: 'all2me-example-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // fonksiyonları ve hydrated bayrağını saklama
      partialize: (s) => ({ entries: s.entries }),
      onRehydrateStorage: () => () => {
        useExample.setState({ hydrated: true });
      },
    },
  ),
);

// Seçici örneği (bileşende: const total = useExample(selectTodayTotal);) — ilkel değer döndür.
export const selectTodayTotal = (s: ExampleState) =>
  Object.values(s.entries)
    .filter((e) => e.dayKey === dayKeyOf())
    .reduce((a, e) => a + e.value, 0);
