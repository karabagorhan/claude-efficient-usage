# Marka taraması (replica-brand / sweep.py)

Tarih: 2026-11-11. Amaç: All2Me kodunda referans uygulamanın (Me+) adı, şirketi, rengi ya da metni kalmış mı.

## 1. Ad taraması — TEMİZ

```
python3 -I replica-brand/sweep.py <all2me> --avoid "Me+,Me Plus,MePlus,Enerjoy,HubLab" \
  --colors "#FE663A,#FE7BE5,#578FFE,#2D73FE,#ED5CD1,#8E5CF8,#FF7D1F,#F95F02,#FC9603,#6772E8,#FA5D05"
```

| kapsam | sonuç |
|---|---|
| `app/`, `src/`, `scripts/`, `assets/`, `supabase/`, `tests/`, `e2e/`, kök dosyalar (`README.md`, `app.json`, `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`, `package-lock.json`) | **Clean** (ad, alan adı, ölçülen renk: 0) |
| `docs/` | 3 isabet, hepsi beklenen yasak anması: `docs/SPEC.md:15`, `docs/CONTRACTS.md:290`, `docs/AGENT_BRIEF.md:24` ("Me+ adı … kullanılmaz") |
| `replica/` (denetim klasörü, `--include-replica`) | beklenen anmalar (bu raporlar) |
| `dist-rtest/` (tüm ağaç taramasında) | 10 isabet — **yanlış pozitif**: başka bir ajanın web derleme çıktısı (gitignore'daki `dist-*/`), küçültülmüş JS'te `me+` alt dizesi (ör. `name+…`) `Me\+` düzenine uyuyor. Kaynak kodda karşılığı yok. Bu klasöre dokunulmadı. |

Uygulama ekranlarında, i18n sözlüklerinde, içerik verisinde ve dosya/klasör adlarında "Me+", "Me Plus",
"MePlus", "Enerjoy", "HubLab" geçmiyor. Uygulama adı her yerde All2Me; maskot özgün ("Puf", bulut + yıldız;
referansın gözlüklü beyaz kuş maskotuyla şekil/renk ortaklığı yok); ikon/splash `scripts/gen-icons.mjs` ile
bu maskottan üretiliyor.

## 2. Renk taraması

Referans görüntülerden ölçülen (PNG'ye çevrilmiş kopyalarda, bölge içindeki baskın kümenin ortalaması) belirgin
renkler sweep.py'ye verildi; **tam eşleşme yok** (beklenen: JPEG'den ölçülen değerler koda birebir yazılmaz).
Bu yüzden ayrıca yakın renk analizi yapıldı (koddaki 116 farklı hex, RGB öklid uzaklığı ≤ 32; betik
scratchpad'de, repo dışı). Her eşleşme ayrı değerlendirildi:

| referans rengi (ölçülen) | koddaki en yakın | uzaklık | nerede | değerlendirme |
|---|---|---|---|---|
| onboarding mercanı `#FE663A` (s01 halka + hap) | `#FF6B3D` `light.coral` | 5.9 | onboarding halkaları/ilerleme çubuğu, `partner` rengi, konfeti, sekme çark ikonu | **Aynı ton, aynı rol** (onboarding sonuç vurgusu). Tek başına genel bir mercan; ama aynı düzenle birlikte ticari görünüm (trade dress) benzerliğini artırır. Öneri: marka geçişinde vurguyu farklı bir aileye kaydır (ör. mercan yerine yeşilimsi turkuaz ya da sıcak sarı). Orta. |
| çark pembesi `#FE7BE5` (s09 zemin) | `#FF7AE0` `light.pink`, `GRADIENTS.wheel[0]` | 5.2 | çark ekranı gradyanı, ortadaki sekme hapı | **Aynı ton, aynı rol** (çark ekranı + sekme hapı). Öneri: farklı bir ton (ör. mor-mavi ya da turuncu) — aynı zamanda hap etiketi kontrastını da düzeltir. Orta. |
| sekme hapı pembesi `#ED5CD1` (s05) | `#FF7AE0` | 31 | sekme hapı | Yukarıdakiyle aynı karar. |
| çark çerçeve mavisi `#578FFE` / `#2D73FE` | `#3B6CF6` `light.blue` | 17.6 | çark çerçevesi, sekme ikonu | Benzer aile, aynı rol (dalgalı mavi çerçeve). Düşük-orta; çark rengi değişirse çerçeve de değişmeli. |
| pastel kart seti (s10/s11 ölçülen 7 ton) | `PASTELS.*.light` (7 ton) | 2.4–6.4 | tüm görev kartları, ikon kutuları | **Sayısal olarak aynı set** (JPEG ölçüm hatası içinde; SPEC §2 değerleri referanstan almış). Pastel ton tek tek genel ve sahiplenilemez; marka varlığı değil. Ancak aynı 7'li set + aynı kart yerleşimi (emoji solda, üst satır, kalın başlık, ›) birlikte en güçlü benzerlik kaynağı. Öneri: seti koru ama ton/açıklığı kaydır (ör. ±10-15° ton, farklı sıra) ya da 1-2 tonu değiştir. Düşük-orta. |
| Harekete Geç moru `#8E5CF8` | `#7C5CFC` `light.purple` (18.4), `#8B5CF6` (3.6) | — | gradyanlar, `me` rengi; `#8B5CF6` yalnız `app/tools/love.tsx` kart rengi ve `src/data/quotes.ts` | `#8B5CF6` Tailwind violet-500 (genel kütüphane rengi, farklı rolde) — tesadüf, sorun değil. `#7C5CFC` aynı rolde (harekete geç gradyanı) ama mor geniş bir aile. Düşük. |
| seri turuncusu `#FF7D1F`, alev `#F95F02`, takvim `#FC9603` | `#FF8A1F` `light.orange` (13), `#F2550A` alev (14.6), `#F59E0B` warn (13.3) | — | seri ekranı | "Ateş" için genel turuncu; `#F59E0B` Tailwind amber-500. Düşük. |
| şanslı görev çividi `#6772E8` | `#6C6CF0` `GRADIENTS.lucky[0]` | 11.2 | Yeni Görev "şanslı görev" kartı | Aynı rol, yakın ton. Düşük-orta; ai/lucky kartları kontrast için zaten değişmeli (contrast.md #11). |
| logo turuncusu `#FA5D05` (yalnız durum çubuğundaki uygulama simgesi) | `#F2550A` alev | 12.4 | `src/features/streak/Flame.tsx` | Referans logosu kodda yok; alev genel bir ateş rengi. Sorun değil. |

Sonuç: **marka varlığı (ad, logo, maskot, illüstrasyon) yok.** Renklerde tek tek "marka rengi kopyası" yok ama
vurgu renklerinin ikisi (mercan, çark pembesi) ve pastel set referansla aynı rollerde neredeyse aynı değerde.
SPEC bu paleti bilerek seçmiş; risk, düzenle birleşince ticari görünüm benzerliği. Yayın öncesi marka geçişinde
(replica-brand Step 3) en azından mercan + çark pembesi + çark mavisi farklı bir aileye taşınmalı.

## 3. Metin taraması (sweep.py'nin göremediği) — SORUN VAR

sweep.py yalnız ad/alan adı/renk arar. Ürün kuralı "Me+ metinleri kullanılmaz" olduğu için referans
görüntülerdeki İngilizce metinler kodda aratıldı (`grep -rniF`, `src/` ve `app/`). Türkçe metinler özgün; ama
**İngilizce sözlükte referansla birebir aynı ya da çok yakın çok sayıda metin var**:

Birebir / neredeyse birebir (ayırt edici başlık ve pazarlama cümleleri — yeniden yazılmalı):

| metin (EN) | dosya:satır | referans |
|---|---|---|
| `Self-Care Tools` | `src/i18n/locales/tools.ts:51` | s05 başlık |
| `100 Ways to Love Myself` | `src/i18n/locales/tools.ts:53`, `src/i18n/locales/love.ts:20` | s05 afiş (TR adı SPEC'te verilmiş; EN birebir) |
| `How do you feel?` / `Tap to record` | `src/i18n/locales/tools.ts:69-70` | s05 ruh hali kartı |
| `Time to drink water!` / `Hydration tracker & daily reminders` | `src/i18n/locales/tools.ts:75-76`, `src/i18n/locales/drink.ts:51` | s05 su kartı |
| `Time to take action!` | `src/i18n/locales/routine.ts:130` | s04 |
| `Fun Chore Wheel` | `src/i18n/locales/wheel.ts:40` | s09/s12 |
| `Let's Spin` | `src/i18n/locales/wheel.ts:49` | s12 |
| `A fun little self-care surprise` / `Spin your lucky task` | `src/i18n/locales/newtask.ts:62`, `:104` | s10 |
| `Tap to rename` | `src/i18n/locales/newtask.ts:60` | s10 |
| `Consistency pays off. Keep shining.` | `src/i18n/locales/streak.ts:30` | s16 afiş |
| `Streak Calendar` | `src/i18n/locales/streak.ts:33` | s16 |
| `Could be better` | `src/i18n/locales/onboarding.ts:92` | s01 |
| `Sure! Let’s go!` | `src/i18n/locales/onboarding.ts:73` | s02/s03 |
| `Do you want to organize your day?` / `Do you want to build good habits?` | `src/i18n/locales/onboarding.ts:76-77` | s02/s03 |
| `The better we know ourselves, the closer we get to our best` (yakın açımlama) | `src/i18n/locales/onboarding.ts:85` | s01 "Knowing ourselves better, so we can be our best selves" |
| `A very good start!` / `Well done…` (yakın) | `src/i18n/locales/onboarding.ts:106-107` | s08 |
| `When you want to overeat` (yansıma konusu) | `src/data/reflections.ts:69` | s05 kilitli konu |
| İlham bölüm/kategori adları: `Cleaning Plans`, `Take Care of Myself`, `Morning Routines`, `Popular cleaning templates`, `To be organized`, `Work & Study 101`, `Back to school`, `Fit & fabulous`, `At the end of the day`, `Hello, beauty`, `Tips you cannot miss` | `src/data/inspire/categories.ts:5-8, 20-28` | s07, s13-s17 |

Genel UI/eylem metinleri (düşük risk, sahiplenilemez; değiştirmek isteğe bağlı): `Mark as done`, `Do it later`
(`common.ts:82-83`), `day streak`, `Mood check-in`, öneri görev adları (`Trim nails`, `Open the windows`,
`Record my budget`, `Brush hair`, `Declutter desk`, `Take pills / vitamins` — `src/data/suggestions.ts`), çark
dilim adları (`Arrange Shoes`, `Clean Sink` — `src/data/wheels.ts`).

Değerlendirme: Bunlar kısa cümleler; tek tek telif eşiği tartışmalı, ama ürün kuralı ("metinleri kullanılmaz")
ve replica-brand Step 5 ("none echoing the original's phrasing") açısından **ihlal**. Türkçe metinler çeviri
olduğu için doğal olarak farklı; sorun EN arayüzde. Öneri: yukarıdaki tablo için All2Me sesine uygun yeni EN
metinler yaz (ör. "Self-Care Tools" → "Your toolkit", "Fun Chore Wheel" → "Chore Roulette",
"Time to take action!" → "Your move!", "Consistency pays off…" → kendi seri mesajın); İlham bölüm adlarını
yeniden adlandır. Yalnız sözlük/veri dosyaları değişir, efor S-M.

## 4. Görsel öğeler

- Logo/ikon: özgün maskot; referansın "M" logosu yok.
- İllüstrasyonlar: referanstaki kişi illüstrasyonları yerine emoji kompozisyonları
  (`src/features/onboarding/QuestionArt.tsx`). Kavram ("önce/sonra" ikiye bölünmüş damla + pil seviyesi) referans
  illüstrasyonun fikrini izliyor ama çizim özgün; düşük risk, istenirse pil motifi kaldırılabilir.
- Çark: dalgalı mavi çerçeve + ortada maskot + pembe zemin referansın imza kompozisyonu; maskot özgün, renkler
  için yukarıdaki öneri geçerli.
