/**
 * Yeni Görev sayfasının önerilen görevleri ve "Şanslı görev" havuzu. Hepsi iki dilli (Loc).
 */
import type { Difficulty, HabitKind, Loc, Slot } from '../engine/types';

export type SuggestCat = 'morning' | 'selfcare' | 'home' | 'health' | 'focus' | 'evening' | 'school' | 'living';
export const SUGGEST_CATS: SuggestCat[] = ['morning', 'selfcare', 'home', 'health', 'focus', 'school', 'living', 'evening'];

export interface Suggestion {
  id: string;
  cat: SuggestCat;
  icon: string;
  title: Loc;
  slot: Slot;
  kind?: HabitKind;
  target?: number;
  difficulty?: Difficulty;
}

const S = (
  id: string,
  cat: SuggestCat,
  icon: string,
  tr: string,
  en: string,
  slot: Slot = 'anytime',
  extra: Partial<Suggestion> = {},
): Suggestion => ({ id, cat, icon, title: { tr, en }, slot, ...extra });

export const SUGGESTIONS: Suggestion[] = [
  // Sabah
  S('make-bed', 'morning', '🛏️', 'Yatağı topla', 'Make the bed', 'morning', { difficulty: 'mini' }),
  S('breakfast', 'morning', '🍳', 'Kahvaltı yap', 'Eat breakfast', 'morning'),
  S('open-windows', 'morning', '🪟', 'Pencereleri aç', 'Open the windows', 'morning', { difficulty: 'mini' }),
  S('morning-water', 'morning', '🥛', 'Güne bir bardak suyla başla', 'Start the day with a glass of water', 'morning', { difficulty: 'mini' }),
  S('stretch-morning', 'morning', '🤸', 'Sabah esneme hareketleri', 'Morning stretch', 'morning'),
  S('plan-day', 'morning', '🗓️', 'Günün planına göz at', 'Glance over today’s plan', 'morning', { difficulty: 'mini' }),
  S('sunlight', 'morning', '🌞', 'Gün ışığına çık', 'Get some daylight', 'morning'),
  // Kendine bakım
  S('trim-nails', 'selfcare', '💅', 'Tırnak kes', 'Trim nails', 'anytime', { difficulty: 'mini' }),
  S('brush-hair', 'selfcare', '💇', 'Saç tara', 'Brush hair', 'anytime', { difficulty: 'mini' }),
  S('skincare', 'selfcare', '🧴', 'Cilt bakımı yap', 'Do my skincare', 'evening'),
  S('face-mask', 'selfcare', '🧖', 'Yüz maskesi uygula', 'Apply a face mask', 'evening'),
  S('moisturize', 'selfcare', '🧼', 'Nemlendirici sür', 'Apply moisturizer', 'morning', { difficulty: 'mini' }),
  S('self-compliment', 'selfcare', '💛', 'Kendine güzel bir söz söyle', 'Say something kind to myself', 'anytime', { difficulty: 'mini' }),
  // Ev
  S('tidy-desk', 'home', '🖥️', 'Masayı topla', 'Declutter desk', 'afternoon'),
  S('trash', 'home', '🗑️', 'Çöpü çıkar', 'Take out the trash', 'evening', { difficulty: 'mini' }),
  S('dishes', 'home', '🍽️', 'Bulaşıkları yıka', 'Wash the dishes', 'evening'),
  S('laundry', 'home', '🧺', 'Çamaşır yıka', 'Do the laundry', 'anytime', { difficulty: 'medium' }),
  S('vacuum', 'home', '🧹', 'Süpür', 'Sweep the floor', 'afternoon', { difficulty: 'medium' }),
  S('water-plants', 'home', '🪴', 'Çiçekleri sula', 'Water the plants', 'morning', { difficulty: 'mini' }),
  S('budget', 'home', '💰', 'Bütçemi kaydet', 'Record my budget', 'evening'),
  S('pay-bills', 'home', '🧾', 'Faturaları kontrol et', 'Check my bills', 'anytime'),
  // Sağlık
  S('vitamins', 'health', '💊', 'İlaç / vitamin al', 'Take pills / vitamins', 'morning', { kind: 'counter', target: 1, difficulty: 'mini' }),
  S('brush-teeth', 'health', '🪥', 'Diş fırçala', 'Brush teeth', 'anytime', { difficulty: 'mini' }),
  S('floss', 'health', '🦷', 'Diş ipi kullan', 'Floss', 'evening', { difficulty: 'mini' }),
  S('walk', 'health', '🚶', '10 dakika yürüyüş', 'Walk for 10 minutes', 'afternoon', { kind: 'timer', target: 10, difficulty: 'medium' }),
  S('steps', 'health', '👟', 'Hedef adım say', 'Reach my step goal', 'anytime', { difficulty: 'medium' }),
  S('fruit', 'health', '🍎', 'Bir porsiyon meyve ye', 'Eat a piece of fruit', 'anytime'),
  S('veggies', 'health', '🥗', 'Sebzeli bir öğün ye', 'Eat a meal with veggies', 'afternoon'),
  S('posture', 'health', '🧘', 'Omuz ve boyun esnet', 'Stretch neck and shoulders', 'afternoon', { difficulty: 'mini' }),
  // Odak
  S('read', 'focus', '📖', '10 sayfa oku', 'Read 10 pages', 'evening', { difficulty: 'medium' }),
  S('focus-25', 'focus', '🎯', '25 dakika odaklan', 'Focus for 25 minutes', 'afternoon', { kind: 'timer', target: 25, difficulty: 'medium' }),
  S('inbox', 'focus', '📥', 'E-postaları gözden geçir', 'Clear my inbox', 'afternoon'),
  S('no-phone', 'focus', '📵', 'Telefonsuz bir saat geçir', 'Spend an hour phone-free', 'evening', { difficulty: 'hard' }),
  S('learn', 'focus', '🧠', 'Yeni bir şey öğren', 'Learn something new', 'anytime', { difficulty: 'medium' }),
  S('top-three', 'focus', '📝', 'Günün 3 önemli işini yaz', 'Write my top 3 tasks', 'morning', { difficulty: 'mini' }),
  // Okul / İş
  S('paper-read', 'school', '📄', 'Makaleden 10 sayfa oku', 'Read 10 pages of a paper', 'afternoon', { difficulty: 'medium' }),
  S('homework-25', 'school', '🎓', 'Ödeve 25 dakika çalış', 'Work on homework for 25 minutes', 'afternoon', { kind: 'timer', target: 25, difficulty: 'medium' }),
  S('review-notes', 'school', '🗒️', 'Ders notlarını gözden geçir', 'Review my class notes', 'evening'),
  S('career-learn', 'school', '🚀', 'Kariyer için 20 dakika öğren', 'Learn for my career for 20 minutes', 'anytime', { kind: 'timer', target: 20, difficulty: 'medium' }),
  S('thesis-write', 'school', '✍️', 'Tez / makale için yaz', 'Write for my thesis / paper', 'morning', { difficulty: 'hard' }),
  S('work-top', 'school', '💼', 'İşteki en önemli işi bitir', 'Finish the most important work task', 'morning', { difficulty: 'medium' }),
  // Sağlıklı yaşam
  S('cig-limit', 'living', '🚭', 'Sigara limitime uy', 'Stay within my cigarette limit', 'anytime', { difficulty: 'hard' }),
  S('home-meal', 'living', '🍲', 'Bugün ev yemeği ye', 'Eat a home-cooked meal today', 'afternoon'),
  S('no-fastfood', 'living', '🥦', 'Bugün fast food yeme', 'Skip fast food today', 'anytime', { difficulty: 'medium' }),
  S('laundry-hang', 'living', '👕', 'Çamaşırı as', 'Hang the laundry', 'anytime'),
  S('laundry-fold', 'living', '🧦', 'Çamaşırı katla', 'Fold the laundry', 'evening'),
  S('dishwasher', 'living', '🫧', 'Bulaşık makinesini boşalt', 'Empty the dishwasher', 'morning', { difficulty: 'mini' }),
  // Akşam
  S('pack-bag', 'evening', '🎒', 'Yarının çantasını hazırla', 'Pack tomorrow’s bag', 'evening', { difficulty: 'mini' }),
  S('gratitude', 'evening', '🙏', 'Üç şükür notu yaz', 'Write three gratitudes', 'evening'),
  S('screens-off', 'evening', '🌙', 'Uyumadan önce ekranları kapat', 'Screens off before bed', 'evening'),
  S('tea', 'evening', '🍵', 'Sakinleştirici bir çay iç', 'Have a calming tea', 'evening', { difficulty: 'mini' }),
  S('tidy-5', 'evening', '🧽', 'Beş dakikalık toplanma', 'Five-minute tidy-up', 'evening', { kind: 'timer', target: 5, difficulty: 'easy' }),
  S('call-loved', 'evening', '📞', 'Sevdiğin birini ara', 'Call someone you love', 'evening'),
];

export interface LuckyTask {
  id: string;
  emoji: string;
  title: Loc;
}

const Lk = (id: string, emoji: string, tr: string, en: string): LuckyTask => ({ id, emoji, title: { tr, en } });

/** Kendine bakım görev havuzu (Şanslı görev). */
export const LUCKY_POOL: LuckyTask[] = [
  Lk('l-water', '💧', 'Bir bardak su iç', 'Drink a glass of water'),
  Lk('l-breath', '🌬️', '5 derin nefes al', 'Take 5 deep breaths'),
  Lk('l-stretch', '🤸', '2 dakika esne', 'Stretch for 2 minutes'),
  Lk('l-walk', '🚶', 'Evin etrafında kısa bir tur at', 'Take a short walk around'),
  Lk('l-window', '🪟', 'Bir pencere aç, temiz hava al', 'Open a window for fresh air'),
  Lk('l-tea', '🍵', 'Kendine sıcak bir içecek hazırla', 'Make yourself a warm drink'),
  Lk('l-song', '🎶', 'Sevdiğin bir şarkıyı dinle', 'Listen to a song you love'),
  Lk('l-dance', '💃', 'Bir şarkı boyunca dans et', 'Dance to one song'),
  Lk('l-text', '💌', 'Birine güzel bir mesaj yaz', 'Send someone a kind message'),
  Lk('l-grat', '🙏', 'Şükrettiğin üç şeyi düşün', 'Think of three things you’re grateful for'),
  Lk('l-journal', '📓', 'Üç cümlelik günlük yaz', 'Write a three-sentence journal'),
  Lk('l-face', '🧼', 'Yüzünü serin suyla yıka', 'Wash your face with cool water'),
  Lk('l-moist', '🧴', 'Ellerine nemlendirici sür', 'Moisturize your hands'),
  Lk('l-hair', '💇', 'Saçını özenle tara', 'Brush your hair mindfully'),
  Lk('l-nails', '💅', 'Tırnaklarına bak, bakım yap', 'Give your nails some care'),
  Lk('l-sun', '🌞', '5 dakika gün ışığı al', 'Get 5 minutes of daylight'),
  Lk('l-desk', '🖥️', 'Masanın üstünü topla', 'Tidy your desk surface'),
  Lk('l-bed', '🛏️', 'Yatağını güzelce topla', 'Make your bed nicely'),
  Lk('l-plant', '🪴', 'Bir çiçeğine su ver', 'Water a plant'),
  Lk('l-fruit', '🍓', 'Bir meyve ye', 'Eat a piece of fruit'),
  Lk('l-posture', '🧘', 'Omuzlarını ve boynunu gevşet', 'Loosen your shoulders and neck'),
  Lk('l-eyes', '👀', '20 saniye uzaklara bak', 'Look into the distance for 20 seconds'),
  Lk('l-phone', '📵', '15 dakika telefonu bırak', 'Put your phone down for 15 minutes'),
  Lk('l-smile', '😊', 'Aynada kendine gülümse', 'Smile at yourself in the mirror'),
  Lk('l-compliment', '💛', 'Kendine bir iltifat et', 'Give yourself a compliment'),
  Lk('l-doodle', '🖍️', 'Bir şeyler karala, çiz', 'Doodle something'),
  Lk('l-book', '📖', 'Bir kitaptan iki sayfa oku', 'Read two pages of a book'),
  Lk('l-pet', '🐾', 'Sevdiğin bir canlıyla vakit geçir', 'Spend a moment with a pet or a friend'),
  Lk('l-foot', '🦶', 'Ayaklarına kısa bir masaj yap', 'Give your feet a quick massage'),
  Lk('l-clutter', '🧺', 'Yerdeki üç şeyi yerine koy', 'Put three things back in place'),
  Lk('l-candle', '🕯️', 'Ortamı yumuşat: ışığı kıs', 'Dim the lights and soften the room'),
  Lk('l-music', '🎧', 'Tek bir albümü baştan dinle', 'Listen to a favorite album track'),
  Lk('l-snack', '🥜', 'Atıştırmalık bir şeyi tadını çıkararak ye', 'Savor a small healthy snack'),
  Lk('l-wish', '🌟', 'Yarın için küçük bir dilek tut', 'Make a small wish for tomorrow'),
  Lk('l-hug', '🤗', 'Birine sarıl ya da kendine sarıl', 'Hug someone, or yourself'),
  Lk('l-photo', '📸', 'Bugünden güzel bir kare çek', 'Take a photo of something nice today'),
  Lk('l-todo', '📝', 'Yarının üç işini listele', 'List tomorrow’s top three'),
  Lk('l-shower', '🚿', 'Duşta 1 dakika sadece suyu hisset', 'Spend a minute feeling the water in the shower'),
  Lk('l-stairs', '🪜', 'Merdivenlerden bir kat çık', 'Take the stairs up one flight'),
  Lk('l-call', '📞', 'Sevdiğin birini ara', 'Call someone you love'),
  Lk('l-tidy-bag', '🎒', 'Çantanı topla', 'Tidy your bag'),
  Lk('l-poem', '🌸', 'Bir şiir ya da güzel bir söz oku', 'Read a poem or a nice quote'),
  Lk('l-sky', '☁️', 'Gökyüzüne bir dakika bak', 'Watch the sky for a minute'),
];
