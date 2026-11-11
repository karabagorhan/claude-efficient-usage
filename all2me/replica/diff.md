# Görsel düzen farkı (replica-diff / imgdiff.py)

Tarih: 2026-11-11. Referans: kullanıcının gönderdiği 17 ekran görüntüsü (738x1600 JPEG, repoya eklenmedi).

## Yöntem

1. Referans JPEG'ler Chromium'da tam boyutta `<img>` olarak açılıp ekran görüntüsüyle PNG'ye çevrildi (738x1600,
   scratchpad). imgdiff.py yalnız PNG okur.
2. All2Me: `npx expo export --platform web --output-dir dist-rdiff`, kendi Playwright betiği, görünüm
   **369x800 @2x = 738x1600**, dil EN (referans İngilizce), açık tema. Rutin/araç ekranları `scripts/shots.mjs
   --seed` ile aynı şekilde tohumlandı (5 görev, 3 günlük seri, çark son sonucu); onboarding tohumsuz,
   tıklanarak gezildi (tüm sorulara "Evet" → referanstaki gibi dört alan da "Could be better").
3. `python3 -I imgdiff.py ref.png clone.png --json --out shots/rdiff/<ad>.png` (varsayılan düzen modu: kenar
   haritası, 12 sütunlu ızgara, renk yok sayılır). Fark görüntüleri ve JSON'lar: `shots/rdiff/` (gitignore).
4. **Cihaz kaynaklı fark:** referansın üst ~94 px'i iPhone durum çubuğu (saat, Dynamic Island içinde referans
   uygulamanın simgesi, pil); web yakalamada durum çubuğu ve güvenli alan yok, dolayısıyla All2Me içeriği ~47 pt
   yukarıda başlıyor. Etkisini ölçmek için ikinci bir ölçüm yapıldı: referansın üst 94 px'i beyaza boyandı,
   All2Me 369x753 görünümde alınıp 94 px'lik beyaz bandın altına yerleştirildi ("düzeltilmiş" sütun).
   Ayrıca s10/s11/s16 referansta **sayfa (sheet) modal** (üstte ~120 px arka sayfa şeridi), All2Me web'de tam
   sayfa.

### Ölçeği okumak için: referansın kendi içindeki puanları

| karşılaştırma | puan | anlamı |
|---|---|---|
| s05 ↔ s06 (aynı ekran, araç şeridi kaydırılmış) | 85.4 | neredeyse aynı düzen |
| s09 ↔ s12 (aynı çark, farklı dönüş) | 82.4 | aynı düzen, farklı içerik açısı |
| s02 ↔ s03 (aynı soru şablonu, farklı illüstrasyon/başlık) | 59.3 | aynı düzen + farklı görsel |
| s13 ↔ s14, s07 ↔ s13 (aynı ekran, farklı kaydırma) | 43.1 / 42.4 | aynı bileşenler, farklı konum |
| s10 ↔ s11 (aynı liste, kaydırılmış) | 34.2 | |

Bu araç içerik/illüstrasyon/metin uzunluğuna çok duyarlı: özgün görseller ve farklı metinlerle **aynı düzen bile
~60'ı geçmiyor.** All2Me puanlarını bu tavanla birlikte okumak gerekir; mutlak "matches/close" beklenmemeli
(replica-diff de piksel eşitliği kovalamamayı söylüyor).

## Ekran başına puanlar

| referans | All2Me | düzen puanı (ham) | düzeltilmiş | karar | fark görüntüsü |
|---|---|---|---|---|---|
| s16 Seri | `/streak` | **43.7** | 26.5 | different | `shots/rdiff/s16-streak.png` |
| s06 Araçlar | `/tools` | 33.6 | 28.3 | different | `shots/rdiff/s06-tools.png` |
| s13 İlham (kaydırılmış) | `/inspire` | 33.6 | 31.4 | different | `shots/rdiff/s13-inspire.png` |
| s05 Araçlar | `/tools` | 32.5 | 27.3 | different | `shots/rdiff/s05-tools.png` |
| s07 İlham | `/inspire` | 28.3 | 26.1 | different | `shots/rdiff/s07-inspire.png` |
| s09 Çark (sonuç) | `/wheel` | 27.9 | 37.8 | different | `shots/rdiff/s09-wheel.png` |
| s12 Çark | `/wheel` | 27.9 | 38.5 | different | `shots/rdiff/s12-wheel.png` |
| s01 Onboarding sonuç | onboarding sonuç adımı | 25.1 | 24.3 | different | `shots/rdiff/s01-onb-result.png` |
| s02 Onboarding soru | onboarding "organize" | 18.7 | 20.6 | different | `shots/rdiff/s02-onb-q-organize.png` |
| s03 Onboarding soru | onboarding "habits" | 18.6 | 19.3 | different | `shots/rdiff/s03-onb-q-habits.png` |
| s10 Yeni Görev | `/new-task` | 17.1 | 28.2 | different | `shots/rdiff/s10-newtask.png` |
| s04 Harekete Geç | `/action?habitId=…` | 14.5 | 20.7 | different | `shots/rdiff/s04-action.png` |
| s11 Yeni Görev (kaydırılmış) | `/new-task` +640 px kaydırma | 11.6 | 16.6 | different | `shots/rdiff/s11-newtask-scrolled.png` |
| s08 Onboarding kutlama | onboarding "done" | 7.6 | 5.6 | different | `shots/rdiff/s08-onb-done.png` |
| **ortalama** | 14 çift | **24.3** | 25.1 | | |

Durum çubuğunu nötrlemek ortalamayı yalnız +0.8 değiştiriyor: düşük puanların asıl kaynağı cihaz değil,
illüstrasyon/metin ve aşağıdaki gerçek konum farkları. imgdiff'in "regions" listesi bu ekranlarda çoğunlukla tüm
ekranı kaplayan tek blok verdiği için bölgeler aşağıda görüntüler yan yana incelenerek yazıldı.

## Ekran ekran: farklı bölgeler

**s05/s06 ↔ Araçlar.** Sıra aynı: başlık, afiş + sayfa noktaları, yatay araç şeridi, ruh hali kartı, su kartı,
"Reflection / All ›". Farklar: (a) üst 94 px durum çubuğu; (b) All2Me afişi daha uzun metinli (başlık + alt
satır); (c) ruh hali kartında "How do you feel?" 369 px'te iki satıra kırılıyor (yüz kümesi yer kaplıyor) → kart
~216 px (referans ~156); (d) su kartına ilerleme çubuğu + "0 / 2000 ml" eklenmiş → kart ~290 px (referans ~156);
(c)+(d) Yansıma bölümünü ~190 px aşağı itiyor, ilk görünümde yansıma kartları sekme çubuğunun altında kalıyor;
(e) araç kutuları biraz büyük, şeritte 4 kutu tam görünüyor, referanstaki gibi 5. kutunun yarısı "kaydırılabilir"
ipucu vermiyor. Bilinçli: kişi illüstrasyonu yerine su damlası doluluk göstergesi; aşağıda ek uyku kartı ve
**yaşam takibi kartları** (sigara, yemek, ev işleri, okul, gelişim) — ilk görünümün dışında.

**s07/s13 ↔ İlham.** Referans ekranlar kaydırılmış durumda (afiş üstten kesik), All2Me kaydırma 0'da — durum
farkı puanı düşürüyor. Bileşenler aynı: başlık + arama + kalp, afiş + noktalar, 4.5 görünür kategori kutusu,
bölüm başlığı + "All ›", 2 + kenar ipucu şablon kartı. Gerçek fark: EN'de ilk bölüm başlığı "Popular cleaning
templat…" diye kesiliyor (369 px'te h2 tek satır). Bilinçli: poster illüstrasyonları yerine metin + emoji
şablon kartları, video bölümü yok.

**s09/s12 ↔ Çark.** Referansta çark tam ekran modal (sol üstte ×, sekme çubuğu yok), All2Me'de bir sekme (sekme
çubuğu görünür) ve başlık altında **çark seçici çipleri** (Ev işleri / Kendine bakım / Hareket) var; bu ikisi
çarkı ~70 px aşağı itip çapını küçültüyor (referansta çark kenardan taşacak kadar geniş). Başlık referansta iki
satır, All2Me'de tek satır. Sonuç şeridi ve siyah buton aynı yerde. Referanstaki "Get More Spins (0/3) /
Chances Refresh in 04:48" yerine "bugün puanlanan 0/5 · sınırsız çevirme" (bilinçli, kilitsiz). **Gerçek kusur:**
369 px'te dilim yazıları emojilerle çakışıyor ("Take Out Trash", "Wash Laundry") ve "Empty Dishwasher" kesiliyor.
Bilinçli: özgün maskot ortada.

**s04 ↔ Harekete Geç.** Yapı aynı: ×, iki satırlık beyaz başlık, eğik görev kartı + parıltılar, iki hap
buton, altta maskot. Farklar: referansta butonlar daraltılmış (yanlarda ~58 pt boşluk) ve ekranın ortasında
(y≈880-1135), All2Me'de tam genişlik ve daha aşağıda (y≈1050-1300); kart başlığı tohum verisinde iki satır.
Referansın gradyanındaki ışık hüzmeleri yok. Bilinçli: özgün maskot.

**s16 ↔ Seri.** En yakın ekran (ham 43.7). Sıra aynı: geri + "Streak", alev, büyük sayı, "day streak",
turuncu teşvik afişi, "Streak Calendar", takvim kartı. Farklar: referans sayfa modal (üstte şerit) olduğu için
düzeltilmiş ölçümde hizalama bozuluyor (26.5); alev daha büyük; takvim haftası Pazartesi başlıyor (referans
Pazar; TR için bilinçli); geçmiş seri günleri dolu daire.

**s10/s11 ↔ Yeni Görev.** Sıra aynı: ×, soluk "New Task / Tap to rename", gradyan planlayıcı kartı, şanslı görev
kartı, su / ruh hali / yansıma bağlı kartları, öneriler. Farklar: referansta başlık bloğu daha yüksek (ilk kart
y≈450, All2Me y≈330) ve **başlık sabit kalıyor, liste altından kayıyor** (s11); All2Me'de başlık içerikle birlikte
kayıp gidiyor. Kart yüksekliği All2Me'de ~150 px (referans ~135) → aşağı doğru birikimli kayma. Bilinçli:
"Suggested tasks" başlığı + kategori çipleri, eklenmiş görevde "› " yerine "✓ Added".

**s01 ↔ onboarding sonuç.** 2x2 halka + hap etiket düzeni aynı. Farklar: EN başlık 4 satır (34 px, uzun metin)
→ halkalar ~200 px aşağıda başlıyor; referanstaki sosyal kanıt satırı yok, yerine "tanı değildir" notu (bilinçli);
ilerleme çubuğu (bilinçli).

**s02/s03 ↔ onboarding soru.** Yapı aynı: sol üstte geri, iki satır başlık, ortada görsel, altta "No" (çerçeveli)
+ "Sure! Let’s go!" (siyah). Farklar: All2Me'de ilerleme çubuğu (bilinçli), butonlar tam genişlik (referansta
yanlarda ~32 pt boşluk), görsel daha küçük (~270 pt vs ~350 pt genişlik). Bilinçli: kişi illüstrasyonu yerine
özgün emoji kompozisyonu.

**s08 ↔ onboarding kutlama.** Referans yalnız ortada metin + seyrek konfeti; All2Me maskot + başlık + alt satır
+ "Let’s begin" butonu + yoğun konfeti bandı. En düşük puan (7.6) ama fark bilinçli (CTA ve maskot); konfeti
rastgele olduğu için bu çiftin puanı gürültülü.

## Bilinçli farklar (düzeltilmez)

- Özgün maskot (Puf) ve emoji tabanlı görseller; referans illüstrasyonları/maskotu kullanılmaz.
- Ek yaşam takibi kartları (Araçlar altında), çark seçici (3 çark), öneri kategori çipleri, onboarding ilerleme
  çubuğu ve "tanı değildir" notu.
- Kilit/paywall öğeleri yok: "Get More Spins (0/3)", geri sayım, kilitli yansıma simgesi, AI asistan etiketi.
- Sosyal kanıt satırı (s01) yok.
- Çark bir sekme (SPEC §3.6); takvim Pazartesi başlangıçlı.

## Düzeltmeye değer gerçek düzen farkları

1. **Çark dilim yazıları emojiyle çakışıyor / kesiliyor** (`src/features/wheel/WheelView.tsx`): yazı yarıçapını
   ve emoji yarıçapını ayır, uzun adlarda yazı boyutunu küçült ya da 2 satıra izin ver; dar ekranda çark
   çapını çip satırını kaldırıp büyütmek de yardımcı olur. Efor M.
2. **Yeni Görev başlığı sabit değil** (`app/new-task.tsx`): "New Task / Tap to rename" bloğunu `Screen`'in
   `header` alanına taşı (kaydırılmayan), liste altından kaysın. Efor S.
3. **İlham bölüm başlığı EN'de kesiliyor** (`app/(tabs)/inspire.tsx` / `SectionHeader`, `src/data/inspire/categories.ts`):
   kısa başlık ya da `adjustsFontSizeToFit` / 2 satır. Efor S (metinler zaten yeniden yazılmalı, brand-sweep.md §3).
4. **Araçlar: ruh hali başlığı kırılıyor, su kartı uzun** (`app/(tabs)/tools.tsx`): yüz kümesini küçült (40→32)
   ya da başlığı `numberOfLines={1}`; su kartında ilerlemeyi sağdaki damla göstergesine bırak ya da çubuğu
   ince/tek satır yap. İlk görünümde Yansıma bölümü görünür olur. Efor S.
5. **Onboarding sonuç başlığı EN'de 4 satır** (`src/i18n/locales/onboarding.ts` result.title, `app/onboarding.tsx`
   Title display→h1): kısa, özgün bir başlık (aynı zamanda metin benzerliğini giderir). Efor S.
6. (İsteğe bağlı) Harekete Geç ve onboarding soru butonları: referanstaki gibi yatay iç boşluk / dikey merkezleme
   (`app/action.tsx`, `app/onboarding.tsx`). Efor S. Düzen puanından çok "his" için.
