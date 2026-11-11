import type { PastelKey } from '../engine/types';
import type { Loc } from '../i18n/types';

export type ReflectionCategory = 'self' | 'emotions' | 'habits' | 'relations' | 'goals' | 'gratitude';

export const REFLECTION_CATEGORIES: Array<{ id: ReflectionCategory; emoji: string; name: Loc }> = [
  { id: 'self', emoji: '🪞', name: { tr: 'Kendini tanı', en: 'Know yourself' } },
  { id: 'emotions', emoji: '🌊', name: { tr: 'Duygular', en: 'Emotions' } },
  { id: 'habits', emoji: '🔁', name: { tr: 'Alışkanlıklar', en: 'Habits' } },
  { id: 'relations', emoji: '🤝', name: { tr: 'İlişkiler', en: 'Relationships' } },
  { id: 'goals', emoji: '🧭', name: { tr: 'Hedefler', en: 'Goals' } },
  { id: 'gratitude', emoji: '🌻', name: { tr: 'Şükran ve neşe', en: 'Gratitude & joy' } },
];

export interface ReflectionTopic {
  id: string;
  category: ReflectionCategory;
  emoji: string;
  pastel: PastelKey;
  title: Loc;
  sub: Loc;
  questions: Loc[];
}

type Q = [string, string];
const T = (
  id: string,
  category: ReflectionCategory,
  emoji: string,
  pastel: PastelKey,
  title: Q,
  sub: Q,
  qs: Q[],
): ReflectionTopic => ({
  id,
  category,
  emoji,
  pastel,
  title: { tr: title[0], en: title[1] },
  sub: { tr: sub[0], en: sub[1] },
  questions: qs.map(([tr, en]) => ({ tr, en })),
});

export const REFLECTION_TOPICS: ReflectionTopic[] = [
  T('gratitude', 'gratitude', '🌻', 'yellow', ['Minnettarlık', 'Gratitude'], ['Bugün neye şükrediyorsun?', 'What are you thankful for today?'], [
    ['Bugün seni gülümseten küçük bir şey neydi?', 'What small thing made you smile today?'],
    ['Hayatında olduğu için şanslı hissettiğin üç şey ne?', 'What are three things you feel lucky to have?'],
    ['Birine teşekkür etmek istesen kim olurdu ve ne derdin?', 'If you could thank someone, who would it be and what would you say?'],
    ['Zor bir günde bile işe yarayan neyin var?', 'What works for you even on a hard day?'],
  ]),
  T('stress', 'emotions', '🌪️', 'blue', ['Stres', 'Stress'], ['Yükü adlandır, hafiflet', 'Name the load, lighten it'], [
    ['Şu an seni en çok ne zorluyor?', 'What is weighing on you the most right now?'],
    ['Bunun ne kadarı senin kontrolünde, ne kadarı değil?', 'How much of it is in your control, and how much is not?'],
    ['Bedeninde stresi nerede hissediyorsun?', 'Where do you feel the stress in your body?'],
    ['Bu hafta yükünü hafifletecek küçük bir adım ne olabilir?', 'What is one small step that could lighten the load this week?'],
  ]),
  T('goals', 'goals', '🎯', 'peach', ['Hedefler', 'Goals'], ['Yönünü netleştir', 'Clarify your direction'], [
    ['Önümüzdeki üç ay içinde olmasını istediğin en önemli şey ne?', 'What matters most to you in the next three months?'],
    ['Bu hedef neden senin için önemli?', 'Why does this goal matter to you?'],
    ['Seni durdurabilecek en olası engel ne?', 'What is the most likely obstacle?'],
    ['Bugün atabileceğin on dakikalık bir adım ne?', 'What is a ten-minute step you could take today?'],
    ['İlerlediğini nasıl fark edeceksin?', 'How will you know you are making progress?'],
  ]),
  T('relationships', 'relations', '💞', 'pink', ['İlişkiler', 'Relationships'], ['Bağlarına yakından bak', 'Look closely at your bonds'], [
    ['Kimlerin yanında kendin gibi hissediyorsun?', 'Who do you feel most like yourself around?'],
    ['Bir ilişkinde ihtiyacın olup söylemediğin bir şey var mı?', 'Is there a need you have not voiced in a relationship?'],
    ['Bu hafta kime zaman ayırmak istersin?', 'Who would you like to make time for this week?'],
  ]),
  T('overeating', 'habits', '🍫', 'peach', ['Yemek teselliye dönünce', 'When food turns into comfort'], ['İsteğin asıl ne söylediği', 'What the craving is really asking for'], [
    ['Yeme isteği geldiğinde ne yapıyordun, ne hissediyordun?', 'What were you doing and feeling when the craving came?'],
    ['Gerçekten aç mıydın, yoksa başka bir şeye mi ihtiyacın vardı?', 'Were you truly hungry, or did you need something else?'],
    ['Aynı ihtiyacı karşılayabilecek yemek dışı üç seçenek yaz.', 'List three non-food ways to meet the same need.'],
    ['Kendine yargısız bir cümleyle ne söylemek istersin?', 'What would you say to yourself, without judgment?'],
  ]),
  T('procrastination', 'habits', '⏳', 'purple', ['Erteleme', 'Procrastination'], ['Neden başlayamıyorsun?', 'Why is starting so hard?'], [
    ['Şu an ertelediğin şey ne?', 'What are you putting off right now?'],
    ['Başlamayı zorlaştıran his ne: sıkıntı, korku, mükemmeliyetçilik?', 'What makes starting hard: boredom, fear, perfectionism?'],
    ['İşi beş dakikalık bir parçaya bölsen ilk parça ne olurdu?', 'If you cut it into a five-minute piece, what would the first piece be?'],
    ['Başladıktan sonra kendini nasıl ödüllendireceksin?', 'How will you reward yourself once you begin?'],
  ]),
  T('selfcompassion', 'self', '🤍', 'mint', ['Öz-şefkat', 'Self-compassion'], ['Kendine iyi bir arkadaş gibi davran', 'Treat yourself like a good friend'], [
    ['Kendine sert davrandığın son an neydi?', 'When were you last hard on yourself?'],
    ['Aynı durumda sevdiğin biri olsaydı ona ne söylerdin?', 'What would you say to someone you love in the same situation?'],
    ['Bugün kendine verebileceğin küçük bir iyilik ne?', 'What small kindness can you give yourself today?'],
  ]),
  T('boundaries', 'relations', '🚧', 'blue', ['Sınırlar', 'Boundaries'], ['Hayır diyebilmek', 'Learning to say no'], [
    ['En son ne zaman istemediğin halde evet dedin?', 'When did you last say yes while wanting to say no?'],
    ['Evet demenin sana bedeli ne oldu?', 'What did saying yes cost you?'],
    ['Bir sınırı nazik ama net nasıl ifade edebilirsin?', 'How could you state a boundary kindly but clearly?'],
    ['Sınır koyunca ne olmasından korkuyorsun?', 'What are you afraid will happen if you set one?'],
  ]),
  T('anxiety', 'emotions', '🫧', 'mint', ['Kaygı', 'Worry'], ['Zihnindeki “ya olursa”lar', 'The “what ifs” in your mind'], [
    ['Aklını en çok meşgul eden “ya olursa” ne?', 'Which “what if” is occupying your mind most?'],
    ['Olabilecek en gerçekçi sonuç ne?', 'What is the most realistic outcome?'],
    ['Daha önce benzer bir endişenin sonucu nasıl oldu?', 'How did a similar worry turn out before?'],
    ['Şimdi, bu dakikada, güvende ve iyi olan ne?', 'What is okay and safe right now, in this very minute?'],
  ]),
  T('anger', 'emotions', '🌋', 'peach', ['Öfke', 'Anger'], ['Öfkenin altındaki mesaj', 'The message beneath the anger'], [
    ['Seni en son ne öfkelendirdi?', 'What angered you most recently?'],
    ['Öfkenin altında hangi ihtiyaç ya da kırgınlık olabilir?', 'What need or hurt might be under the anger?'],
    ['Bunu zarar vermeden ifade etmenin bir yolu ne olabilir?', 'What is a harmless way to express it?'],
  ]),
  T('sleepfocus', 'habits', '🌙', 'purple', ['Uyku düzeni', 'Sleep routine'], ['Geceyi nasıl karşılıyorsun?', 'How do you meet the night?'], [
    ['Yatmadan önceki son bir saatte genelde ne yapıyorsun?', 'What do you usually do in the last hour before bed?'],
    ['Seni geç yatıran şey ne?', 'What keeps you up late?'],
    ['Akşam rutinine ekleyebileceğin sakinleştirici bir adım ne?', 'What calming step could you add to your evening?'],
  ]),
  T('energy', 'habits', '🔋', 'yellow', ['Enerji', 'Energy'], ['Neyin seni doldurup boşalttığı', 'What fills and drains you'], [
    ['Gün içinde enerjin ne zaman en yüksek?', 'When is your energy highest during the day?'],
    ['Seni en çok tüketen üç şey ne?', 'What are the three things that drain you most?'],
    ['Seni en çok dolduran üç şey ne?', 'What are the three things that refill you most?'],
    ['Bu hafta birini azaltıp birini artırsan hangileri olurdu?', 'If you did less of one and more of another this week, which ones?'],
  ]),
  T('values', 'self', '🧭', 'blue', ['Değerler', 'Values'], ['Senin için neyin önemi var?', 'What truly matters to you?'], [
    ['Hayatında asla taviz vermek istemediğin üç değer ne?', 'Which three values would you never compromise?'],
    ['Bu değerlere göre yaşadığını hissettiğin bir an anlat.', 'Describe a moment you felt you lived by these values.'],
    ['Şu an hangi değerin ihmal ediliyor?', 'Which value is being neglected right now?'],
  ]),
  T('strengths', 'self', '💪', 'green', ['Güçlü yanlar', 'Strengths'], ['İyi yaptığın şeyleri hatırla', 'Remember what you do well'], [
    ['Başkalarının sende en çok takdir ettiği şey ne?', 'What do others appreciate most in you?'],
    ['Zor bir durumu atlattığın bir anı yaz. Hangi gücünü kullandın?', 'Recall a hard time you got through. Which strength did you use?'],
    ['Bu gücü bu hafta nerede kullanabilirsin?', 'Where could you use this strength this week?'],
  ]),
  T('fear', 'emotions', '🦋', 'pink', ['Korkular', 'Fears'], ['Korkunun yanında durmak', 'Standing beside your fear'], [
    ['Şu sıralar seni geri tutan korku ne?', 'What fear is holding you back lately?'],
    ['Korktuğun şey olsa, başa çıkabileceğini gösteren bir geçmiş deneyimin var mı?', 'If it happened, do you have past proof that you could cope?'],
    ['Korkuya rağmen atabileceğin küçük bir adım ne?', 'What is a small step you could take despite the fear?'],
  ]),
  T('selfworth', 'self', '👑', 'purple', ['Öz-değer', 'Self-worth'], ['Değerin başarıdan bağımsız', 'Your worth is not your output'], [
    ['Değerini neye bağlıyorsun: başarı, onay, görünüş?', 'What do you tie your worth to: success, approval, looks?'],
    ['Hiçbir şey yapmasan da değerli olduğunu gösteren ne var?', 'What shows you are valuable even when you do nothing?'],
    ['İç sesin sana en sık ne söylüyor? Bunu daha nazik nasıl söyleyebilirsin?', 'What does your inner voice say most? How could it say it more kindly?'],
  ]),
  T('change', 'goals', '🦎', 'mint', ['Değişim', 'Change'], ['Bırakmak ve başlamak', 'Letting go and starting'], [
    ['Hayatında şu an değişmesini istediğin tek şey ne?', 'What is the one thing you want to change right now?'],
    ['Eski düzeninin sana sağladığı gizli fayda ne?', 'What hidden benefit does the old way give you?'],
    ['Değişim olunca neyi kaybedersin, neyi kazanırsın?', 'What would you lose and gain if it changed?'],
    ['Kendine verebileceğin küçük bir deneme süresi belirle.', 'Set a small trial period for yourself.'],
  ]),
  T('weekreview', 'goals', '🗓️', 'yellow', ['Haftayı değerlendir', 'Weekly review'], ['Geçen haftadan öğren', 'Learn from the past week'], [
    ['Bu hafta en çok neyle gurur duydun?', 'What are you proudest of this week?'],
    ['Hangi şey beklediğinden zor geçti?', 'What was harder than expected?'],
    ['Gelecek hafta neyi farklı yapacaksın?', 'What will you do differently next week?'],
    ['Gelecek hafta için tek bir niyetin ne?', 'What is your single intention for next week?'],
  ]),
  T('joy', 'gratitude', '🎈', 'pink', ['Neşe', 'Joy'], ['Seni canlandıran şeyler', 'What brings you to life'], [
    ['Zamanın nasıl geçtiğini fark etmediğin son an neydi?', 'When did you last lose track of time?'],
    ['Çocukken seni mutlu eden ve unuttuğun bir şey var mı?', 'Is there something that made you happy as a child that you forgot?'],
    ['Bu hafta kendine bir parça neşe katmak için ne yapabilirsin?', 'What could you do to add a little joy this week?'],
  ]),
  T('body', 'self', '🧘', 'green', ['Beden ile bağ', 'Body connection'], ['Bedenin ne söylüyor?', 'What is your body saying?'], [
    ['Şu an bedeninde en rahat ve en gergin yer neresi?', 'Where is your body most relaxed and most tense right now?'],
    ['Bedenin bugün neye ihtiyaç duyuyor: dinlenme, hareket, su, yemek?', 'What does your body need today: rest, movement, water, food?'],
    ['Bedenine teşekkür etmek için ne yapabilirsin?', 'How could you thank your body today?'],
  ]),
  T('loneliness', 'emotions', '🌌', 'blue', ['Yalnızlık', 'Loneliness'], ['Bağ kurmanın yolları', 'Ways to reconnect'], [
    ['Yalnızlığı en çok ne zaman hissediyorsun?', 'When do you feel lonely most?'],
    ['Yalnız kalmak ile yalnız hissetmek arasındaki farkı nasıl yaşıyorsun?', 'How do you experience the difference between being alone and feeling lonely?'],
    ['Bu hafta ulaşabileceğin biri var mı?', 'Is there someone you could reach out to this week?'],
  ]),
  T('perfectionism', 'habits', '🧩', 'purple', ['Mükemmeliyetçilik', 'Perfectionism'], ['“Yeterince iyi” de iyidir', '“Good enough” is good'], [
    ['Hangi işte kendine çok yüksek standart koyuyorsun?', 'Where do you hold yourself to a very high standard?'],
    ['Bu standardın sana bedeli ne?', 'What does this standard cost you?'],
    ['“Yeterince iyi” senin için nasıl görünürdü?', 'What would “good enough” look like for you?'],
    ['Kusurlu bırakıp ilerleyebileceğin bir şey seç.', 'Pick something you could leave imperfect and move on.'],
  ]),
  T('digital', 'habits', '📱', 'yellow', ['Ekran ve dikkat', 'Screens & attention'], ['Dikkatin nereye gidiyor?', 'Where does your attention go?'], [
    ['Telefonu en çok hangi anlarda refleks olarak eline alıyorsun?', 'In which moments do you reach for your phone by reflex?'],
    ['Ekrandan sonra genelde nasıl hissediyorsun?', 'How do you usually feel after screen time?'],
    ['Bu hafta ekrana ara vereceğin bir zaman dilimi seç.', 'Choose a time window to step away from screens this week.'],
  ]),
  T('forgiveness', 'relations', '🕊️', 'mint', ['Affetmek', 'Forgiveness'], ['Taşıdığın yükü bırak', 'Put down what you carry'], [
    ['Hâlâ içinde taşıdığın bir kırgınlık var mı?', 'Is there a resentment you still carry?'],
    ['Onu taşımak sana ne kazandırıyor, ne kaybettiriyor?', 'What does carrying it give you, and what does it cost?'],
    ['Kendini affetmen gereken bir şey var mı?', 'Is there something you need to forgive yourself for?'],
  ]),
  T('morning', 'gratitude', '🌅', 'peach', ['Güne başlarken', 'Starting the day'], ['Niyetini belirle', 'Set your intention'], [
    ['Bugünün nasıl geçmesini istiyorsun?', 'How would you like today to go?'],
    ['Bugün tek bir şey yapabilsen, hangisi günü başarılı kılar?', 'If you could do just one thing today, which would make it a good day?'],
    ['Kendine bugün için bir söz ver.', 'Make yourself a promise for today.'],
  ]),
  T('evening', 'gratitude', '🌇', 'purple', ['Günü kapatırken', 'Closing the day'], ['Gününü nazikçe bitir', 'End your day gently'], [
    ['Bugün iyi giden üç şey neydi?', 'What were three things that went well today?'],
    ['Bugünden ne öğrendin?', 'What did you learn today?'],
    ['Yarına taşımak istemediğin bir şey var mı? Burada bırak.', 'Is there something you do not want to carry into tomorrow? Leave it here.'],
  ]),
  T('motivationdip', 'goals', '🪫', 'green', ['Motivasyon düştüğünde', 'When motivation dips'], ['Küçük başla, devam et', 'Start small, keep going'], [
    ['Motivasyonun en son ne zaman düştü ve neden?', 'When did your motivation last drop, and why?'],
    ['Daha önce seni tekrar harekete geçiren şey neydi?', 'What got you moving again before?'],
    ['Bugün yalnızca iki dakikada yapabileceğin bir şey ne?', 'What could you do in just two minutes today?'],
    ['Seni destekleyen biri kim, ona nasıl haber verebilirsin?', 'Who supports you, and how could you let them know?'],
  ]),
];

export const topicById = (id?: string | null) => (id ? REFLECTION_TOPICS.find((x) => x.id === id) : undefined);
