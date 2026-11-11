## Parity: 83.6 / 100

features 98.4  (45 counted, must-haves 10 of 10 done)
layout   24.3  (14 screens compared)

## By area, weakest first
- onboarding                    92.9  (5 features)
- inspire                       96.9  (8 features)
- tools                         98.1  (13 features)
- navigation                   100.0  (1 features)
- routine                      100.0  (4 features)
- new task                     100.0  (6 features)
- action                       100.0  (1 features)
- wheel                        100.0  (4 features)
- streak                       100.0  (2 features)
- profile                      100.0  (1 features)

## Missing, in build order
- [could] inspire: MBTI kişilik testiyle rutin önerisi, partial  (doğrulanmadı (research §1). MBTI yok; tanı koymayan mini testler sonuçta şablon önerir (app/inspire/quiz/[id].tsx r.templates) ama kişilik tipi / tam rutin önerisi yok)
- [could] onboarding: Uzun kişiselleştirme akışı (bildirim izni adımı, uyku süresi seçimi, rutin önizlemesi), partial  (doğrulanmadı (research/meplus-features.md §2, teardown özeti). All2Me: dil, ad/avatar, 7 soru, sonuç, önerilen görevler, partner. Eksik: uyku süresi adımı, rutin önizlemesi; bildirim izni ilk hatırlatıcı kurulurken isteniyor)
- [could] tools: Alarm, partial  (s05 ikon. app/tools/alarm.tsx saat+gün+etiket ama yerel bildirim: sessiz/rahatsız etme modunda çalmayabilir, uygulama kapalıyken gerçek saat alarmı değil (README bilinen sınırlar; Expo Go kısıtı))

## Left out on purpose (not scored)
- Sosyal kanıt blokları (certified by, 30M+, %94): s01. Sahte istatistik + başka markanın adı; SPEC §1 yasaklar
- Onboarding sonu paywall ve çıkış teklifi: doğrulanmadı (research §2). Ücretli sürüm yok, tüm özellikler açık (ürün kuralı)
- Video içerikli bölüm (oynat düğmeli kartlar): s07 'To be Organized'. Lisanslı/üçüncü taraf video içeriği klonlanmaz; aynı bölüm metin şablonlarıyla dolu
- Tanı koyan psikolojik testler (çocukluk travması, DEHB): s15. SPEC §1: tanı koyan test yok; yerine tanı koymayan mini testler (eklenenler satırı)
- Fotoğraftan temizlik planı (AI): doğrulanmadı, güvenilmez kaynak (research §1); ağ/API anahtarı gerektirir, çevrimdışı ilkeye aykırı
- 'Library' bölümü: doğrulanmadı (research §1 tek kullanıcı yorumu); kapsamı bilinmiyor, karşılaştırılamaz
- Kilit ekranı / ana ekran widget'ları: doğrulanmadı (research §1). Expo Go'da native widget yok
- VIP abonelik, 7 gün deneme, paywall: Ürün kuralı: ücretli sürüm yok, kilit/paywall/reklam yok

## Yours, not in the original (not scored)
- İki kişilik eşleşme + Supabase senkronu (yerel mod, demo partner)
- İki kişilik puan yarışı: günlük/haftalık/aylık, şampiyonluk rafı, dürt/tebrik
- Puan motoru, seri çarpanı, seviye/XP, 40 rozet, istatistik
- Haftalık gün şeridi + 'unuttum hakkı' (dün için)
- Gelişmiş görev düzenleyici: tekrar, haftalık kota, tür, zorluk, özel, birlikte
- Birden çok çark (ev işleri, kendine bakım, hareket)
- Tanı koymayan 'kendini tanı' mini testleri
- Dil seçimi TR/EN
- Açık/koyu tema, ml/oz, verileri sıfırla
- Yaşam merkezi (/life) + rutin özet şeridi
- Sigara azaltma: plan, istek erteleme, biriken para, tetikleyiciler, en zor saatler
- Ev yemeği / fast food: öğün kaydı, haftalık hedef, menü planı, fikirler, alışveriş listesi
- Ev işleri: tekrarlı işler, çamaşır ve bulaşık makinesi akışı
- Okul / yüksek lisans: dersler, ödev/makale/sınav, okuma listesi, tez kilometre taşları
- İş ve kişisel gelişim: hedefler, 3 önemli iş, öğrenme listesi, haftalık değerlendirme
- Bildirim grupları + Ayarlar'da ana anahtar

## Screens
- clone/onb-done.png                         7.6
- clone/newtask-scrolled.png                11.6
- clone/action.png                          14.5
- clone/newtask.png                         17.1
- clone/onb-q-habits.png                    18.6
- clone/onb-q-organize.png                  18.7
- clone/onb-result.png                      25.1
- clone/wheel.png                           27.9
- clone/wheel.png                           27.9
- clone/inspire.png                         28.3
- clone/tools.png                           32.5
- clone/tools.png                           33.6
- clone/inspire.png                         33.6
- clone/streak.png                          43.7

## Not (denetçi)

- Komut: `python3 -I replica-diff/parity.py replica/features.csv --visual shots/rdiff/json/*.json --markdown`
  (JSON'lar `imgdiff.py --json` çıktısı; `shots/` gitignore'da).
- **Eksik "must" yok: 10/10 must tamam.** Eksikler yalnız 3 "could" satırı (partial): MBTI tarzı kişilik testi
  (doğrulanmadı), uzun onboarding kişiselleştirmesi (doğrulanmadı), Alarm (yerel bildirim sınırı).
- Özellik puanı 98.4; genel 83.6'yı aşağı çeken düzen puanı (24.3). Düzen puanı bu araçla düşük çıkıyor çünkü
  hücre bazlı kenar yoğunluğu içerik/illüstrasyon/metin uzunluğuna çok duyarlı: referansın kendi iki ekranı
  arasında bile (s02↔s03, aynı düzen farklı görsel) 59.3, aynı ekranın farklı kaydırması (s07↔s13) 42.4
  çıkıyor. Ayrıntı ve bölge yorumları: `replica/diff.md`.
- Durum çubuğu nötrlenmiş + güvenli alan kaydırmalı ikinci ölçümde düzen 25.1, genel 83.7 (fark ihmal edilebilir).
- "original=yes" satırlarının 10'u referans görüntülerde görülmeyen, `research/meplus-features.md`'den gelen ve
  notlarda "doğrulanmadı" diye işaretli satırlardır (6'sı skorlanıyor, 4'ü skip). Ayrıca 5 satır yalnız sekme adı/ikonu görülüp içeriği görülmeyen özelliklerdir (Rutin, Profil, Zamanlayıcı, Uyku, şablon detayı).
