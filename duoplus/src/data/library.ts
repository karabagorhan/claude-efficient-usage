/** "Kütüphane": kısa, genel sağlıklı yaşam ipuçları ve rehberler (tıbbi tavsiye değildir). */
export interface Article {
  id: string;
  category: string;
  emoji: string;
  title: string;
  minutes: number;
  body: string[];
  /** Önerilen şablon numaraları */
  suggest?: number[];
}

export const ARTICLES: Article[] = [
  {
    id: 'habit-stack',
    category: 'Alışkanlık',
    emoji: '🧱',
    title: 'Alışkanlık yığma: yenisini eskiye bağla',
    minutes: 2,
    body: [
      'Yeni bir alışkanlığı zaten yaptığın bir şeyin hemen ardına koy: "Dişlerimi fırçaladıktan sonra 1 bardak su içeceğim."',
      'Mevcut alışkanlık tetikleyici olur, motivasyona daha az ihtiyaç duyarsın.',
      'Aynı anda en fazla 1 yeni görev ekle. İlk hafta hedefi küçük tut: 2 dakikadan fazla sürmesin.',
    ],
    suggest: [1, 2],
  },
  {
    id: 'sleep',
    category: 'Uyku',
    emoji: '😴',
    title: 'Daha iyi uyku için 5 basit adım',
    minutes: 3,
    body: [
      'Her gün aynı saatte yat ve kalk. Hafta sonu farkı 1 saati geçmesin.',
      'Yatmadan 30 dk önce ekranları kapat, ışıkları kıs.',
      'Öğleden sonra kafeini azalt. Akşam ağır yemek yeme.',
      'Odayı serin, karanlık ve sessiz tut.',
      'Yatakta telefon yerine birkaç sayfa kitap oku.',
    ],
    suggest: [11, 19, 32, 34],
  },
  {
    id: 'focus',
    category: 'Odak',
    emoji: '🍅',
    title: 'Pomodoro tekniği nasıl çalışır?',
    minutes: 2,
    body: [
      '25 dakika tek işe odaklan, 5 dakika mola ver. 4 turdan sonra 15-20 dakika uzun mola.',
      'Mola sırasında ekrana değil, ayağa kalkıp suya veya pencereye bak.',
      'Bölünen dikkat için not kağıdı hazırla: aklına gelen başka işi yaz, seansa dön.',
    ],
    suggest: [20, 21, 25],
  },
  {
    id: 'breathing',
    category: 'Zihin',
    emoji: '🌬️',
    title: 'Kutu nefesi (4-4-4-4)',
    minutes: 2,
    body: [
      '4 saniye nefes al, 4 saniye tut, 4 saniye ver, 4 saniye bekle. 4-5 tur tekrarla.',
      'Stresli anda sinir sistemini yavaşlatmak için kısa ve etkili bir yöntemdir.',
      'Uygulamadaki "Nefes Egzersizi" ekranı seni adım adım yönlendirir.',
    ],
    suggest: [34, 35],
  },
  {
    id: 'water',
    category: 'Sağlık',
    emoji: '💧',
    title: 'Su içmeyi alışkanlık yapmanın yolları',
    minutes: 2,
    body: [
      'Güne bir bardak suyla başla.',
      'Masana dolu bir şişe koy; her öğünle bir bardak iç.',
      'Sayaç görevi kullan: her bardakta bir dokunuş.',
    ],
    suggest: [2, 13],
  },
  {
    id: 'morning',
    category: 'Rutin',
    emoji: '🌅',
    title: 'Sabah rutini nasıl kurulur?',
    minutes: 3,
    body: [
      'Önceki akşam ertesi günün ilk üç işini belirle.',
      'Uyanınca ilk 30 dakikayı telefonsuz geçir: yatağı topla, su iç, esne.',
      'Rutini 20-30 dakikayla sınırla; sürdürülebilirlik uzunluktan önemlidir.',
    ],
    suggest: [1, 2, 4, 5],
  },
  {
    id: 'couple',
    category: 'İlişki',
    emoji: '💞',
    title: 'Birlikte alışkanlık kazanmak',
    minutes: 2,
    body: [
      'Ortak görevler ("Birlikte") ilişkiye zaman ayırmanın en kolay yolu.',
      'Yarışı hafif tut: kaybeden haftalık ödül kuponu yazsın.',
      'Birbirinizin puanını kutlayın; dürtmeyi baskı değil, destek olarak kullanın.',
    ],
    suggest: [36, 37, 38],
  },
  {
    id: 'mood',
    category: 'Zihin',
    emoji: '😊',
    title: 'Ruh hali günlüğü neden işe yarar?',
    minutes: 2,
    body: [
      'Günde 30 saniyede ruh halini kaydet. 2 hafta sonra hangi alışkanlıkların seni iyi hissettirdiğini görürsün.',
      'İstatistik ekranındaki ruh hali takvimi örüntüleri gösterir.',
      'Bu bir tıbbi araç değildir; uzun süren kötü hissetme durumunda bir uzmana danış.',
    ],
  },
];
