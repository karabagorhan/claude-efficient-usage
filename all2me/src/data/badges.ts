/** Rozet tanımları (iki dilli). Kontrol mantığı src/engine/badges.ts içinde. */
import type { Loc } from '../engine/types';

export type Tier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface BadgeDef {
  id: string;
  name: Loc;
  desc: Loc;
  emoji: string;
  tier: Tier;
  hidden?: boolean;
}

const b = (id: string, emoji: string, tier: Tier, trName: string, enName: string, trDesc: string, enDesc: string, hidden?: boolean): BadgeDef => ({
  id,
  emoji,
  tier,
  name: { tr: trName, en: enName },
  desc: { tr: trDesc, en: enDesc },
  ...(hidden ? { hidden } : {}),
});

export const BADGES: BadgeDef[] = [
  // Seri
  b('streak3', '🔥', 'bronze', 'Isınma', 'Warming Up', 'Bir görevde 3 gün seri', '3-day streak on a task'),
  b('streak7', '🔥', 'silver', 'Haftalık Ateş', 'Week on Fire', 'Bir görevde 7 gün seri', '7-day streak on a task'),
  b('streak30', '🔥', 'gold', 'Demir İrade', 'Iron Will', 'Bir görevde 30 gün seri', '30-day streak on a task'),
  b('streak100', '🔥', 'legendary', 'Yüz Gün', 'Hundred Days', 'Bir görevde 100 gün seri', '100-day streak on a task'),
  // Puan
  b('sp500', '⭐', 'bronze', 'İlk 500', 'First 500', 'Toplam 500 puan', '500 points in total'),
  b('sp2500', '🌟', 'silver', 'Yıldız Avcısı', 'Star Hunter', 'Toplam 2.500 puan', '2,500 points in total'),
  b('sp10000', '💫', 'gold', 'Puan Makinesi', 'Point Machine', 'Toplam 10.000 puan', '10,000 points in total'),
  b('sp50000', '👑', 'legendary', 'Efsanevi Skor', 'Legendary Score', 'Toplam 50.000 puan', '50,000 points in total'),
  // Seviye
  b('lvl5', '🎖️', 'bronze', 'Düzenli', 'Regular', 'Seviye 5', 'Reach level 5'),
  b('lvl10', '🥈', 'silver', 'Azimli', 'Determined', 'Seviye 10', 'Reach level 10'),
  b('lvl20', '🥇', 'gold', 'Disiplinli', 'Disciplined', 'Seviye 20', 'Reach level 20'),
  b('lvl50', '🏆', 'legendary', 'Efsane', 'Legend', 'Seviye 50', 'Reach level 50'),
  // Disiplin
  b('first', '👣', 'bronze', 'İlk Adım', 'First Step', 'İlk görevini tamamla', 'Complete your first task'),
  b('perfect1', '✨', 'bronze', 'Mükemmel Gün', 'Perfect Day', 'Bir günü %100 bitir', 'Finish a day at 100%'),
  b('perfect7', '💎', 'silver', 'Mükemmel Hafta', 'Perfect Week', '7 mükemmel gün', '7 perfect days'),
  b('perfect30', '💎', 'gold', 'Kusursuz', 'Flawless', '30 mükemmel gün', '30 perfect days'),
  b('early10', '🐦', 'bronze', 'Erkenci', 'Early Bird', '10 erken tamamlama', '10 early completions'),
  b('tasks100', '💯', 'silver', 'Yüzlük', 'Centurion', '100 görev tamamla', 'Complete 100 tasks'),
  b('tasks1000', '🚀', 'gold', 'Bin Görev', 'Thousand Tasks', '1.000 görev tamamla', 'Complete 1,000 tasks'),
  b('night', '🦉', 'bronze', 'Gece Kuşu', 'Night Owl', '00:00-03:00 arası bir görev tamamla', 'Complete a task between 00:00 and 03:00', true),
  // Rekabet
  b('dayWin', '🥇', 'bronze', 'Günün Şampiyonu', 'Champion of the Day', 'Bir günü partnerinden önde kapat', 'Finish a day ahead of your partner'),
  b('weekWin', '🌠', 'silver', 'Haftanın Yıldızı', 'Star of the Week', 'Bir haftayı kazan', 'Win a week'),
  b('monthWin', '🏅', 'gold', 'Ayın Efsanesi', 'Legend of the Month', 'Bir ayı kazan', 'Win a month'),
  b('dayWin10', '⚔️', 'silver', 'Rekabetçi', 'Competitor', '10 gün kazan', 'Win 10 days'),
  b('comeback', '🔄', 'silver', 'Geri Dönüş', 'Comeback', 'Önceki hafta kaybettikten sonra haftayı kazan', 'Win a week right after losing one', true),
  // Sosyal
  b('paired', '🤝', 'bronze', 'İkili', 'Duo', 'Partnerinle eşleş', 'Pair with your partner'),
  b('nudge1', '👉', 'bronze', 'Hatırlatıcı', 'Reminder', 'Partnerini dürt', 'Nudge your partner'),
  b('cheer10', '🎉', 'silver', 'Pohpohlayıcı', 'Cheerleader', '10 tebrik gönder', 'Send 10 cheers'),
  b('together10', '💞', 'silver', 'Takım Ruhu', 'Team Spirit', '10 "Birlikte" görevi tamamla', 'Complete 10 "Together" tasks'),
  // Araçlar
  b('mood7', '😊', 'bronze', 'Duygu Günlüğü', 'Mood Diary', '7 gün ruh hali kaydet', 'Log your mood on 7 days'),
  b('journal10', '📝', 'silver', 'Yazar', 'Writer', '10 yansıma yaz', 'Write 10 reflections'),
  b('focus10', '🍅', 'silver', 'Odak Ustası', 'Focus Master', '10 odak seansı bitir', 'Finish 10 focus sessions'),
  b('breath10', '🌬️', 'bronze', 'Derin Nefes', 'Deep Breath', '10 meditasyon / nefes seansı bitir', 'Finish 10 meditation / breathing sessions'),
  b('daystreak7', '📅', 'silver', 'Bir Hafta Boyunca', 'All Week Long', '7 gün art arda en az bir görev', 'At least one task 7 days in a row'),
  b('wheel10', '🎡', 'bronze', 'Çarkçı', 'Wheel Spinner', '10 çark görevi tamamla', 'Complete 10 wheel tasks'),
  // Yaşam takibi
  b('smoke7', '🚭', 'silver', 'Limitte 7 Gün', '7 Days on Limit', 'Sigarada 7 günü limitinde kapat', 'Close 7 days within your smoking limit'),
  b('nofast7', '🥦', 'bronze', 'Ev Lezzeti', 'Home Flavor', 'Öğün kaydettiğin 7 günü fast food’suz geçir', 'Log meals on 7 days without fast food'),
  b('chores20', '🧹', 'bronze', 'Ev Kahramanı', 'Home Hero', '20 ev işi tamamla', 'Complete 20 chores'),
  b('study10', '🎓', 'silver', 'Çalışkan', 'Hard Worker', '10 okul öğesini bitir', 'Finish 10 school items'),
  b('goal1', '🎯', 'bronze', 'Hedef Avcısı', 'Goal Getter', 'İlk gelişim hedefini tamamla', 'Complete your first growth goal'),
];

export const TIER_COLOR: Record<Tier, string> = {
  bronze: '#B45309',
  silver: '#64748B',
  gold: '#CA8A04',
  legendary: '#7C3AED',
};
