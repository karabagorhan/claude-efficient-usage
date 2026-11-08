import type { Difficulty, Habit, HabitKind } from '../engine/types';

export interface Template {
  no: number;
  title: string;
  icon: string;
  category: string;
  difficulty: Difficulty;
  kind: HabitKind;
  target?: number;
  step?: number;
  weeklyQuota?: number;
  together?: boolean;
  isPrivate?: boolean;
  dueTime?: string;
}

export const CATEGORIES = [
  { id: 'Sabah', icon: '🌅', color: '#F59E0B' },
  { id: 'Akşam', icon: '🌙', color: '#6366F1' },
  { id: 'Sağlık', icon: '💧', color: '#06B6D4' },
  { id: 'Odak', icon: '🎯', color: '#EF4444' },
  { id: 'Spor', icon: '🏋️', color: '#10B981' },
  { id: 'Uyku', icon: '😴', color: '#8B5CF6' },
  { id: 'Zihin ve İlişki', icon: '💌', color: '#EC4899' },
  { id: 'Ev ve Finans', icon: '🧺', color: '#64748B' },
  { id: 'Efsane', icon: '🏔️', color: '#F97316' },
] as const;

export const categoryColor = (id: string) => CATEGORIES.find((c) => c.id === id)?.color ?? '#6366F1';

const T = (
  no: number, category: string, title: string, icon: string, difficulty: Difficulty,
  kind: HabitKind = 'check', extra: Partial<Template> = {},
): Template => ({ no, category, title, icon, difficulty, kind, ...extra });

export const TEMPLATES: Template[] = [
  // Sabah
  T(1, 'Sabah', 'Yatağı topla', '🛏️', 'mini'),
  T(2, 'Sabah', 'Güne bir bardak suyla başla', '💧', 'mini'),
  T(3, 'Sabah', 'Hedef saatte kalk', '⏰', 'medium', 'check', { dueTime: '07:30' }),
  T(4, 'Sabah', 'Sabah esnemesi (5 dk)', '🧘', 'easy', 'timer', { target: 5 }),
  T(5, 'Sabah', 'Güne niyet yaz (1-2 cümle)', '📓', 'easy'),
  T(6, 'Sabah', 'Dengeli kahvaltı yap', '🍳', 'easy'),
  // Akşam
  T(7, 'Akşam', 'Yarının çantasını/kıyafetini hazırla', '🎒', 'easy'),
  T(8, 'Akşam', 'Mutfağı topla', '🍽️', 'easy', 'check', { together: true }),
  T(9, 'Akşam', '10 dakikalık ev toplama', '🧹', 'medium', 'timer', { target: 10 }),
  T(10, 'Akşam', 'Gün sonu yansıması (3 şükür)', '🌙', 'easy'),
  T(11, 'Akşam', 'Yatmadan 30 dk önce ekranı kapat', '📵', 'medium'),
  T(12, 'Akşam', 'Cilt bakımı', '🧴', 'mini'),
  // Sağlık
  T(13, 'Sağlık', '8 bardak su iç', '💧', 'easy', 'counter', { target: 8, step: 1 }),
  T(14, 'Sağlık', 'Vitamin/ilaç al', '💊', 'mini', 'check', { isPrivate: true }),
  T(15, 'Sağlık', '5 porsiyon meyve-sebze', '🥗', 'medium', 'counter', { target: 5, step: 1 }),
  T(16, 'Sağlık', 'Şekerli içecek içme', '🥤', 'easy'),
  T(17, 'Sağlık', 'Diş ipi / ağız bakımı', '🦷', 'mini'),
  T(18, 'Sağlık', '15 dk dışarıda güneş al', '☀️', 'easy', 'timer', { target: 15 }),
  T(19, 'Sağlık', '14:00 sonrası kafein kesme', '☕', 'easy'),
  // Odak
  T(20, 'Odak', '25 dk odak (pomodoro)', '🍅', 'medium', 'timer', { target: 25 }),
  T(21, 'Odak', '90 dk derin çalışma', '🎯', 'hard', 'timer', { target: 90 }),
  T(22, 'Odak', 'Günün en önemli 1 işini bitir', '✅', 'medium'),
  T(23, 'Odak', '20 sayfa kitap oku', '📖', 'medium', 'counter', { target: 20, step: 5 }),
  T(24, 'Odak', '15 dk yeni bir şey öğren', '🎓', 'medium', 'timer', { target: 15 }),
  T(25, 'Odak', 'Telefonsuz 1 saat', '📴', 'easy', 'timer', { target: 60 }),
  T(26, 'Odak', 'Gelen kutusunu / planı gözden geçir', '📥', 'mini'),
  // Spor
  T(27, 'Spor', '20 dk yürüyüş', '🚶', 'medium', 'timer', { target: 20 }),
  T(28, 'Spor', '10.000 adım', '👟', 'medium', 'counter', { target: 10000, step: 1000 }),
  T(29, 'Spor', '40 dk antrenman', '🏋️', 'hard', 'timer', { target: 40, weeklyQuota: 3 }),
  T(30, 'Spor', '5 km koşu', '🏃', 'hard', 'check', { weeklyQuota: 2 }),
  T(31, 'Spor', '10 dk esneme / mobilite', '🤸', 'easy', 'timer', { target: 10 }),
  // Uyku
  T(32, 'Uyku', 'Hedef saatte yat (±30 dk)', '🛌', 'medium', 'check', { dueTime: '23:30' }),
  T(33, 'Uyku', '7 saat+ uyu', '😴', 'medium'),
  T(34, 'Uyku', '5 dk nefes egzersizi', '🌬️', 'easy', 'timer', { target: 5 }),
  // Zihin ve İlişki
  T(35, 'Zihin ve İlişki', '10 dk meditasyon', '🧠', 'medium', 'timer', { target: 10 }),
  T(36, 'Zihin ve İlişki', 'Partnerine güzel bir mesaj yaz', '💌', 'mini'),
  T(37, 'Zihin ve İlişki', 'Akşam birlikte yürüyüş', '🌆', 'medium', 'check', { together: true }),
  T(38, 'Zihin ve İlişki', 'Telefonsuz birlikte yemek', '🍲', 'easy', 'check', { together: true }),
  T(39, 'Zihin ve İlişki', 'Bir yakınını ara', '📞', 'easy', 'check', { weeklyQuota: 3 }),
  // Ev ve Finans
  T(40, 'Ev ve Finans', 'Harcamaları kaydet', '💳', 'easy'),
  T(41, 'Ev ve Finans', 'Bir ev işini bitir', '🧺', 'easy'),
  T(42, 'Ev ve Finans', 'Haftalık market / liste planı', '🛒', 'medium', 'check', { weeklyQuota: 1 }),
  // Efsane
  T(43, 'Efsane', 'Haftalık yemek hazırlığı', '🍱', 'epic', 'check', { weeklyQuota: 1, together: true }),
  T(44, 'Efsane', '2 saatlik doğa yürüyüşü', '🥾', 'epic', 'check', { weeklyQuota: 1, together: true }),
];

export interface Pack {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  items: number[];
}

export const PACKS: Pack[] = [
  { id: 'sabah', name: 'Sabah Işığı', emoji: '🌅', blurb: 'Güne enerjik başla', items: [1, 2, 3, 4, 5, 6] },
  { id: 'aksam', name: 'Akşam Yavaşlama', emoji: '🌙', blurb: 'Günü sakince kapat', items: [7, 8, 10, 11, 12] },
  { id: 'baslangic', name: 'Sağlam Başlangıç', emoji: '🌱', blurb: 'Yeni başlayanlar için', items: [1, 13, 14, 27, 32] },
  { id: 'odak', name: 'Odak Günü', emoji: '🎯', blurb: 'Derin çalışma düzeni', items: [20, 22, 25, 26, 23] },
  { id: 'spor', name: 'Spor Haftası', emoji: '💪', blurb: 'Hareketli bir hafta', items: [29, 28, 31] },
  { id: 'uyku', name: 'Uyku Düzeni', emoji: '😴', blurb: 'Daha iyi uyku için', items: [11, 19, 32, 34] },
  { id: 'cift', name: 'Çift Paketi', emoji: '💞', blurb: 'Birlikte yapılacaklar', items: [36, 37, 38, 43] },
];

/** Onboarding "hedef" sorusu -> önerilen paketler (Me+ tarzı kişiselleştirme) */
export const GOALS: Array<{ id: string; label: string; emoji: string; packs: string[] }> = [
  { id: 'energy', label: 'Daha enerjik olmak', emoji: '⚡', packs: ['sabah', 'baslangic'] },
  { id: 'focus', label: 'Daha odaklı çalışmak', emoji: '🎯', packs: ['odak'] },
  { id: 'fit', label: 'Forma girmek', emoji: '💪', packs: ['spor', 'baslangic'] },
  { id: 'sleep', label: 'Daha iyi uyumak', emoji: '😴', packs: ['uyku', 'aksam'] },
  { id: 'calm', label: 'Stresi azaltmak', emoji: '🧘', packs: ['aksam'] },
  { id: 'love', label: 'İlişkimizi güçlendirmek', emoji: '💞', packs: ['cift'] },
];

export const HABIT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B',
];

export const HABIT_EMOJIS = [
  '💧', '🏃', '🧘', '📖', '💤', '🥗', '💊', '🧹', '🎯', '🎨',
  '🎸', '✍️', '🧠', '🌿', '🐕', '☕', '🦷', '🚴', '🏊', '🧺',
  '💰', '📞', '🙏', '🌞', '🍎', '🛁', '📵', '🧴', '🎓', '💻',
];

export function templateToHabit(t: Template, color: string): Omit<Habit, 'id' | 'createdAt' | 'archived' | 'ownerId'> {
  return {
    title: t.title,
    icon: t.icon,
    color,
    category: t.category,
    difficulty: t.difficulty,
    kind: t.kind,
    target: t.target,
    step: t.step,
    schedule: t.weeklyQuota ? { days: [], weeklyQuota: t.weeklyQuota } : { days: [] },
    dueTime: t.dueTime,
    reminderTime: undefined,
    isPrivate: Boolean(t.isPrivate),
    together: Boolean(t.together),
  };
}

