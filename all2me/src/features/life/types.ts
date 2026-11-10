// Yaşam takibi ortak tipleri (saf TS; RN bağımlılığı yok).
export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP';
export const CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'GBP'];
export const CURRENCY_SYMBOL: Record<Currency, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };

export type SmokeTrigger = 'stress' | 'coffee' | 'meal' | 'social' | 'boredom' | 'habit' | 'alcohol';
export const SMOKE_TRIGGERS: SmokeTrigger[] = ['stress', 'coffee', 'meal', 'social', 'boredom', 'habit', 'alcohol'];
export const TRIGGER_EMOJI: Record<SmokeTrigger, string> = {
  stress: '😤',
  coffee: '☕',
  meal: '🍽️',
  social: '👥',
  boredom: '😐',
  habit: '🔁',
  alcohol: '🍷',
};

export interface SmokePlan {
  startPerDay: number;
  goalPerDay: number;
  /** limit her N günde 1 azalır */
  everyDays: number;
  startDay: string;
}
export interface SmokePricing {
  packPrice: number;
  packSize: number;
  currency: Currency;
}
export interface SmokeLog {
  id: string;
  dayKey: string;
  at: string; // ISO
  trigger?: SmokeTrigger;
}
export interface SmokeResist {
  id: string;
  dayKey: string;
  at: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export type MealKind = 'home' | 'healthy' | 'fast' | 'skipped';
export const MEAL_KINDS: MealKind[] = ['home', 'healthy', 'fast', 'skipped'];
export const MEAL_KIND_EMOJI: Record<MealKind, string> = { home: '🏠', healthy: '🥗', fast: '🍔', skipped: '⏭️' };
export interface MealEntry {
  id: string;
  dayKey: string;
  slot: MealSlot;
  kind: MealKind;
  note?: string;
  amount?: number;
  at: string;
}

export type ChoreArea = 'kitchen' | 'bath' | 'bedroom' | 'living' | 'general' | 'laundry';
export const CHORE_AREAS: ChoreArea[] = ['kitchen', 'bath', 'bedroom', 'living', 'general', 'laundry'];
export const AREA_EMOJI: Record<ChoreArea, string> = { kitchen: '🍳', bath: '🛁', bedroom: '🛏️', living: '🛋️', general: '🏠', laundry: '🧺' };
export interface Chore {
  id: string;
  /** varsayılan iş anahtarı (data/chores.ts); özel işte yok */
  key?: string;
  /** özel iş adı */
  name?: string;
  emoji: string;
  area: ChoreArea;
  every: number;
  createdDay: string;
  /** hiç yapılmadıysa ilk vade günü */
  firstDue?: string;
  lastDone?: string;
  snoozeUntil?: string;
  postponed: number;
  doneCount: number;
}
export interface ChoreLog {
  id: string;
  choreId: string;
  dayKey: string;
  at: string;
}
