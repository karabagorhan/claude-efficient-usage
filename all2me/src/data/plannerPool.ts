/** Akıllı planlayıcı görev havuzu (iki dilli, etiketli). */
import type { Loc } from '../engine/types';

export type PlanArea = 'home' | 'work' | 'study' | 'health' | 'wellness' | 'self';
export type PlanBlock = 'morning' | 'afternoon' | 'evening';
/** 1 = kolay (düşük enerjiyle yapılır), 2 = orta, 3 = yoğun */
export type Effort = 1 | 2 | 3;

export interface PoolTask {
  id: string;
  emoji: string;
  title: Loc;
  area: PlanArea;
  effort: Effort;
  /** tahmini süre (dk) */
  minutes: number;
  /** uygun zaman dilimleri */
  parts: PlanBlock[];
}

const P: Record<string, PlanBlock> = { m: 'morning', a: 'afternoon', e: 'evening' };
const T = (id: string, emoji: string, tr: string, en: string, area: PlanArea, effort: Effort, minutes: number, parts: string): PoolTask => ({
  id,
  emoji,
  title: { tr, en },
  area,
  effort,
  minutes,
  parts: parts.split('').map((c) => P[c]),
});

export const PLANNER_POOL: PoolTask[] = [
  // ev
  T('h1', '🛏️', 'Yatağı topla', 'Make the bed', 'home', 1, 3, 'm'),
  T('h2', '🍳', 'Kahvaltı bulaşıklarını yıka', 'Do the breakfast dishes', 'home', 1, 10, 'm'),
  T('h3', '🪟', 'Odayı havalandır', 'Air out the room', 'home', 1, 2, 'm'),
  T('h4', '🧺', 'Çamaşır makinesini çalıştır', 'Start a laundry load', 'home', 1, 5, 'ma'),
  T('h5', '🧹', 'Yeri süpür', 'Sweep the floor', 'home', 2, 10, 'a'),
  T('h6', '🗑️', 'Çöpü çıkar', 'Take out the trash', 'home', 1, 4, 'ae'),
  T('h7', '🍝', 'Akşam yemeği hazırla', 'Prepare dinner', 'home', 2, 30, 'ae'),
  T('h8', '🧽', 'Mutfak tezgâhını sil', 'Wipe the kitchen counters', 'home', 1, 5, 'ae'),
  T('h9', '👕', 'Çamaşırları katla', 'Fold the laundry', 'home', 1, 12, 'ae'),
  T('h10', '🚿', 'Banyoyu toparla', 'Tidy the bathroom', 'home', 2, 15, 'a'),
  T('h11', '🍽️', 'Bulaşık makinesini yerleştir', 'Load the dishwasher', 'home', 1, 6, 'ae'),
  T('h12', '🌿', 'Bitkileri sula', 'Water the plants', 'home', 1, 3, 'ma'),
  T('h13', '🛋️', 'Salonu topla', 'Tidy the living room', 'home', 1, 10, 'ae'),
  T('h14', '🛒', 'Alışveriş listesi yaz', 'Write a shopping list', 'home', 1, 5, 'e'),
  T('h15', '🪣', 'Zemini paspasla', 'Mop the floor', 'home', 3, 20, 'a'),
  T('h16', '🎒', 'Yarının çantasını hazırla', "Pack tomorrow's bag", 'home', 1, 5, 'e'),
  T('h17', '🗄️', 'Bir çekmeceyi düzenle', 'Organize one drawer', 'home', 3, 15, 'a'),
  // iş / ders
  T('w1', '✅', 'Günün 3 önceliğini yaz', 'Write your top 3 priorities', 'work', 1, 5, 'm'),
  T('w2', '📧', 'E-postalara göz at', 'Check your emails', 'work', 1, 10, 'ma'),
  T('w3', '🎯', 'Derin odak bloğu', 'Deep focus block', 'work', 3, 45, 'ma'),
  T('w4', '📚', 'Ders notlarını gözden geçir', 'Review your study notes', 'study', 2, 20, 'ma'),
  T('w5', '🗓️', 'Takvime göz at', 'Glance at your calendar', 'work', 1, 3, 'm'),
  T('w6', '📝', 'Küçük bir işi bitir', 'Finish one small task', 'work', 2, 15, 'a'),
  T('w7', '🍅', '25 dk pomodoro', '25-min pomodoro', 'work', 2, 25, 'ma'),
  T('w8', '📞', 'Bir mesaja geri dön', 'Reply to one message', 'work', 1, 5, 'a'),
  T('w9', '🧠', 'Yeni bir şey öğren', 'Learn something new', 'work', 2, 20, 'ae'),
  T('w10', '🗂️', 'Masanı topla', 'Tidy your desk', 'work', 1, 5, 'ae'),
  T('w11', '📖', '20 dk ders okuması', '20 min of study reading', 'study', 2, 20, 'ae'),
  T('w12', '✍️', 'Günün özetini yaz', 'Write a short day recap', 'work', 1, 5, 'e'),
  T('w13', '📋', 'Yarını planla', 'Plan tomorrow', 'work', 1, 8, 'e'),
  T('w14', '🧩', 'En zor işe başla', 'Start the hardest task', 'work', 3, 30, 'ma'),
  T('w15', '💻', 'Dosyalarını düzenle', 'Organize your files', 'work', 2, 15, 'a'),
  T('w16', '🔁', 'Soru çözümü yap', 'Solve practice questions', 'study', 3, 25, 'ae'),
  // sağlık
  T('x1', '💧', 'Bir bardak su iç', 'Drink a glass of water', 'health', 1, 2, 'm'),
  T('x2', '🥗', 'Dengeli bir öğle yemeği ye', 'Eat a balanced lunch', 'health', 1, 20, 'a'),
  T('x3', '🚶', '10 dk yürüyüş', '10-min walk', 'health', 1, 10, 'mae'),
  T('x4', '🤸', 'Esneme hareketleri', 'Stretching', 'health', 1, 8, 'me'),
  T('x5', '💊', 'Vitaminini al', 'Take your vitamins', 'health', 1, 2, 'm'),
  T('x6', '🏋️', 'Kısa egzersiz', 'Quick workout', 'health', 3, 20, 'mae'),
  T('x7', '🍎', 'Bir meyve ye', 'Eat a piece of fruit', 'health', 1, 3, 'a'),
  T('x8', '🧘', '5 dk nefes çalışması', '5-min breathing', 'health', 1, 5, 'mae'),
  T('x9', '🪜', 'Merdivenleri kullan', 'Take the stairs', 'health', 2, 3, 'a'),
  T('x10', '🧍', 'Ayağa kalk ve gerin', 'Stand up and stretch', 'health', 1, 3, 'a'),
  T('x11', '😴', 'Uyku öncesi sakinleşme', 'Wind-down before sleep', 'health', 1, 15, 'e'),
  T('x12', '🪥', 'Dişlerini fırçala', 'Brush your teeth', 'health', 1, 5, 'e'),
  T('x13', '🏃', 'Hafif tempoda koş', 'Light jog', 'health', 3, 25, 'me'),
  T('x14', '🥤', 'Su şişeni doldur', 'Refill your water bottle', 'health', 1, 2, 'a'),
  T('x15', '🌞', 'Gün ışığına çık', 'Get some daylight', 'health', 1, 10, 'ma'),
  T('x16', '🍵', 'Bitki çayı molası', 'Herbal tea break', 'health', 1, 5, 'ae'),
  // kendime bakım
  T('k1', '📖', '10 sayfa oku', 'Read 10 pages', 'self', 1, 15, 'e'),
  T('k2', '🙏', '3 şükran yaz', 'Write 3 gratitudes', 'self', 1, 4, 'me'),
  T('k3', '🧴', 'Cilt bakımı', 'Skincare routine', 'self', 1, 8, 'me'),
  T('k4', '🎵', 'Sevdiğin bir şarkıyı aç', 'Play a favorite song', 'self', 1, 4, 'ma'),
  T('k5', '🛁', 'Sıcak bir duş al', 'Take a warm shower', 'self', 1, 12, 'me'),
  T('k6', '🧘‍♀️', 'Meditasyon yap', 'Meditate', 'self', 2, 10, 'me'),
  T('k7', '💌', 'Birine güzel bir mesaj at', 'Send someone a kind message', 'self', 1, 3, 'ma'),
  T('k8', '🎨', 'Hobine vakit ayır', 'Spend time on a hobby', 'self', 2, 30, 'e'),
  T('k9', '📵', 'Ekransız mola ver', 'Take a screen-free break', 'self', 1, 10, 'ae'),
  T('k10', '💭', 'Ruh halini kaydet', 'Log your mood', 'self', 1, 2, 'e'),
  T('k11', '🕯️', 'Sakin bir köşede dinlen', 'Relax in a quiet corner', 'self', 1, 10, 'e'),
  T('k12', '☕', 'Keyifli bir kahve molası', 'Enjoy a calm coffee break', 'self', 1, 10, 'ma'),
  T('k13', '🌬️', 'Kutu nefesi', 'Box breathing', 'self', 1, 3, 'ma'),
  T('k14', '🖋️', 'Günlük yaz', 'Write in a journal', 'self', 2, 15, 'e'),
  T('k15', '🎧', 'Bir podcast dinle', 'Listen to a podcast', 'self', 1, 20, 'a'),
  T('k16', '🪞', 'Kendine bir iltifat et', 'Give yourself a compliment', 'self', 1, 2, 'm'),
  // okul / yüksek lisans
  T('u1', '📄', 'Bir makale oku', 'Read an article', 'study', 2, 25, 'ma'),
  T('u2', '✍️', 'Ödev bloğu', 'Assignment block', 'study', 3, 45, 'ma'),
  T('u3', '🔁', 'Ders tekrarı yap', 'Review the lecture', 'study', 2, 20, 'ae'),
  T('u4', '🗒️', 'Literatür notu çıkar', 'Take literature notes', 'study', 2, 20, 'ma'),
  T('u5', '🔎', 'Bir kaynak ara', 'Find a source', 'study', 2, 15, 'a'),
  T('u6', '🖊️', 'Bir paragraf yaz', 'Write one paragraph', 'study', 2, 20, 'ma'),
  T('u7', '🃏', 'Kavram kartlarına bak', 'Go through flashcards', 'study', 1, 10, 'mae'),
  T('u8', '📋', 'Haftalık çalışma planı', 'Plan your study week', 'study', 1, 8, 'e'),
  T('u9', '🎓', 'Danışmana e-posta taslağı', 'Draft an email to your advisor', 'study', 1, 8, 'a'),
  T('u10', '🧠', 'Zor bir konuya çalış', 'Tackle a hard topic', 'study', 3, 40, 'ma'),
  T('u11', '📚', 'Atıfları düzenle', 'Organize citations', 'study', 1, 15, 'a'),
  T('u12', '🖼️', 'Ders slaytlarına göz at', 'Skim lecture slides', 'study', 1, 10, 'ae'),
  // sağlıklı yaşam (sigara azaltma, ev yemeği)
  T('y1', '🚭', 'Sigarasız bir saat', 'One smoke-free hour', 'wellness', 1, 5, 'mae'),
  T('y2', '🍲', 'Ev yemeği hazırla', 'Cook a home meal', 'wellness', 2, 35, 'ae'),
  T('y3', '🥣', 'Sağlıklı kahvaltı yap', 'Have a healthy breakfast', 'wellness', 1, 15, 'm'),
  T('y4', '🚶', 'Yürüyüşe çık', 'Go for a walk', 'wellness', 1, 20, 'mae'),
  T('y5', '🌬️', 'Sigara isteğinde 3 derin nefes', 'Breathe through a craving', 'wellness', 1, 3, 'mae'),
  T('y6', '🥕', 'Sağlıklı atıştırmalık hazırla', 'Prep a healthy snack', 'wellness', 1, 8, 'a'),
  T('y7', '🍓', 'Tatlı yerine meyve ye', 'Fruit instead of sweets', 'wellness', 1, 3, 'a'),
  T('y8', '🍱', 'Yarın için yemek hazırla', 'Meal prep for tomorrow', 'wellness', 2, 25, 'e'),
  T('y9', '📊', 'Bugünkü sigara sayını kaydet', "Log today's cigarettes", 'wellness', 1, 2, 'e'),
  T('y10', '🥗', 'Sebzeli bir öğün ye', 'Eat a veggie-rich meal', 'wellness', 1, 20, 'a'),
  T('y11', '🚸', 'Sigara yerine kısa yürüyüş', 'Short walk instead of a cigarette', 'wellness', 1, 7, 'mae'),
  T('y12', '🛌', 'Zamanında yat', 'Go to bed on time', 'wellness', 1, 10, 'e'),
];
