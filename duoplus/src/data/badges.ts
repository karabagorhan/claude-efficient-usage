/** Rozet tanımları. Kontrol mantığı src/engine/badges.ts içinde. */
export type Tier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  tier: Tier;
  hidden?: boolean;
}

export const BADGES: BadgeDef[] = [
  // Seri
  { id: 'streak3', name: 'Isınma', desc: 'Bir görevde 3 gün seri', emoji: '🔥', tier: 'bronze' },
  { id: 'streak7', name: 'Haftalık Ateş', desc: 'Bir görevde 7 gün seri', emoji: '🔥', tier: 'silver' },
  { id: 'streak30', name: 'Demir İrade', desc: 'Bir görevde 30 gün seri', emoji: '🔥', tier: 'gold' },
  { id: 'streak100', name: 'Yüz Gün', desc: 'Bir görevde 100 gün seri', emoji: '🔥', tier: 'legendary' },
  // Puan
  { id: 'sp500', name: 'İlk 500', desc: 'Toplam 500 puan', emoji: '⭐', tier: 'bronze' },
  { id: 'sp2500', name: 'Yıldız Avcısı', desc: 'Toplam 2.500 puan', emoji: '🌟', tier: 'silver' },
  { id: 'sp10000', name: 'Puan Makinesi', desc: 'Toplam 10.000 puan', emoji: '💫', tier: 'gold' },
  { id: 'sp50000', name: 'Efsanevi Skor', desc: 'Toplam 50.000 puan', emoji: '👑', tier: 'legendary' },
  // Seviye
  { id: 'lvl5', name: 'Düzenli', desc: 'Seviye 5', emoji: '🎖️', tier: 'bronze' },
  { id: 'lvl10', name: 'Azimli', desc: 'Seviye 10', emoji: '🥈', tier: 'silver' },
  { id: 'lvl20', name: 'Disiplinli', desc: 'Seviye 20', emoji: '🥇', tier: 'gold' },
  { id: 'lvl50', name: 'Efsane', desc: 'Seviye 50', emoji: '🏆', tier: 'legendary' },
  // Disiplin
  { id: 'first', name: 'İlk Adım', desc: 'İlk görevini tamamla', emoji: '👣', tier: 'bronze' },
  { id: 'perfect1', name: 'Mükemmel Gün', desc: 'Bir günü %100 bitir', emoji: '✨', tier: 'bronze' },
  { id: 'perfect7', name: 'Mükemmel Hafta', desc: '7 mükemmel gün', emoji: '💎', tier: 'silver' },
  { id: 'perfect30', name: 'Kusursuz', desc: '30 mükemmel gün', emoji: '💎', tier: 'gold' },
  { id: 'early10', name: 'Erkenci', desc: '10 erken tamamlama', emoji: '🐦', tier: 'bronze' },
  { id: 'tasks100', name: 'Yüzlük', desc: '100 görev tamamla', emoji: '💯', tier: 'silver' },
  { id: 'tasks1000', name: 'Bin Görev', desc: '1.000 görev tamamla', emoji: '🚀', tier: 'gold' },
  { id: 'night', name: 'Gece Kuşu', desc: '00:00-03:00 arası bir görev tamamla', emoji: '🦉', tier: 'bronze', hidden: true },
  // Rekabet
  { id: 'dayWin', name: 'Günün Şampiyonu', desc: 'Bir günü partnerinden önde kapat', emoji: '🥇', tier: 'bronze' },
  { id: 'weekWin', name: 'Haftanın Yıldızı', desc: 'Bir haftayı kazan', emoji: '🌠', tier: 'silver' },
  { id: 'monthWin', name: 'Ayın Efsanesi', desc: 'Bir ayı kazan', emoji: '🏅', tier: 'gold' },
  { id: 'dayWin10', name: 'Rekabetçi', desc: '10 gün kazan', emoji: '⚔️', tier: 'silver' },
  { id: 'comeback', name: 'Geri Dönüş', desc: 'Önceki hafta kaybettikten sonra haftayı kazan', emoji: '🔄', tier: 'silver', hidden: true },
  // Sosyal
  { id: 'paired', name: 'İkili', desc: 'Partnerinle eşleş', emoji: '🤝', tier: 'bronze' },
  { id: 'nudge1', name: 'Hatırlatıcı', desc: 'Partnerini dürt', emoji: '👉', tier: 'bronze' },
  { id: 'cheer10', name: 'Pohpohlayıcı', desc: '10 tebrik gönder', emoji: '🎉', tier: 'silver' },
  { id: 'together10', name: 'Takım Ruhu', desc: '10 "Birlikte" görevi tamamla', emoji: '💞', tier: 'silver' },
  // Ruh hali
  { id: 'mood7', name: 'Duygu Günlüğü', desc: '7 gün ruh hali kaydet', emoji: '😊', tier: 'bronze' },
  { id: 'journal10', name: 'Yazar', desc: '10 günlük notu yaz', emoji: '📝', tier: 'silver' },
  { id: 'focus10', name: 'Odak Ustası', desc: '10 odak seansı bitir', emoji: '🍅', tier: 'silver' },
  { id: 'breath10', name: 'Derin Nefes', desc: '10 nefes egzersizi bitir', emoji: '🌬️', tier: 'bronze' },
];

export const TIER_COLOR: Record<Tier, string> = {
  bronze: '#B45309',
  silver: '#64748B',
  gold: '#CA8A04',
  legendary: '#7C3AED',
};
