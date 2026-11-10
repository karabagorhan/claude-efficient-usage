// Varsayılan ev işleri (iki dilli; alan + tekrar aralığı gün).
import { addDays } from '../engine/dates';
import type { Loc } from '../engine/types';
import type { Chore, ChoreArea } from '../features/life/types';

export interface DefaultChore {
  key: string;
  emoji: string;
  area: ChoreArea;
  every: number;
  name: Loc;
}

const l = (tr: string, en: string): Loc => ({ tr, en });

export const DEFAULT_CHORES: DefaultChore[] = [
  // Mutfak
  { key: 'dish-hand', emoji: '🍽️', area: 'kitchen', every: 1, name: l('Bulaşıkları yıka', 'Wash the dishes') },
  { key: 'dish-run', emoji: '🫧', area: 'kitchen', every: 2, name: l('Bulaşık makinesini çalıştır', 'Run the dishwasher') },
  { key: 'dish-empty', emoji: '🥣', area: 'kitchen', every: 2, name: l('Bulaşık makinesini boşalt', 'Empty the dishwasher') },
  { key: 'counter', emoji: '🧽', area: 'kitchen', every: 1, name: l('Tezgâhı sil', 'Wipe the counters') },
  { key: 'trash', emoji: '🗑️', area: 'kitchen', every: 2, name: l('Çöpü çıkar', 'Take out the trash') },
  { key: 'fridge', emoji: '🧊', area: 'kitchen', every: 14, name: l('Buzdolabını temizle', 'Clean the fridge') },
  { key: 'oven', emoji: '♨️', area: 'kitchen', every: 30, name: l('Ocak ve fırını temizle', 'Clean the stove and oven') },
  // Banyo
  { key: 'bath', emoji: '🛁', area: 'bath', every: 7, name: l('Banyoyu temizle', 'Clean the bathroom') },
  { key: 'toilet', emoji: '🚽', area: 'bath', every: 7, name: l('Klozeti temizle', 'Clean the toilet') },
  { key: 'towels', emoji: '🧖', area: 'bath', every: 7, name: l('Havluları değiştir', 'Swap the towels') },
  // Yatak odası
  { key: 'sheets', emoji: '🛏️', area: 'bedroom', every: 14, name: l('Çarşafları değiştir', 'Change the bed sheets') },
  { key: 'wardrobe', emoji: '👚', area: 'bedroom', every: 30, name: l('Dolabı düzenle', 'Tidy the wardrobe') },
  // Salon
  { key: 'vacuum', emoji: '🧹', area: 'living', every: 4, name: l('Süpür / elektrikli süpürge', 'Sweep or vacuum') },
  { key: 'mop', emoji: '🪣', area: 'living', every: 7, name: l('Paspas yap', 'Mop the floors') },
  { key: 'dust', emoji: '🪶', area: 'living', every: 7, name: l('Toz al', 'Dust the surfaces') },
  { key: 'windows', emoji: '🪟', area: 'living', every: 30, name: l('Camları sil', 'Clean the windows') },
  // Genel
  { key: 'plants', emoji: '🪴', area: 'general', every: 3, name: l('Bitkileri sula', 'Water the plants') },
  { key: 'recycle', emoji: '♻️', area: 'general', every: 7, name: l('Geri dönüşümü çıkar', 'Take out the recycling') },
  { key: 'shopping', emoji: '🛒', area: 'general', every: 7, name: l('Market alışverişi', 'Grocery shopping') },
  // Çamaşır
  { key: 'laundry-wash', emoji: '🫧', area: 'laundry', every: 4, name: l('Çamaşır yıka', 'Wash the laundry') },
  { key: 'laundry-dry', emoji: '👕', area: 'laundry', every: 4, name: l('Çamaşırı as / kurut', 'Hang or dry the laundry') },
  { key: 'laundry-fold', emoji: '🧺', area: 'laundry', every: 4, name: l('Çamaşırı katla', 'Fold the laundry') },
  { key: 'laundry-put', emoji: '🧦', area: 'laundry', every: 4, name: l('Çamaşırı yerleştir', 'Put the laundry away') },
  { key: 'iron', emoji: '👔', area: 'laundry', every: 7, name: l('Ütü yap', 'Do the ironing') },
];

export const DEFAULT_BY_KEY: Record<string, DefaultChore> = Object.fromEntries(DEFAULT_CHORES.map((c) => [c.key, c]));

/** Varsayılan işleri kurar; ilk vadeler yayılır ki hepsi aynı güne yığılmasın. */
export function seedChores(day: string): Record<string, Chore> {
  const out: Record<string, Chore> = {};
  DEFAULT_CHORES.forEach((d, i) => {
    const id = `d:${d.key}`;
    out[id] = {
      id,
      key: d.key,
      emoji: d.emoji,
      area: d.area,
      every: d.every,
      createdDay: day,
      firstDue: addDays(day, i % Math.min(d.every, 6)),
      postponed: 0,
      doneCount: 0,
    };
  });
  return out;
}
