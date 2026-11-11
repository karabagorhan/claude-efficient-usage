# Recon map: Me+ (referans) → All2Me (iOS ekran görüntüleri; klon Expo / iOS-Android-web)

Scope: referans görüntülerde görülen ana döngü (rutin + yeni görev + çark + harekete geç + ilham + araçlar +
seri + onboarding) ve SPEC'te "ücretli sürüm" kapsamında sayılan özellikler; artı All2Me'nin kendi eklemeleri
(yaşam takibi, iki kişilik puan yarışı).
For: iki kişilik kullanım (kullanıcı + partneri), TR/EN; ücretli sürüm yok, tüm özellikler açık.
Date: 2026-11-11

Kural: clean-room. Referans görselleri yalnız düzen/his içindir; repoya eklenmedi. Me+ adı, logosu, maskotu,
metinleri, illüstrasyonları kullanılmaz (bkz. `brand-sweep.md` §3: EN metinlerde bulgu var).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | kullanıcının kendi hesabından 17 ekran görüntüsü (s01-s17) | — (scratchpad, repoya eklenmedi) | iPhone, EN arayüz, 2026-11-10 19:08-19:16; birincil kaynak |
| 2 | `research/meplus-features.md` (mağaza/üçüncü taraf özetleri) | apps.apple.com/us/app/me-lifestyle-routine/id1596403446 ve dosyadaki diğerleri | o oturumda sayfalar **okunamadı**, yalnız arama özetleri; buradan gelen her satır "doğrulanmadı" |
| 3 | `docs/SPEC.md` §2-§3 | — | görüntülerden çıkarılmış ekran tarifi + "ücretli sürüm davranışı" notları |
| 4 | App Store / Play / yardım merkezi / fiyat sayfası | — | bu turda okunmadı (ağ isteği yapılmadı) |

## Core loop

Günün rutin görevlerini (öneri, şablon ya da çarktan) ekleyip tek dokunuşla tamamlamak ve seriyi sürdürmek.
All2Me'de buna puan + partnerle günlük/haftalık yarış eklenir.

## Screens (referans)

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Onboarding sonuç | onboarding soruları sonrası (s01) | cevaplardan 4 alanlı özet | 2x2 halka gösterge + mercan hap etiket, sosyal kanıt satırı, siyah "Continue →" | filled (dört alan da "Could be better") |
| S02 | Onboarding evet/hayır sorusu | onboarding (s02, s03) | ihtiyaç toplama | geri oku, 2 satır başlık, ikiye bölünmüş önce/sonra illüstrasyonu, "No" çerçeveli + "Sure! Let's go!" siyah | 2 soru görüldü |
| S03 | Onboarding kutlama | onboarding sonu (s08) | tamamlama | ortada metin, konfeti | animasyon |
| S04 | Harekete geç | çarktan/görevden (s04) | tek görevi şimdi yap | ×, büyük beyaz başlık, eğik pastel görev kartı + boş onay dairesi, "Mark as Done" / "Do It Later", maskot | görev seçili |
| S05 | Araçlar (Self-Care Tools) | sekme 4 (s05, s06) | araç merkezi | afiş karuseli + noktalar, yatay araç kutuları (9), ruh hali kartı (yüz kümesi + "+"), su kartı (illüstrasyon + ›), "Reflection / All ›" yatay konu kartları (kilitli konu) | iki kaydırma konumu |
| S06 | İlham (Inspire) | sekme 2 (s07, s13, s14, s15, s17) | şablon keşfi | başlık + arama + kalp, afiş karuseli, kategori kutuları, bölüm başlığı + "All ›", yatay dikey poster kartları, video kartları, test kartları | 5 kaydırma konumu |
| S07 | Çark (Fun Chore Wheel) | ortadaki sekme → tam ekran modal (s09, s12) | rastgele ev işi | pembe gradyan, ×, sıfırla + düzenle ikonları, mavi dalgalı çerçeveli 10 dilimli çark, ortada maskot, sonuç şeridi, "Let's Spin (1/3)" / "Get More Spins (0/3)", yenilenme geri sayımı | hak var / hak bitti |
| S08 | Yeni Görev | rutin "+" (varsayım) → sayfa modal (s10, s11) | görev ekleme | soluk başlık + "Tap to rename", AI planlayıcı gradyan kartı, şanslı görev kartı, bağlı araç kartları (0/73oz, 0/1), "Anytime" pastel öneri kartları, "Goal: 0/1 times" | üst + kaydırılmış; başlık sabit |
| S09 | Seri (Streak) | rutin seri rozeti (varsayım) → sayfa modal (s16) | seri motivasyonu | turuncu ışınlı gradyan, alev, büyük sayı + "day streak", kupa afişi, "Streak Calendar" ay görünümü (Pazar başlangıç), ay gezinme | 1 günlük seri |
| S10 | Rutin | sekme 1 | ana pano | — | **görülmedi** (yalnız sekme adı) |
| S11 | Profil | sekme 5 | — | — | **görülmedi** (yalnız sekme adı) |

All2Me karşılıkları ve ek ekranlar: S01-S03 → `app/onboarding.tsx` (dil, profil, 7 soru, sonuç, önerilen
görevler, partner, kutlama); S04 → `app/action.tsx`; S05 → `app/(tabs)/tools.tsx` + `app/tools/*` (12 araç
ekranı); S06 → `app/(tabs)/inspire.tsx` + `app/inspire/*`; S07 → `app/(tabs)/wheel.tsx` + `app/wheel-edit.tsx`;
S08 → `app/new-task.tsx`, `app/task/[id].tsx`, `app/planner.tsx`, `app/lucky.tsx`; S09 → `app/streak.tsx`;
S10 → `app/(tabs)/index.tsx`; S11 → `app/(tabs)/profile.tsx`, `app/settings.tsx`, `app/badges.tsx`,
`app/stats.tsx`. Yalnız All2Me: `app/duel.tsx`, `app/pairing.tsx`, `app/life/*` (merkez, sigara, yemek, ev
işleri), `app/study/*`, `app/growth/*`.

## Flows

```
F01 İlk kurulum
    S02 (soru x N) -> S01 sonuç -> [ödeme duvarı: doğrulanmadı] -> S03 kutlama -> S10
    happy path clicks (referans): görülen kısım soru başına 1 + Continue 1; tam uzunluk doğrulanmadı (teardown "37 adım")
    All2Me: dil 1 + profil (ad yaz) 1 + 7 soru 7 + sonuç 1 + görevler 1 + partner/atla 1 + otomatik bitiş = 12
    edge: geri dönme, tüm cevaplar "Hayır" (All2Me: hepsi "Harika"), ad boş (All2Me: Devam kapalı)

F02 Öneriden görev ekle
    S10 + -> S08 öneri kartı -> [düzenleyici: referansta görülmedi] -> S10
    happy path clicks: All2Me 3 (+, kart, Kaydet)
    edge: aynı görev zaten ekli (All2Me "Added"), özel ad ("Tap to rename")

F03 Çarkla ev işi
    S07 Let's Spin -> sonuç şeridi -> S04 Mark as Done
    happy path clicks: referans 2-3 (sekme + çevir + tamamla); All2Me 3 (sekme, çevir, Harekete Geç otomatik açılır, tamamla)
    edge: hak bitti (referans: 0/3 + geri sayım; All2Me: sınırsız, günde 5'ten sonra puan yok), "Sonra yap"

F04 Şablondan rutine ekle
    S06 kart -> şablon detayı [referansta görülmedi] -> ekle
    All2Me: 3 (kart, "Hepsini rutine ekle", geri)

F05 Ruh hali kaydı
    S05 "How do you feel?" -> kayıt ekranı [görülmedi]
    All2Me: 3 (kart, seviye, kaydet)

F06 Seri görüntüleme
    S10 seri rozeti [varsayım] -> S09, ay gezinme
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Hap buton | primary (siyah), outline (beyaz + 1.5 siyah çerçeve), oklu | default, pressed, disabled | S01, S02, S04, S07 |
| Pastel görev kartı | 7 pastel; sağda › / onay dairesi | normal, eklenmiş (All2Me) | S08, S04 |
| Gradyan özellik kartı | AI planlayıcı, şanslı görev | — | S08 |
| İkon kutusu (squircle + emoji + etiket) | pastel / koyu | — | S05, S06 |
| Afiş karuseli + sayfa noktaları | — | sayfa 1..n | S05, S06 |
| Bölüm başlığı + "All ›" | — | — | S05, S06 |
| Dikey şablon (poster) kartı | liste, ızgara, onay kutulu | — | S06 |
| Halka gösterge + hap etiket | 3 seviye | — | S01 |
| Çark (SVG) | 10 dilim, merkez maskot, dalgalı çerçeve | durgun, dönüyor, sonuç | S07 |
| Ay takvimi | seri günleri dolu daire, bugün | önceki/sonraki ay | S09 |
| Alt sekme çubuğu | 5 sekme, ortada renkli çark + pembe hap | etkin siyah, pasif gri | S05-S07 |
| Ruh hali yüz kümesi + "+" | — | — | S05 |
| Konfeti | — | — | S03 |
| Modal başlıkları | × kapat, ↩ geri | — | S02, S04, S07, S08, S09 |

## Inferred data model

```
Task       id, title, icon(emoji), color(pastel), slot ("Anytime"), kind (check | counter "Goal: 0/1 times"),
           target, linked tool (water 0/73oz, mood 0/1, reflection 0/1)
           evidence: S08 kartları; confidence: high (alanlar), guess (tekrar/hatırlatıcı: research §1, doğrulanmadı)
Completion task_id, day, value
           evidence: S04 onay dairesi, S09 takvim; confidence: medium
Wheel      slices[10] (emoji, name), spins_left (3), refresh_at (geri sayım), last_result
           evidence: S07; confidence: high
Template   section, title, items[] (emoji/görsel + ad), favorite
           evidence: S06; confidence: medium (detay ekranı görülmedi)
MoodEntry  day, level (5 yüz), [tags/note: guess]
           evidence: S05; confidence: medium
Water      goal (73 oz), unit (oz), intake
           evidence: S08 "0/73oz"; confidence: high
Reflection topic (title, subtitle, locked)
           evidence: S05 kilitli konu; confidence: medium
Streak     türetilmiş: tamamlanan günler; evidence: S09; confidence: high
```

Relationships: User 1-n Task, Task 1-n Completion, User 1 Wheel(s), Template n-n User (favori),
User 1-n MoodEntry. All2Me ek: Pair 1-2 User, PointEvent, Badge, Nudge (senkronlu çekirdek); araç ve yaşam takibi
dilimleri yalnız cihazda (smoke, meals, chores, study, growth, sleep, drink, mood…).

## Feature matrix

See `features.csv` (69 satır). Referans özellikleri (original=yes, 53): must 10, should 27, could 16
(bunların 8'i skip, 3'ü partial). All2Me eklemeleri (original=no): 16. `clone` sütunu kod okunarak
dolduruldu; referansta görülmeyen satırlarda not "doğrulanmadı".

## Out of scope (cannot or should not be cloned)

- Sahte sosyal kanıt ("30M+", "94%", "Certified by …") — S01.
- Tanı koyan psikolojik testler (çocukluk travması, DEHB) — S06; yerine tanı koymayan mini testler.
- Paywall, VIP abonelik, deneme, çıkış teklifi, çevirme hakkı satışı.
- Lisanslı/üçüncü taraf video ve poster içerikleri (S06 "To be Organized" videoları, fotoğraflı posterler).
- AI asistan / fotoğraftan temizlik planı (ağ + API; All2Me çevrimdışı kural tabanlı planlayıcı kullanır).
- Kilit ekranı / ana ekran widget'ları (Expo Go'da yok).
- Marka: ad, "M" logosu, gözlüklü kuş maskotu, illüstrasyonlar, metinler.

## Size

Referans ekran 11 (2'si görülmedi), akış 6, varlık 8. Zor kısımlar: çark animasyonu ve sonuç doğruluğu,
iki kişilik senkron (Supabase, çakışma), çok sayıda yerel bildirim grubu (Expo Go sınırları), 60+ iki dilli
şablon içeriği. Boyut: M (klon zaten büyük ölçüde yapılmış; kalan iş metin/renk marka geçişi ve küçük düzen
düzeltmeleri).
