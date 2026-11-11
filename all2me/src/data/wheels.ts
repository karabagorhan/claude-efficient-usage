/** Varsayılan çarklar (iki dilli). Her çarkta 10 dilim. */
import type { Loc } from '../i18n';

export type WheelId = 'chores' | 'selfcare' | 'move';
export const WHEEL_IDS: readonly WheelId[] = ['chores', 'selfcare', 'move'];

export interface WheelSlice {
  id: string;
  emoji: string;
  /** varsayılan dilimlerde iki dilli ad */
  name?: Loc;
  /** kullanıcının yazdığı ad (tek dilli) */
  label?: string;
}

const S = (id: string, emoji: string, tr: string, en: string): WheelSlice => ({ id, emoji, name: { tr, en } });

export const DEFAULT_WHEELS: Record<WheelId, WheelSlice[]> = {
  chores: [
    S('c1', '🧽', 'Mutfağı sil', 'Wipe Kitchen'),
    S('c2', '🗑️', 'Çöpü çıkar', 'Take Out Trash'),
    S('c3', '🧺', 'Çamaşırı yıka', 'Wash Laundry'),
    S('c4', '🌬️', 'Çamaşırı as', 'Hang Laundry'),
    S('c5', '🚰', 'Lavaboyu parlat', 'Shine the Sink'),
    S('c6', '👕', 'Çamaşırı katla', 'Fold Laundry'),
    S('c7', '🍽️', 'Bulaşık yıka', 'Wash Dishes'),
    S('c8', '🫧', 'Makineyi boşalt', 'Unload Dishes'),
    S('c9', '👟', 'Ayakkabıları sırala', 'Line Up Shoes'),
    S('c10', '🧹', 'Yeri süpür', 'Sweep Floor'),
  ],
  selfcare: [
    S('s1', '💧', 'Bir bardak su', 'Glass of Water'),
    S('s2', '🧴', 'Cilt bakımı', 'Skincare'),
    S('s3', '🛁', 'Sıcak duş', 'Warm Shower'),
    S('s4', '🧘', '5 dk nefes', '5 Min Breathing'),
    S('s5', '📖', '10 sayfa oku', 'Read 10 Pages'),
    S('s6', '📝', '3 şükran yaz', 'Write 3 Gratitudes'),
    S('s7', '🎵', 'Sevdiğin şarkı', 'Favorite Song'),
    S('s8', '🫖', 'Bitki çayı iç', 'Sip Herbal Tea'),
    S('s9', '💆', 'Omuz masajı', 'Shoulder Rub'),
    S('s10', '📵', '10 dk ekransız', '10 Min No Screen'),
  ],
  move: [
    S('m1', '🚶', '10 dk yürüyüş', '10 Min Walk'),
    S('m2', '🤸', 'Esneme', 'Stretch'),
    S('m3', '🪜', 'Merdiven çık', 'Take the Stairs'),
    S('m4', '🦵', '10 squat', '10 Squats'),
    S('m5', '💪', '10 şınav', '10 Push-ups'),
    S('m6', '🧍', '30 sn plank', '30 Sec Plank'),
    S('m7', '💃', 'Bir şarkı dans', 'Dance a Song'),
    S('m8', '🪢', '1 dk ip atla', '1 Min Jump Rope'),
    S('m9', '🏃', 'Yerinde koş', 'Jog in Place'),
    S('m10', '🧎', '10 lunge', '10 Lunges'),
  ],
};

export const MIN_SLICES = 4;
export const MAX_SLICES = 12;
