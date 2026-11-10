// İlerlemeye göre seçilen iki dilli teşvik mesajları (her takipçi için 12).
import type { Loc } from '../engine/types';

export type MsgKind = 'smoke' | 'meals' | 'chores';
export type MsgTone = 'low' | 'mid' | 'high';
interface Msg {
  tone: MsgTone;
  text: Loc;
}
const m = (tone: MsgTone, tr: string, en: string): Msg => ({ tone, text: { tr, en } });

export const LIFE_MESSAGES: Record<MsgKind, Msg[]> = {
  smoke: [
    m('low', 'Zor bir gün olabilir; bu bir başarısızlık değil. Yarın yeniden başlamak için yeni bir gün var.', 'Some days are harder, and that is not failure. Tomorrow is a fresh start.'),
    m('low', 'Bir adım geri gitmek yolu silmez. Şimdi bir bardak su iç, sonra bir sonraki isteği ertele.', 'A step back does not erase the path. Have some water, then try delaying the next urge.'),
    m('low', 'Kendine nazik ol. Hangi anın zor olduğunu fark etmek, planın en değerli parçası.', 'Be kind to yourself. Noticing which moments are hard is the most useful part of the plan.'),
    m('low', 'İstek dalga gibi gelir ve geçer. Birkaç dakika bekleyip nefes almak çoğu zaman yeter.', 'Urges come in waves and pass. A few minutes and a slow breath often do the trick.'),
    m('mid', 'Limitine yakın gidiyorsun. Bir sonraki sigarayı biraz daha ertelemeyi dene.', 'You are close to your limit. Try pushing the next one back a little.'),
    m('mid', 'Her ertelenen sigara, hedefe doğru atılmış küçük bir adım.', 'Every delayed cigarette is a small step toward your goal.'),
    m('mid', 'Gün yarı yolda. Şu ana kadar yaptığın seçimler sayılıyor.', 'The day is half done and your choices so far count.'),
    m('mid', 'Elini ağzından uzak tutacak küçük bir iş bul: yürüyüş, bir bardak çay, kısa bir mesaj.', 'Find a small task for your hands: a short walk, a cup of tea, a quick message.'),
    m('high', 'Harika gidiyorsun! Bugünkü limitin rahatça altındasın.', 'Great going! You are comfortably under today’s limit.'),
    m('high', 'Biriken para ve içilmeyen sigaralar büyüyor. Bununla gurur duyabilirsin.', 'The money saved and cigarettes skipped keep growing. Be proud of that.'),
    m('high', 'Seri devam ediyor. Küçük kazanımlar zamanla büyük bir alışkanlığa dönüşür.', 'Your streak is going. Small wins add up to a new habit.'),
    m('high', 'Bugün planın önündesin. Kendine küçük bir ödül verebilirsin.', 'You are ahead of plan today. Maybe treat yourself to something small.'),
  ],
  meals: [
    m('low', 'Bu hafta fast food biraz ağır bastı; sorun değil. Bir sonraki öğünü evde hazırlamak yeni bir başlangıç olur.', 'Fast food has crept up this week, and that is okay. Cooking the next meal at home is a fresh start.'),
    m('low', 'Yorgun günlerde 10 dakikalık bir yemek fikri işini görür. Fikirler sekmesine göz at.', 'On tired days a 10-minute meal idea does the job. Take a look at the ideas.'),
    m('low', 'Hazırlıksız kalınca dışarıdan söylemek kolay. Yarın için bir akşam yemeği planla.', 'It is easy to order out when unprepared. Plan tomorrow’s dinner now.'),
    m('low', 'Mükemmel olmak gerekmiyor; haftada birkaç ev yemeği bile fark yaratır.', 'No need to be perfect. Even a few home-cooked meals a week make a difference.'),
    m('mid', 'Dengeyi buluyorsun. Bir ev yemeği daha, haftalık hedefe yaklaştırır.', 'You are finding balance. One more home-cooked meal gets you closer to your weekly goal.'),
    m('mid', 'Menü planın varsa akşam “ne yesek” derdi biter. Birkaç günü şimdi doldur.', 'With a menu plan, the “what to eat” stress disappears. Fill in a few days now.'),
    m('mid', 'Bu hafta fast food limitinin içindesin; ev yemeklerini artırmak için iyi bir an.', 'You are within your fast food limit this week, a good time to add more home cooking.'),
    m('mid', 'Küçük hazırlık büyük kolaylık: bir sonraki yemeğin malzemelerini şimdi kontrol et.', 'A little prep goes a long way: check the ingredients for your next meal now.'),
    m('high', 'Bu hafta ev yemeği hedefini yakaladın. Mutfakta harika gidiyorsun!', 'You hit your home-cooking goal this week. You are doing great in the kitchen!'),
    m('high', 'Fast food’suz günlerin sayısı artıyor. Cüzdanın da bundan memnun.', 'Your fast food-free days keep adding up, and your wallet agrees.'),
    m('high', 'Düzenli ev yemeği, hem bütçe hem enerji için güzel bir alışkanlık.', 'Regular home cooking is a good habit for both budget and energy.'),
    m('high', 'Menün hazır, hedefin yolunda. Bu ritmi koru.', 'Your menu is set and your goal is on track. Keep this rhythm.'),
  ],
  chores: [
    m('low', 'Biriken işler gözünü korkutmasın. Sadece birini seç ve 10 dakika ayır.', 'Do not let the pile-up scare you. Pick just one and give it 10 minutes.'),
    m('low', 'Gecikmiş işler bir suç değil, sadece sıradaki adım. En küçüğüyle başla.', 'Overdue chores are not a crime, just the next step. Start with the smallest.'),
    m('low', 'Bir müzik aç, zamanlayıcıyı 15 dakikaya kur ve en çok gecikeni hallet.', 'Put on some music, set a 15-minute timer and tackle the most overdue one.'),
    m('low', 'Bugün tek bir işi bitirmek bile evi ve zihni hafifletir.', 'Finishing even one chore today lightens both the house and your mind.'),
    m('mid', 'İşlerin çoğu kontrol altında. Birkaçını daha bitirirsen hafta tamam.', 'Most chores are under control. A few more and the week is done.'),
    m('mid', 'Çamaşırı makineye atmak çoğu zaman en zor kısımdır. Başlatınca gerisi gelir.', 'Starting the machine is often the hardest part. The rest follows.'),
    m('mid', 'Bugün yapacağın küçük bir iş, yarının yükünü azaltır.', 'One small chore today lightens tomorrow’s load.'),
    m('mid', 'Bitirdiğin her işi işaretle; ilerlemeyi görmek motivasyon verir.', 'Tick off each chore you finish; seeing progress keeps you going.'),
    m('high', 'Ev pırıl pırıl! Bu hafta çok iyi bir düzen tutturdun.', 'The place is sparkling! You have kept a great routine this week.'),
    m('high', 'Gecikmiş iş yok. Şimdi biraz dinlenmeyi hak ettin.', 'Nothing overdue. You have earned a break.'),
    m('high', 'Düzenli küçük işler, büyük temizlik gününü gereksiz kılar. Aferin!', 'Regular small chores make big cleaning days unnecessary. Well done!'),
    m('high', 'Haftalık temizlik hedefine ulaştın. Bu ritim sana çok yakışıyor.', 'You reached your weekly cleaning goal. This rhythm suits you.'),
  ],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Tona göre mesaj seçer; aynı tohum (ör. gün anahtarı) aynı mesajı verir. */
export function pickMessage(kind: MsgKind, tone: MsgTone, seed: string): Loc {
  const all = LIFE_MESSAGES[kind];
  const pool = all.filter((x) => x.tone === tone);
  const list = pool.length ? pool : all;
  return list[hash(`${kind}:${tone}:${seed}`) % list.length].text;
}
