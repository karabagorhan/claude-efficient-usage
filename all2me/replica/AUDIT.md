# All2Me — replica denetimi (özet)

Tarih: 2026-11-11 · Yöntem: replica-recon / design / diff / brand · Uygulama koduna dokunulmadı.
Ayrıntı: `recon.md`, `features.csv`, `parity.md`, `diff.md`, `design/contrast.md`, `brand-sweep.md`.

| alan | sonuç |
|---|---|
| **Parity** | **83.6 / 100** (özellik 98.4 × 0.8 + düzen 24.3 × 0.2). 45 sayılan özellik; **must 10/10 tamam, eksik must yok** → "shippable" eşiğinde. Eksikler yalnız 3 "could" (partial): MBTI tarzı test (doğrulanmadı), uzun onboarding kişiselleştirmesi (doğrulanmadı), Alarm (yerel bildirim sınırı). 8 skip (sahte istatistik, paywall ×2, tanı testleri, video içerik, AI fotoğraf planı, widget, "Library"), 16 All2Me eklemesi (skora girmez). |
| **Düzen** | 14 çift, ortalama **24.3** (durum çubuğu nötrlenince 25.1). Seri 43.7 · Araçlar 32.5/33.6 · İlham 28.3/33.6 · Çark 27.9/27.9 · Onb. sonuç 25.1 · Onb. soru 18.7/18.6 · Yeni Görev 17.1/11.6 · Harekete Geç 14.5 · Onb. kutlama 7.6. Ölçek notu: referansın kendi aynı-düzen/farklı-görsel çifti 59, aynı ekran farklı kaydırma 42 — araç içeriğe çok duyarlı; sıralama/bileşen yapısı tüm ekranlarda aynı. |
| **Kontrast** | Açık 42 çiftin 26'sı, koyu 41 çiftin 17'si AA altında. Metin/zemin, ana buton, pastel kart üstü metin, etkin sekme AAA. Başarısızlar: `textFaint`, pasif sekme, input sınırı, metin olarak danger/success/warn/purple, beyaz yazılı haplar (sekme Çark hapı, onboarding seviye hapları), Yeni Görev gradyan kartları, Seri sayısı/afişi, koyu temada sabit `#14171A` seçim halkası. |
| **Marka** | sweep.py: kaynak kod (app, src, scripts, assets, supabase, tests, e2e, kök dosyalar) **temiz**; `docs/` 3 beklenen anma; `dist-rtest/` isabetleri başka ajanın derleme çıktısında yanlış pozitif. Ölçülen referans renkleri: tam eşleşme yok, ama mercan `#FF6B3D`, çark pembesi `#FF7AE0` ve 7 pastel referansla aynı rolde neredeyse aynı (Δ ≤ 6.4). **Metin: EN sözlükte ~30 referans metni birebir/çok yakın** (ürün kuralı ihlali). |

## Öncelikli düzeltme listesi

| # | dosya | sorun | önerilen değişiklik | efor |
|---|---|---|---|---|
| 1 | `src/i18n/locales/{tools,love,drink,routine,wheel,newtask,streak,onboarding}.ts` | EN metinler referansla birebir ("Self-Care Tools", "100 Ways to Love Myself", "How do you feel? / Tap to record", "Time to drink water! / Hydration tracker & daily reminders", "Time to take action!", "Fun Chore Wheel", "Let's Spin", "Spin your lucky task", "Tap to rename", "Consistency pays off. Keep shining.", "Could be better", "Sure! Let’s go!", soru başlıkları; sonuç başlığı açımlama) | All2Me sesinde yeni EN metinler (liste: `brand-sweep.md` §3); TR'ye dokunmaya gerek yok | M |
| 2 | `src/data/inspire/categories.ts:5-8,20-28`, `src/data/reflections.ts:69` | İlham kategori/bölüm adları ve bir yansıma konusu referansla aynı | yeniden adlandır (bölüm başlığı kesilmesini de çözer, madde 11) | S |
| 3 | `src/theme/index.ts` | `textFaint` (2.24 / koyu 3.21), `tabInactive` (2.38 / 3.05), input sınırı (`border` 1.24) AA altında | `textFaint` yalnız dekoratif; okunacak metinde `textDim`; `tabInactive` → `#6B7280` (koyu `#7E8592`); yeni `borderInput` `#8A8F9A` (koyu `#6B7280`) ve `Field`'da kullan | S |
| 4 | `app/(tabs)/_layout.tsx` | ortadaki "Çark" hap etiketi beyaz/pembe 2.30 (koyu 2.03) | etiket yazısı `#14171A` ya da hap `#C2189A` | S |
| 5 | `app/onboarding.tsx` | seviye hapları beyaz/mercan-sarı-yeşil 2.15-2.83; koyu temada görev seçim halkası sabit `#14171A` (1.5:1, görünmüyor) | hap yazısı `#14171A`; halka/işaret rengi `t.onPastel` | S |
| 6 | `src/theme/index.ts` (`GRADIENTS.ai`, `GRADIENTS.lucky`), `app/new-task.tsx` | beyaz yazı gradyanın açık ucunda 2.19, lucky 4.17 | `ai` → `#4F5BD5`→`#8E4FE0`, `lucky` başlangıç `#5B5BE0` (ya da koyu yazı) | S |
| 7 | `app/streak.tsx` | büyük sayı turuncu/krem 1.50, "day streak" 1.84, beyaz afiş yazısı/turuncu 2.36 | sayı `#C2410C`, birim `#B45309`, afiş yazısı `#14171A` ya da zemin `#C2410C` | S |
| 8 | `src/features/wheel/WheelView.tsx` | 369 pt genişlikte dilim adları emojiyle çakışıyor, "Empty Dishwasher" kesiliyor | yazı/emoji yarıçaplarını ayır, uzun adda küçük font/2 satır; gerekirse çark çapını büyüt | M |
| 9 | `src/theme/index.ts` + metin kullanan 17 yer | `danger` 3.53, `success` 2.14, `warn` 2.15, `purple` 4.11 metin rengi olarak AA altında | metin için ayrı roller: `dangerText #DC2626`, `successText #15803D`, `warnText #B45309`, `purpleText #6D4AE8`; dolgu renkleri kalsın | M |
| 10 | `app/new-task.tsx` | başlık ("New Task / Tap to rename") listeyle birlikte kayıyor; referansta sabit | başlık bloğunu `Screen`'in `header`'ına taşı | S |
| 11 | `app/(tabs)/inspire.tsx` / `SectionHeader` | EN bölüm başlığı "Popular cleaning templat…" kesiliyor | kısa başlık (madde 2) ya da `adjustsFontSizeToFit` / 2 satır | S |
| 12 | `app/(tabs)/tools.tsx` | ruh hali başlığı 2 satıra kırılıyor, su kartı ~2x yüksek → Yansıma ilk ekranda görünmüyor | yüz kümesini küçült/`numberOfLines={1}`; su ilerlemesini tek satıra indir | S |
| 13 | `src/theme/index.ts` (`coral`, `pink`, `blue`, `PASTELS`) | referansla aynı rolde neredeyse aynı renkler (Δ 2.4-6.4); düzenle birlikte ticari görünüm benzerliği | yayın öncesi marka geçişi: vurgu ailesini değiştir (mercan/çark pembesi/çark mavisi), pastelleri ton/açıklık olarak kaydır; sonra `contrast.py` yeniden | M |
| 14 | `src/i18n/locales/onboarding.ts`, `app/onboarding.tsx` | sonuç başlığı EN'de 4 satır, halkaları ~200 px itiyor | kısa özgün başlık (madde 1 ile birlikte), `display` → `h1` | S |
| 15 | `app.json` (`android.permissions`) | `RECORD_AUDIO` açıkça isteniyor; uygulama kayıt yapmıyor (README) | izni listeden çıkar / engelle (`android.blockedPermissions` ya da expo-audio eklenti seçeneği — SDK 58 belgesinden doğrula) | S |
| 16 | `app/action.tsx`, `app/onboarding.tsx` | butonlar tam genişlik ve aşağıda; referansta ortalanmış dar grup | isteğe bağlı yatay iç boşluk / dikey merkez | S |

Sıra mantığı: 1-2 ürün kuralı (clean-room metin) ihlali; 3-7 sık görülen ekranlarda AA başarısızlığı, tek dosyalık
küçük işler; 8-12 gerçek düzen kusurları; 13 yayın öncesi marka geçişi; 14-16 düşük öncelik.

## Doğrulanamayanlar

- Referansta görülmeyen ekranlar: Rutin, Profil, şablon detayı, ruh hali kayıt ekranı, görev düzenleyici, araç iç
  ekranları — karşılaştırma yalnız SPEC'e ve koda göre.
- `research/meplus-features.md`'den gelen 10 satır (hatırlatıcı, simge/renk, sınırsız görev, ruh hali takvimi,
  MBTI, uzun onboarding, paywall, widget, AI fotoğraf, Library): kaynak sayfalar hiç okunamamış, doğrulanmadı.
- Düzen puanları web (react-native-web, Chromium) yakalamasından; iOS/Android yerel görünümü ölçülmedi. Referans
  JPEG sıkıştırması ve durum çubuğu puanı etkiliyor (nötrlenmiş ölçüm ayrıca verildi).
- Bildirim, ses, alarm, Supabase senkronu bu denetimde çalıştırılmadı (README'deki sınırlar geçerli).
- Kontrast gradyanlarda tek durak rengine göre ölçüldü; gerçek piksel zemini gradyan boyunca değişir.
