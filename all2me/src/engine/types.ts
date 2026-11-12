export type Difficulty = 'mini' | 'easy' | 'medium' | 'hard' | 'epic';
export type HabitKind = 'check' | 'counter' | 'timer';

/** Rutin ekranındaki zaman dilimi. */
export type Slot = 'morning' | 'afternoon' | 'evening' | 'anytime';
/** Tema pastel anahtarı (renk değerleri src/theme içinde). */
export type PastelKey = 'blue' | 'green' | 'purple' | 'mint' | 'peach' | 'pink' | 'yellow';
export const PASTEL_KEYS: readonly PastelKey[] = ['blue', 'green', 'purple', 'mint', 'peach', 'pink', 'yellow'];
/** Bir araca bağlı görev: araç kullanıldığında görev otomatik tamamlanır. */
export type HabitLink = 'drink' | 'mood' | 'reflection' | 'smoke' | 'meal' | 'chore' | 'study' | 'growth';
/** İki dilli içerik. */
export interface Loc {
  tr: string;
  en: string;
}

/** 0 = Pazartesi ... 6 = Pazar */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Esnek tekrar birimi. */
export type EveryUnit = 'day' | 'week' | 'month';

/**
 * Esnek tekrar: çapa (başlangıç) gününden itibaren her `n` gün / hafta / ayda bir.
 * - day: çapadan bu yana geçen gün sayısı n'nin katıysa.
 * - week: çapanın haftasından bu yana geçen hafta sayısı n'nin katıysa; o haftada `days` boşsa çapanın
 *   haftanın günü, doluysa `days` içindeki günler.
 * - month: çapadan bu yana geçen ay sayısı n'nin katıysa, ayın çapa günü (ay daha kısaysa ayın son günü:
 *   31 → Şubat'ta 28/29, Nisan'da 30).
 * Çapadan önceki günler planlı değildir.
 */
export interface Every {
  unit: EveryUnit;
  /** 1..365 */
  n: number;
  /** YYYY-MM-DD (gün anahtarı) */
  anchor: string;
}

export interface Schedule {
  /** Planlı günler. Boşsa her gün. */
  days: Weekday[];
  /** Haftalık kota (ör. haftada 3). Varsa days yok sayılır; seri birimi haftadır. */
  weeklyQuota?: number;
  /** Esnek tekrar (her N gün / hafta / ay). Varsa ve kota yoksa plan bundan hesaplanır. */
  every?: Every;
}

export interface Habit {
  id: string;
  ownerId: string;
  title: string;
  icon: string; // emoji
  /** Eski alan (duoplus). Renk için `pastel` kullanın. */
  color?: string;
  /** Serbest kategori kimliği (ör. 'home', 'selfcare'). */
  category?: string;
  slot: Slot;
  pastel: PastelKey;
  link?: HabitLink;
  /** Şablon / çark / öneri kaynağı (ör. 'inspire:clean-home', 'wheel:chores', 'newtask:suggest'). */
  source?: string;
  difficulty: Difficulty;
  kind: HabitKind;
  /** counter için hedef sayı, timer için dakika */
  target?: number;
  /** counter için tek dokunuşta artış (ör. adım için 1000) */
  step?: number;
  schedule: Schedule;
  /** HH:MM */
  reminderTime?: string;
  /** Erken bonus için hedef saat HH:MM */
  dueTime?: string;
  isPrivate: boolean;
  together: boolean;
  createdAt: string; // ISO
  archived: boolean;
  /**
   * Elle sıralama değeri (küçük önce). Rutin "elle" modunda zaman dilimi içinde bu alana göre sıralanır;
   * yeni görev en sona eklenir (en büyük + 1). Eski görevlerde yoksa oluşturulma zamanı kullanılır.
   * Senkronlanır (görev belgesinin parçası).
   */
  order?: number;
}

export interface Completion {
  id: string;
  habitId: string;
  userId: string;
  dayKey: string; // YYYY-MM-DD (gün sınırı 03:00)
  completedAt: string; // ISO
  /** Kazanılan toplam puan (bonuslar dahil) */
  points: number;
  base: number;
  multiplier: number;
  earlyBonus: number;
  /** Geri alındıysa true */
  undone?: boolean;
  /**
   * "Önceden yap": ileri tarihli gün için önceden işaretlendi. Puan 0, puan olayı yok; liderlik, seri ve
   * rozetlere SAYILMAZ (görev serisinde o gün nötrdür: ne artırır ne bozar). O gün geldiğinde tamamlanmış görünür.
   */
  advance?: boolean;
}

/** Puan / seri / rozet hesabına giren tamamlama: geri alınmamış ve önceden işaretlenmemiş. */
export const countsForScore = (c: Pick<Completion, 'undone' | 'advance'>) => !c.undone && !c.advance;

export interface PointEvent {
  id: string;
  userId: string;
  dayKey: string;
  type:
    | 'completion'
    | 'perfect_day'
    | 'almost_perfect'
    | 'weekly_bonus'
    | 'badge'
    | 'champion'
    | 'nudge'
    | 'penalty'
    /** Görev dışı puan (çark, şanslı görev...) — awardBonus */
    | 'bonus';
  points: number;
  refId?: string;
  createdAt: string;
  /** Kullanıcı içeriği olan düz metin (ör. görev adı). Çevrilmez. */
  label?: string;
  /** i18n anahtarı (ör. 'points.event.perfect_day'). Varsa label yerine bu çevrilir. */
  labelKey?: string;
  labelParams?: Record<string, string | number>;
  /** awardBonus günlük tavan grubu (ör. 'wheel'). */
  group?: string;
}

export type Period = 'day' | 'week' | 'month';

/** Liderlik puanına sayılmayan (yalnızca XP veren) olay türleri */
export const XP_ONLY_TYPES: ReadonlyArray<PointEvent['type']> = ['champion', 'badge'];
export const isScoreEvent = (e: Pick<PointEvent, 'type'>) => !XP_ONLY_TYPES.includes(e.type);
