import type { PastelKey } from '../engine/types';
import type { Loc } from '../i18n';

export interface WorkoutMove {
  emoji: string;
  name: Loc;
  /** hareket süresi (sn) */
  sec: number;
  how: Loc;
}

export interface WorkoutRoutine {
  id: string;
  emoji: string;
  name: Loc;
  desc: Loc;
  pastel: PastelKey;
  /** hareketler arası dinlenme (sn) */
  restSec: number;
  moves: WorkoutMove[];
}

const m = (emoji: string, tr: string, en: string, sec: number, howTr: string, howEn: string): WorkoutMove => ({
  emoji,
  name: { tr, en },
  sec,
  how: { tr: howTr, en: howEn },
});

export const WORKOUTS: WorkoutRoutine[] = [
  {
    id: 'desk',
    emoji: '🪑',
    name: { tr: 'Masa başı esneme', en: 'Desk stretch' },
    desc: { tr: 'Çalışma arasında boyun, omuz ve bileği gevşet.', en: 'Loosen neck, shoulders and wrists between tasks.' },
    pastel: 'blue',
    restSec: 8,
    moves: [
      m('🙆', 'Boyun yana eğme', 'Neck side tilt', 30, 'Kulağını omzuna yaklaştır, her iki yanda 15 sn bekle.', 'Bring ear toward shoulder; hold 15 s each side.'),
      m('🔄', 'Omuz çevirme', 'Shoulder rolls', 30, 'Omuzlarını yavaşça geriye doğru büyük daireler çizerek çevir.', 'Roll shoulders slowly backward in big circles.'),
      m('🙌', 'Kolları yukarı uzatma', 'Overhead reach', 30, 'Parmaklarını kenetle, avuçlar tavana baksın, yukarı uzan.', 'Interlace fingers, palms up, reach to the ceiling.'),
      m('🤲', 'Bilek esnetme', 'Wrist stretch', 30, 'Kolunu uzat, parmaklarını nazikçe geri çek; sonra diğer el.', 'Extend an arm, gently pull fingers back; switch hands.'),
      m('🧘', 'Oturarak gövde dönüşü', 'Seated twist', 30, 'Sırtın dik, gövdeni yana çevir; her yanda 15 sn.', 'Keep your back tall, twist to each side for 15 s.'),
      m('🪢', 'Göğüs açma', 'Chest opener', 30, 'Ellerini arkada kenetle, göğsünü öne aç.', 'Clasp hands behind you and open the chest.'),
      m('🦵', 'Oturarak bacak uzatma', 'Seated leg extension', 30, 'Bir dizi düzleştir, topuğu yere yaslayıp öne eğil; yan değiştir.', 'Straighten one knee, heel down, lean forward; switch.'),
      m('😮‍💨', 'Derin nefes', 'Deep breaths', 30, 'Burundan al, ağızdan yavaşça ver; omuzların düşsün.', 'Inhale through the nose, exhale slowly; drop the shoulders.'),
    ],
  },
  {
    id: 'full7',
    emoji: '⚡',
    name: { tr: '7 dakikalık tam vücut', en: '7-minute full body' },
    desc: { tr: 'Ekipmansız, tüm vücuda hitap eden tempolu seri.', en: 'No equipment, a brisk full-body circuit.' },
    pastel: 'peach',
    restSec: 10,
    moves: [
      m('🤸', 'Zıplayan açılış', 'Jumping jacks', 40, 'Zıplarken kolları ve bacakları aç-kapat.', 'Jump while opening and closing arms and legs.'),
      m('🧱', 'Duvara yaslanma', 'Wall sit', 40, 'Sırtını duvara ver, dizler 90 derece, bekle.', 'Back on the wall, knees at 90 degrees, hold.'),
      m('💪', 'Şınav', 'Push-ups', 40, 'Zor gelirse dizlerin üzerinde yap; gövde düz kalsın.', 'Drop to your knees if needed; keep the body straight.'),
      m('🔥', 'Mekik', 'Crunches', 40, 'Eller başının yanında, omuzlarını yerden kaldır.', 'Hands by your head, lift shoulders off the floor.'),
      m('🪑', 'Sandalyeye çıkıp inme', 'Step-ups', 40, 'Sağlam bir sandalyeye sırayla çık, in.', 'Step up and down a sturdy chair, alternating legs.'),
      m('🏋️', 'Squat', 'Squats', 40, 'Kalçan geriye, göğsün dik; dizler ayak ucunu geçmesin.', 'Hips back, chest up; knees behind toes.'),
      m('💺', 'Arkaya dips', 'Chair dips', 40, 'Ellerin sandalyede, dirsekleri bükerek in-çık.', 'Hands on a chair, bend elbows to lower and press up.'),
      m('🧍', 'Plank', 'Plank', 40, 'Dirsekler omuz altında, vücut düz bir çizgi.', 'Elbows under shoulders, body in one line.'),
      m('🏃', 'Yerinde yüksek diz', 'High knees', 40, 'Dizlerini kalça hizasına çekerek yerinde koş.', 'Run in place, driving knees to hip height.'),
      m('🦵', 'Hamle', 'Lunges', 40, 'Bir adım öne at, dizler 90 derece; sırayla değiştir.', 'Step forward to 90-degree knees; alternate legs.'),
    ],
  },
  {
    id: 'morning',
    emoji: '🌅',
    name: { tr: 'Sabah mobilitesi', en: 'Morning mobility' },
    desc: { tr: 'Uyandıktan sonra eklemleri nazikçe hareketlendir.', en: 'Wake the joints up gently after getting out of bed.' },
    pastel: 'yellow',
    restSec: 6,
    moves: [
      m('🐱', 'Kedi-inek', 'Cat-cow', 40, 'Dört ayak üstünde sırtını sırayla yuvarla ve ger.', 'On all fours, alternately round and arch your back.'),
      m('🧎', 'Çocuk pozu', "Child's pose", 30, 'Kalçan topuklarına otururken kollarını öne uzat.', 'Sit hips back toward heels, arms stretched forward.'),
      m('🌉', 'Köprü', 'Glute bridge', 30, 'Sırtüstü, kalçanı kaldır ve yavaşça indir.', 'On your back, lift hips and lower slowly.'),
      m('🌀', 'Gövde dönüşü', 'Lying twist', 30, 'Sırtüstü dizlerini yana bırak; her yanda 15 sn.', 'On your back, drop knees to one side; 15 s each.'),
      m('🦆', 'Kalça açma', 'Hip opener', 40, 'Derin çömelme pozunda dirseklerle dizleri nazikçe aç.', 'In a deep squat, press knees out with the elbows.'),
      m('🙆', 'Boyun çevirme', 'Neck circles', 30, 'Çeneni göğse yaklaştırıp başını yavaşça çevir.', 'Chin toward chest, roll the head slowly.'),
      m('🙌', 'Ayakta uzanma', 'Standing reach', 30, 'Parmak uçlarında yüksel, kollar tavana uzansın.', 'Rise on tiptoes, arms reaching up.'),
      m('🧍', 'Öne eğilme', 'Forward fold', 30, 'Dizler hafif bükük, gövdeni sarkıt, başın gevşesin.', 'Knees soft, let the torso hang, head relaxed.'),
    ],
  },
  {
    id: 'neck',
    emoji: '🧖',
    name: { tr: 'Boyun-omuz rahatlatma', en: 'Neck and shoulder relief' },
    desc: { tr: 'Gerilmiş boyun ve omuzlar için yavaş esnemeler.', en: 'Slow stretches for tight necks and shoulders.' },
    pastel: 'mint',
    restSec: 6,
    moves: [
      m('🙂', 'Çene içeri', 'Chin tucks', 30, 'Çeneni hafifçe geriye çek, boynunun arkası uzasın.', 'Draw the chin back gently, lengthening the back of the neck.'),
      m('↔️', 'Boyun yana eğme', 'Side neck stretch', 40, 'Kulağını omzuna indir; diğer elini aşağı uzat.', 'Lower ear to shoulder; reach the other hand down.'),
      m('↗️', 'Çapraz boyun esnetme', 'Diagonal neck stretch', 40, 'Burnunu koltuk altına doğru çevir, nazikçe bekle.', 'Turn the nose toward the armpit and hold gently.'),
      m('🔼', 'Omuz silkme', 'Shoulder shrugs', 30, 'Omuzları kulağa çek, 3 sn tut, bırak.', 'Lift shoulders to ears, hold 3 s, release.'),
      m('🔄', 'Omuz daireleri', 'Shoulder circles', 30, 'Kollar yanda, omuzları geniş daireler çizerek çevir.', 'Arms relaxed, roll shoulders in wide circles.'),
      m('🪽', 'Kürek kemiği sıkıştırma', 'Scapular squeeze', 30, 'Kürek kemiklerini birbirine yaklaştır, bırak.', 'Squeeze shoulder blades together, release.'),
      m('🚪', 'Kapı pervazı göğüs esnetme', 'Doorway chest stretch', 40, 'Dirseğin 90 derece pervazda, gövdeni hafifçe öne ver.', 'Elbow at 90 degrees on the frame, lean through gently.'),
      m('😮‍💨', 'Gevşeme nefesi', 'Release breaths', 30, 'Her nefeste omuzlarını biraz daha düşür.', 'Let the shoulders drop a bit more with each breath.'),
    ],
  },
  {
    id: 'bedtime',
    emoji: '🌙',
    name: { tr: 'Yatmadan önce esneme', en: 'Bedtime stretch' },
    desc: { tr: 'Günün gerginliğini bırakıp uykuya hazırlan.', en: 'Release the day and get ready for sleep.' },
    pastel: 'purple',
    restSec: 8,
    moves: [
      m('🧎', 'Çocuk pozu', "Child's pose", 45, 'Alnını yere bırak, derin ve yavaş nefes al.', 'Rest the forehead down, breathe slow and deep.'),
      m('🐱', 'Kedi-inek', 'Cat-cow', 40, 'Nefesinle sırtını yavaşça ger ve yuvarla.', 'Arch and round the back slowly with the breath.'),
      m('🧍', 'Oturarak öne eğilme', 'Seated forward fold', 45, 'Bacakların uzakta, nazikçe ayaklarına doğru uzan.', 'Legs out, reach gently toward your feet.'),
      m('🦋', 'Kelebek pozu', 'Butterfly stretch', 40, 'Ayak tabanları birleşik, dizler yana açık otur.', 'Soles together, knees falling out to the sides.'),
      m('🌀', 'Sırtüstü gövde dönüşü', 'Supine twist', 45, 'Dizlerini yana bırak, bakışın karşı yöne olsun.', 'Drop knees to one side, gaze the other way.'),
      m('🦵', 'Dizleri göğse çekme', 'Knees to chest', 40, 'Sırtüstü dizlerini sarıl, hafifçe salla.', 'On your back, hug the knees and rock softly.'),
      m('🪫', 'Bacakları duvara yaslama', 'Legs up the wall', 60, 'Kalçan duvara yakın, bacaklar yukarıda dinlen.', 'Hips near the wall, legs resting up; relax.'),
      m('😴', 'Son gevşeme', 'Final relaxation', 45, 'Gözlerini kapat, vücudunu baştan ayağa bırak.', 'Close the eyes and let the body go, head to toe.'),
    ],
  },
  {
    id: 'core',
    emoji: '🔥',
    name: { tr: 'Karın-core 6 dk', en: 'Core in 6' },
    desc: { tr: 'Karın ve gövde kaslarına kısa ve etkili çalışma.', en: 'A short, effective core session.' },
    pastel: 'pink',
    restSec: 10,
    moves: [
      m('🧍', 'Plank', 'Plank', 40, 'Dirsekler omuz altında, karnını içeri çek.', 'Elbows under shoulders, pull the belly in.'),
      m('🔥', 'Mekik', 'Crunches', 40, 'Belini yere yakın tut, omuzlarını kaldır.', 'Keep the low back down, lift the shoulders.'),
      m('🚴', 'Bisiklet', 'Bicycle crunches', 40, 'Dirsek karşı dize yönelsin, tempoyu koru.', 'Elbow toward opposite knee, steady rhythm.'),
      m('🦵', 'Bacak kaldırma', 'Leg raises', 40, 'Sırtüstü bacakları dik kaldır, yavaşça indir.', 'Lift straight legs, lower slowly.'),
      m('🪨', 'Rus dönüşü', 'Russian twists', 40, 'Hafif geriye yaslan, gövdeni sağa-sola çevir.', 'Lean back slightly and twist side to side.'),
      m('🧗', 'Dağcı', 'Mountain climbers', 40, 'Plank pozisyonunda dizleri sırayla göğse çek.', 'From plank, drive knees to the chest alternately.'),
      m('↔️', 'Yan plank (sağ)', 'Side plank (right)', 30, 'Sağ dirsek üzerinde kalçanı kaldır.', 'Lift the hips on the right elbow.'),
      m('↔️', 'Yan plank (sol)', 'Side plank (left)', 30, 'Sol dirsek üzerinde kalçanı kaldır.', 'Lift the hips on the left elbow.'),
    ],
  },
  {
    id: 'legs',
    emoji: '🦵',
    name: { tr: 'Bacak 8 dk', en: 'Legs in 8' },
    desc: { tr: 'Kalça ve bacaklar için ekipmansız seri.', en: 'An equipment-free leg and glute circuit.' },
    pastel: 'green',
    restSec: 10,
    moves: [
      m('🏋️', 'Squat', 'Squats', 45, 'Ayaklar omuz genişliğinde, kalçayı geriye ver.', 'Feet shoulder-width, sit the hips back.'),
      m('🦵', 'Hamle (sağ)', 'Lunge (right)', 40, 'Sağ ayak önde, dizi 90 dereceye kadar bük.', 'Right foot forward, bend to 90 degrees.'),
      m('🦵', 'Hamle (sol)', 'Lunge (left)', 40, 'Sol ayak önde, gövde dik.', 'Left foot forward, torso upright.'),
      m('🌉', 'Köprü', 'Glute bridge', 45, 'Topuklarından it, üstte kalçanı sık.', 'Push through the heels, squeeze the glutes at the top.'),
      m('🪑', 'Sandalyeye çıkma', 'Step-ups', 45, 'Her adımda kalçanı tam aç, tempoyu koru.', 'Fully extend the hip on each step.'),
      m('🦘', 'Sumo squat', 'Sumo squats', 45, 'Ayaklar geniş, parmaklar dışa; derin çömel.', 'Wide stance, toes out; squat deep.'),
      m('🦶', 'Baldır kaldırma', 'Calf raises', 40, 'Parmak uçlarında yüksel, yavaşça in.', 'Rise on toes, lower slowly.'),
      m('🧱', 'Duvara yaslanma', 'Wall sit', 40, 'Sırtın duvarda, dizler 90 derece; sabit dur.', 'Back on the wall, knees at 90 degrees; stay still.'),
      m('🧘', 'Bacak esnetme', 'Quad and hamstring stretch', 40, 'Bir bacağını tut, ardından öne eğil; yan değiştir.', 'Hold a foot behind you, then fold forward; switch.'),
    ],
  },
  {
    id: 'posture',
    emoji: '🧍',
    name: { tr: 'Duruş düzeltme', en: 'Posture reset' },
    desc: { tr: 'Önde kalan omuzları aç, sırtı güçlendir.', en: 'Open rounded shoulders and wake up the upper back.' },
    pastel: 'blue',
    restSec: 6,
    moves: [
      m('🧱', 'Duvar melek hareketi', 'Wall angels', 40, 'Sırtın duvarda, kollarını yukarı-aşağı kaydır.', 'Back to the wall, slide arms up and down.'),
      m('🪽', 'Kürek kemiği sıkıştırma', 'Scapular squeeze', 30, 'Kürek kemiklerini birleştir, 3 sn tut.', 'Pinch the shoulder blades together for 3 s.'),
      m('🚪', 'Pervazda göğüs açma', 'Doorway chest stretch', 40, 'Her iki kolun pervazda, göğsünü öne aç.', 'Both arms on the frame, open the chest.'),
      m('🙂', 'Çene içeri', 'Chin tucks', 30, 'Başın arkaya, çene hafif içeri; ense uzasın.', 'Glide the head back; lengthen the neck.'),
      m('🐦', 'Üst sırt açma', 'Prone Y raise', 30, 'Yüzüstü kolları Y şeklinde hafifçe kaldır.', 'Face down, lift arms into a Y shape.'),
      m('🧍', 'Duvarda duruş', 'Wall posture stand', 40, 'Topuk, kalça, omuz ve baş duvara değsin.', 'Heels, hips, shoulders and head touch the wall.'),
      m('🧘', 'Kalça bükücü esnetme', 'Hip flexor stretch', 40, 'Dizinin üstünde, kalçanı öne ver; yan değiştir.', 'Half-kneeling, shift the hips forward; switch.'),
      m('🐱', 'Kedi-inek', 'Cat-cow', 40, 'Omurgayı nefesle birlikte hareket ettir.', 'Move the spine with your breath.'),
    ],
  },
];

/** Bir rutinin toplam süresi (sn): hareketler + aralardaki dinlenmeler (hazırlık hariç). */
export const routineSeconds = (r: WorkoutRoutine): number =>
  r.moves.reduce((a, mv) => a + mv.sec, 0) + r.restSec * Math.max(0, r.moves.length - 1);
