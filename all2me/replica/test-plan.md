# Test planı: All2Me (Expo, web önizleme üzerinden)

Build: çalışma ağacı (git commit'siz)  Tarih: 2026-11-11  Env: yerel, tohum veri, `expo export --platform web` + Playwright Chromium 390x844

Yöntem: replica-test (rutin akışları SPEC §3 ve §6'dan çıkarıldı; her akışa mutlu yol + uç durum + olumsuz durum). Testler `e2e/` altında düz Node betikleri (`node:assert`),
çalıştırma: `node e2e/run.mjs [filtre]` (ayrıntı: `e2e/run.mjs` başlığı). Ekran görüntüleri `shots/rtest/`. Sonuç sütunu son tam koşudan alınır.

Kimlik biçimi: `F<akış>-H<n>` mutlu yol, `F<akış>-E<n>` uç durum / olumsuz, `F<akış>-Q<n>` test (quiz) yolu, `SMK-<rota>-<dil>` duman.
Ortak kural (her testte): sayfada `pageerror` yok, konsolda "Maximum update depth" / "getSnapshot" / "Cannot update a component" yok, `console.error` yok.
Duman testlerinde ek: görünür metinde ham i18n anahtarı (`ns.key`) yok, yatay taşma yok (document.scrollWidth <= 390 ve yatay kaydırıcısı olmayan taşan öğe yok).

Genel uç durum listesi (replica-test: "her akış için aşağıdan uygun olanlar") ve karşılığı:

| uç durum | nerede |
| --- | --- |
| boş giriş / yalnız boşluk | F02-E4, F01-E2, F08-E1, F17-E1, F15-H4, F16-E1 |
| çok uzun giriş, emoji, aksan | F02-E4, F23-E1, F10-E2, F06-E2 |
| çift dokunma / çift tamamlama | F02-E1, F02-E2, F03-E3, F15-E1 |
| iki sekme aynı anda | F23-E5 |
| geri tuşu / yenileme yarıda | F23-E4, F23-E6, F13-E6 |
| çevrimdışı | F23-E2 (uygulama yerel öncelikli) |
| saat dilimi, gün sınırı 03:00 | F02-E12..E14, F13-E4, F04-E3 |
| mobil genişlik (390) | SMK-*, F23-E1, F23-E7, F21-E1 |
| klavye ile kullanım | F23-E3 |
| ekran okuyucu etiketleri | manuel + bulgular (bugs.md, BUG-009) |
| başka kullanıcının verisi görünmez | F18-E3 (partnerin özel görevi) |


## F01 Onboarding (SPEC 3.1)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F01-H1-tr | F01 | mutlu yol | onboarding tam akış (TR) | e2e (onboarding) | geçti |
| F01-H1-en | F01 | mutlu yol | onboarding tam akış (EN) | e2e (onboarding) | geçti |
| F01-E1 | F01 | uç durum | onboarding: dil değişince metin hemen değişir, geri tuşu çalışır | e2e (onboarding) | geçti |
| F01-E2 | F01 | uç durum | onboarding: ad yalnız boşluksa devam edilemez; çok uzun ad kısıtlanır (maxLength 24) | e2e (onboarding) | geçti |

## F02 Görevler: ekle, düzenle, sil, tamamla, geri al, puan, sayaç, süreli, kota, geçmiş gün, gün sınırı (3.2-3.4)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F02-H1 | F02 | mutlu yol | öneriden görev ekle (＋ → öneri → düzenleyici → kaydet) ve ana ekranda görünür | e2e (tasks) | geçti |
| F02-H2 | F02 | mutlu yol | özel adlı görev: "Yeniden adlandırmak için dokun" → ad yaz → kaydet | e2e (tasks) | geçti |
| F02-H3 | F02 | mutlu yol | görev tamamla → +puan, ilerleme güncellenir; tekrar dokun → geri al, puan düşer | e2e (tasks) | geçti |
| F02-E1 | F02 | uç durum | çift tıklama (double click) görevi tamamlı bırakır, puan tek kez sayılır | e2e (tasks) | KALDI → BUG-003 çift dokunuş tamamlamayı geri alır |
| F02-E2 | F02 | uç durum | onay dairesine çift hızlı dokunuş çift puan vermez (en çok bir tamamlama puanı) | e2e (tasks) | geçti |
| F02-E3 | F02 | uç durum | görev düzenle (uzun bas): ad + zaman dilimi değişir; sil = arşivle, geçmiş puan kalır | e2e (tasks) | geçti |
| F02-E4 | F02 | uç durum | düzenleyici doğrulama: boş ad, geçersiz saat, gün seçilmedi → Kaydet kapalı; uzun ad 60 ile sınırlı | e2e (tasks) | geçti |
| F02-E6 | F02 | uç durum | sayaç görevi: hedefe kadar dokun, tamamlanır | e2e (tasks) | geçti |
| F02-E7 | F02 | uç durum | süreli görev: dokununca zamanlayıcıyı açar (habitId, dakika) | e2e (tasks) | geçti |
| F02-E8 | F02 | uç durum | haftalık kota görevi: "Haftalık hedefler" bölümü, 0/3 → tamamla → 1/3 | e2e (tasks) | geçti |
| F02-E9 | F02 | uç durum | haftalık kota tamamlanınca haftalık bonus (+25) bir kez verilir; geri alınca düşer | e2e (tasks) | geçti |
| F02-E10 | F02 | uç durum | geri alma mükemmel gün bonusunu düşürür | e2e (tasks) | geçti |
| F02-E11 | F02 | uç durum | geçmiş gün salt okunur: dünü seç → kilit notu, dokunmak tamamlamaz (saat 12:00 → unuttum hakkı yok) | e2e (tasks) | geçti |
| F02-E12 | F02 | uç durum | unuttum hakkı: sabah 08:00 dün seçilir → bant görünür, tamamlama %70 puan; haftada bir kez | e2e (tasks) | geçti |
| F02-E13 | F02 | uç durum | gün sınırı 03:00: 02:30'da yapılan görev önceki güne yazılır, 03:05'te yeni gün | e2e (tasks) | geçti |
| F02-E14 | F02 | uç durum | gün sınırı: 03:05'te yeni günün anahtarı kullanılır | e2e (tasks) | geçti |
| F02-E15 | F02 | uç durum | boş durum: görev yokken maskot + "İlk görevini ekle" → Yeni Görev | e2e (tasks) | geçti |
| F02-E16 | F02 | uç durum | yeni görev ilk 24 saat %50 puan; özel (private) görev partner için maskelenir bayrağı kaydedilir | e2e (tasks) | geçti |

## F03 Harekete Geç (3.5)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F03-H1 | F03 | mutlu yol | Harekete Geç (görev): Tamamlandı → görev tamamlanır, "+N puan kazandın", ekran kendiliğinden kapanır | e2e (bonus) | geçti |
| F03-H2 | F03 | mutlu yol | Harekete Geç (görev): "Sonra yap" hiçbir şey kaydetmez | e2e (bonus) | geçti |
| F03-E1 | F03 | uç durum | Harekete Geç: zaten tamamlanmış görev → Tamamlandı devre dışı + "zaten tamamladın" notu | e2e (bonus) | geçti |
| F03-E2 | F03 | uç durum | Harekete Geç: arşivlenmiş / olmayan görev ve eksik parametre → "bulunamadı" mesajı, çökme yok | e2e (bonus) | geçti |
| F03-E3 | F03 | uç durum | bonus Harekete Geç: aynı bonusId ikinci kez puan vermez | e2e (bonus) | geçti |

## F04 Çark + günlük bonus tavanı (3.6)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F04-H1 | F04 | mutlu yol | çark çevir: dön → sonuç şeridi → Harekete Geç (bonus) → Tamamlandı → +10 puan | e2e (bonus) | geçti |
| F04-H2 | F04 | mutlu yol | çark: sonuç şeridi, durduğu dilimle Harekete Geç başlığı aynı | e2e (bonus) | geçti |
| F04-E1 | F04 | uç durum | çark bonusu günlük tavan: 5 çark görevi puanlanır, 6.sı "bonus sınırı" uyarısı verir ve puan vermez | e2e (bonus) | geçti |
| F04-E2 | F04 | uç durum | çark + şanslı görev tavanları ayrı sayılır (wheel 5, lucky 3) | e2e (bonus) | geçti |
| F04-E3 | F04 | uç durum | bonus tavanı gün sınırında sıfırlanır (ertesi gün tekrar puan verir) | e2e (bonus) | geçti |
| F04-E4 | F04 | uç durum | çark sekmeleri (Ev işleri / Kendine bakım / Hareket): başlık ve dilimler değişir | e2e (bonus) | geçti |
| F04-E5 | F04 | uç durum | çark düzenle: dilim ekle, yeniden adlandır, sil; en az 4 dilim; varsayılana dön | e2e (bonus) | geçti |
| F04-E6 | F04 | uç durum | çark sıfırla düğmesi (sağ üst): onay kutusu açılır, vazgeç kapatır | e2e (bonus) | geçti |

## F05 Şanslı görev (3.3)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F05-H1 | F05 | mutlu yol | şanslı görev: kartlar karışır → bir görev çıkar → Bunu yap → Tamamlandı → +10 | e2e (bonus) | geçti |
| F05-E1 | F05 | uç durum | şanslı görev: "Yeniden çevir" yeni bir kart verir (aynı kart art arda gelmez) | e2e (bonus) | geçti |

## F06 İlham: şablon, favori, arama, kategori, test (3.7)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F06-H1 | F06 | mutlu yol | İlham sekmesi: başlık, kategori ikonları, bölümler, afiş görünür | e2e (inspire) | geçti |
| F06-H2 | F06 | mutlu yol | şablon detayı: tek madde ekle → "Eklendi"; "Hepsini rutine ekle" kalan maddeleri ekler; tekrar eklenmez | e2e (inspire) | geçti |
| F06-H3 | F06 | mutlu yol | favori: kalbe dokun → Favoriler listesinde; tekrar dokun → kalkar | e2e (inspire) | geçti |
| F06-E1 | F06 | uç durum | arama: Türkçe İ/ı ve aksan duyarsız (ODEV, ödev, SINAV, ısınma/ISINMA, GECESİ, şükran) | e2e (inspire) | geçti |
| F06-E2 | F06 | uç durum | arama: sonuç yok → boş durum; boşluklar/emoji/çok uzun sorgu çökmez; ?q= parametresi | e2e (inspire) | geçti |
| F06-E3 | F06 | uç durum | arama: madde adıyla da bulur; EN dilinde İngilizce başlıkla bulur | e2e (inspire) | geçti |
| F06-E4 | F06 | uç durum | kategori sayfası: kategori şablonları listelenir ve karta dokununca detay açılır | e2e (inspire) | geçti |
| F06-E5 | F06 | uç durum | olmayan şablon / test / kategori kimliği: "bulunamadı" boş durumu, çökme yok | e2e (inspire) | geçti |
| F06-Q1 | F06 | mutlu yol | test (quiz): 7 soruyu yanıtla → sonuç + öneri şablonları + tanı değildir notu; sonuç saklanır; tekrar çöz | e2e (inspire) | geçti |
| F06-Q2 | F06 | mutlu yol | test (quiz): Geri butonu önceki soruya döner (EN) | e2e (inspire) | geçti |

## F07 Akıllı planlayıcı (3.12)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F07-H1 | F07 | mutlu yol | akıllı planlayıcı: 4 soru → saatli plan → "Rutinime ekle" görevleri ekler (source=planner) | e2e (tools) | geçti |
| F07-E1 | F07 | uç durum | planlayıcı: "Yeniden oluştur" farklı plan üretir; geri butonu cevapları korur; plan her seferinde boş değil (EN) | e2e (tools) | geçti |
| F07-E2 | F07 | uç durum | planlayıcı: alan seçmeden de plan üretir; tüm görevleri çıkarınca "Rutinime ekle" kapanır | e2e (tools) | geçti |

## F08 Su takibi + bağlı görev (3.8)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F08-H1 | F08 | mutlu yol | su: bardak ekle → miktar artar, bağlı "Su iç" görevi ilerler; hedefe ulaşınca görev otomatik tamamlanır | e2e (tools) | geçti |
| F08-E1 | F08 | uç durum | su: özel miktar (330), geçersiz/0/negatif/harf miktar eklenmez; geri al son kaydı siler | e2e (tools) | KALDI → BUG-008 negatif su miktarı 1 ml kaydı |
| F08-E2 | F08 | uç durum | su: günlük hedefe ulaşıp "Geri al" → bağlı görev tamamlanmış kalmamalı (tutarlılık) | e2e (tools) | KALDI → BUG-002 su geri al bağlı görevi geri almıyor |
| F08-E3 | F08 | uç durum | su: birim oz → miktarlar oz gösterilir, kayıt ml olarak doğru saklanır | e2e (tools) | geçti |
| F08-E4 | F08 | uç durum | su hedefi ayarlama ± ve hatırlatıcı seçimi saklanır | e2e (tools) | geçti |

## F09 Ruh hali (3.8)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F09-H1 | F09 | mutlu yol | ruh hali: seviye + etiket + not → kaydet; bağlı "Ruh hali" görevi tamamlanır; kayıt listede | e2e (tools) | geçti |
| F09-E1 | F09 | uç durum | ruh hali: Araçlar ekranındaki hızlı yüz kartı da kaydeder; takvimde ay gezinme gelecek aya geçmez | e2e (tools) | geçti |

## F10 Yansıma (3.8)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F10-H1 | F10 | mutlu yol | yansıma: konu seç → cevap yaz → kaydet → geçmişte görünür; bağlı görev tamamlanır; düzenle; sil | e2e (tools) | geçti |
| F10-E1 | F10 | uç durum | yansıma silme: çöp kutusu düğmesi etiketi onay sorar ("silinsin mi?") ama tek dokunuşla siler | e2e (tools) | KALDI → BUG-005 silme onaysız |
| F10-E2 | F10 | uç durum | serbest yazı: konusuz kayıt; çok uzun metin ve satır sonları korunur | e2e (tools) | geçti |

## F11 Zamanlayıcı / süreli görev (3.8)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F11-H1 | F11 | mutlu yol | zamanlayıcı: hazır süre seç → başlat → duraklat → devam → sıfırla; süre dolunca seans kaydedilir | e2e (tools) | geçti |
| F11-E1 | F11 | uç durum | zamanlayıcı: süreli görev bağlıyken süre dolunca görev tamamlanır; "süreyi beklemeden tamamlandı say" | e2e (tools) | geçti |
| F11-E2 | F11 | uç durum | zamanlayıcı: Pomodoro modu 25:00 çalışma gösterir; sıfırla süreyi geri getirir | e2e (tools) | geçti |

## F12 Alarm (3.8)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F12-H1 | F12 | mutlu yol | alarm: ekle (:30, Pzt+Çar, etiket) → listede; aç/kapa; düzenle; sil → boş durum | e2e (tools) | geçti |
| F12-E1 | F12 | uç durum | alarm: gün seçmeden "bir kez" alarm sonraki 07:00-gibi tek seferlik; iptal (X) kayıt eklemez | e2e (tools) | geçti |
| F12-E2 | F12 | uç durum | alarm: listedeki aç/kapa anahtarına dokunmak düzenleme ekranını açmamalı | e2e (tools) | KALDI → BUG-006 anahtar tıklaması kartın onPress'ine sızıyor (web) |

## F13 Sigara azaltma (6.2)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F13-H1 | F13 | mutlu yol | sigara kurulumu: varsayılanlarla başla → panelde 0/15, plan önizlemesi, "Plana başlayalı" süresi | e2e (smoke-tracker) | geçti |
| F13-H2 | F13 | mutlu yol | sigara kaydı: "Bir sigara içtim" → 1/N; tetikleyici seç; geri al → 0/N | e2e (smoke-tracker) | geçti |
| F13-E1 | F13 | uç durum | sigara limit aşımı: limit 2 iken 3. kayıt → "Bugün limit aşıldı", halka aşım rengi, gün kapatma düğmesi yok | e2e (smoke-tracker) | geçti |
| F13-E2 | F13 | uç durum | günü kapat: 12:00'de kapalı ("18:00'dan sonra"), 19:00'da açık → bağlı görev tamamlanır, tekrar kapatılamaz | e2e (smoke-tracker) | geçti |
| F13-E3 | F13 | uç durum | günü kapat (19:00): "Bugün limitimde kaldım" → kapandı, bağlı görev tamamlanır (puan) | e2e (smoke-tracker) | geçti |
| F13-E4 | F13 | uç durum | günü kapat: ertesi gün 02:30'a kadar önceki günü kapatabilir (gün sınırı 03:00) | e2e (smoke-tracker) | geçti |
| F13-E5 | F13 | uç durum | direnme: "İstek geldi, içmedim" → 5 dk sayaç → "Direndim" → +2 bonus; 5/gün tavan, 6. direnme puansız + uyarı | e2e (smoke-tracker) | geçti |
| F13-E6 | F13 | uç durum | direnme sayacı: sayfa yenilense de bitiş zamanı korunur; "Yine de içtim" sayaç kapatır ve kaydeder | e2e (smoke-tracker) | geçti |
| F13-E7 | F13 | uç durum | azaltma planı: 14 gün önce başlayan plan (15→5, 7 günde 1) bugünkü limit 13; yarınki limit gösterilir | e2e (smoke-tracker) | geçti |
| F13-E8 | F13 | uç durum | kurulum doğrulama: paket fiyatı 0/boş → Başla kapalı; hedef başlangıçtan büyük olamaz; para birimi dile göre ($ EN) | e2e (smoke-tracker) | geçti |

## F14 Ev yemeği / fast food, menü, alışveriş (6.3)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F14-H1 | F14 | mutlu yol | ev yemeği kaydı: öğle + Ev yemeği → bugünün kayıtlarında, haftalık sayaç 1, bağlı görev tamamlanır | e2e (meals) | geçti |
| F14-H2 | F14 | mutlu yol | fast food + not + tutar: aylık harcama güncellenir; haftalık hedef (en çok 2) aşılınca sayaç 3 / en çok 2 | e2e (meals) | geçti |
| F14-H3 | F14 | mutlu yol | "Atlandı" ve "Dışarıda sağlıklı" kaydı görevi tamamlamaz; kayıt silinebilir | e2e (meals) | geçti |
| F14-E1 | F14 | uç durum | ev yemeği kaydını silince bağlı görev tamamlanmış kalmamalı (tutarlılık) | e2e (meals) | KALDI → BUG-002 yemek kaydı silinince bağlı görev duruyor |
| F14-H4 | F14 | mutlu yol | haftalık menü: "Boşları rastgele doldur" 14 kutuyu doldurur; kutu seç/kaldır; Temizle; 30+ fikir; süre filtresi | e2e (meals) | geçti |
| F14-H5 | F14 | mutlu yol | alışveriş listesi: menü boşken boş durum; menüden malzemeler birleşir; işaretle → "n / N alındı"; işaretleri temizle | e2e (meals) | geçti |
| F14-E2 | F14 | uç durum | EN: para birimi $ ve ayarlar sayfası (hedef steppers) açılır | e2e (meals) | geçti |

## F15 Ev işleri (6.4)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F15-H1 | F15 | mutlu yol | ev işleri: en az 18 varsayılan iş; Bugün/Yakında grupları; haftalık hedef görünür | e2e (chores) | geçti |
| F15-H2 | F15 | mutlu yol | iş yap: kart "Bugün"den çıkar, son yapılma güncellenir, +2 bonus, bağlı görev tamamlanır, haftalık sayı 1 | e2e (chores) | geçti |
| F15-E1 | F15 | uç durum | aynı işi aynı gün iki kez "yaptım" işaretlemek ikinci kayıt/puan oluşturmaz | e2e (chores) | KALDI → BUG-004 aynı gün çift iş kaydı |
| F15-H3 | F15 | mutlu yol | ertele: "Yarına ertele" işi Yakında'ya taşır; Özet'te "en çok ertelenenler"de görünür | e2e (chores) | geçti |
| F15-H4 | F15 | mutlu yol | iş ekle / düzenle / sil: yeni iş listede, adı ve aralığı değişir, silinince kalkar | e2e (chores) | geçti |
| F15-H5 | F15 | mutlu yol | alan filtresi: Banyo seçilince yalnız banyo işleri; "Hepsi" geri getirir | e2e (chores) | geçti |
| F15-H6 | F15 | mutlu yol | çamaşır döngüsü: başlat → makine sayacı → süre dolar → 4 adımı bitir → tamamlandı bildirimi; her adım bir işi yapar | e2e (chores) | geçti |
| F15-E2 | F15 | uç durum | bulaşık makinesi akışı: sayacı iptal et, akışı sıfırla; sayfa yenilenince adım korunur | e2e (chores) | geçti |

## F16 Okul / yüksek lisans (6.5)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F16-H1 | F16 | mutlu yol | okul panosu: gecikmiş teslim kırmızı sayaç ("1 gün gecikti"), yaklaşan teslimler, okuma listesi ilerlemesi | e2e (study) | geçti |
| F16-H2 | F16 | mutlu yol | öğeyi bitir (onay dairesi): bonus +20, bağlı görev tamamlanır; geri al → bonus düşer; tekrar bitir → tekrar verilir | e2e (study) | geçti |
| F16-H3 | F16 | mutlu yol | yeni öğe: Makale/rapor yaz, ders seç, başlık, öncelik → kaydet; listede görünür | e2e (study) | geçti |
| F16-E1 | F16 | uç durum | yeni öğe: başlıksız kaydedilemez; sil → onay ister → siler | e2e (study) | geçti |
| F16-H4 | F16 | mutlu yol | ders ekle: ad + kod + gün/saat → kaydet; ders sayfası ve Dersler sekmesinde görünür; ders silinince işler derssiz kalır | e2e (study) | geçti |
| F16-H5 | F16 | mutlu yol | okuma: +5 sayfa → ilerleme 15/40, ilerleme bağlı görevi tamamlar; sayfa toplamı aşılmaz | e2e (study) | geçti |
| F16-E2 | F16 | uç durum | bonus günlük tavanı: günde en çok 5 okul bonusu; 6. öğe bitince puan yok + "bonus sınırı" uyarısı | e2e (study) | geçti |
| F16-H6 | F16 | mutlu yol | tez: başlangıç kilometre taşları 8 aşama; +10 ile %100 → bitti + bonus 40; geri al → bonus düşer | e2e (study) | geçti |
| F16-E3 | F16 | uç durum | olmayan ders / öğe kimliği: "bulunamadı" ekranı, çökme yok | e2e (study) | geçti |
| F16-E4 | F16 | uç durum | okul öğesi EN: tür/öncelik etiketleri çevrilmiş; ham anahtar yok | e2e (study) | geçti |

## F17 İş ve kişisel gelişim (6.6)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F17-H1 | F17 | mutlu yol | 3 önemli iş: ekle (Enter) → 0/3; hepsini bitir → 3/3 + kutlama, bağlı görev tamamlanır; 3 işten sonra giriş alanı kalkar | e2e (growth) | geçti |
| F17-E1 | F17 | uç durum | 3 önemli iş: boş / yalnız boşluk eklenmez; sil (✕) çalışır; EN yer tutucular | e2e (growth) | geçti |
| F17-E2 | F17 | uç durum | tamamlanmayan işleri ertesi güne taşı: dünden kalan 2 iş önerisi → "Bugüne taşı" → bugünde, kaynak işaretli | e2e (growth) | geçti |
| F17-H2 | F17 | mutlu yol | sayısal hedef: oluştur (hedef 4) → şu anki değeri 4 yap → hedef tamamlanır, bonus +30, bağlı görev tamamlanır | e2e (growth) | geçti |
| F17-H3 | F17 | mutlu yol | kilometre taşı hedefi: taşlar → hepsi bitince hedef tamamlanır (+30), biri geri alınınca bonus düşer | e2e (growth) | geçti |
| F17-E3 | F17 | uç durum | azalan hedef (kilo 90 → 80): yeni hedefte ilerleme %0 başlamalı, kaydetmek hedefi "tamamlanmış" sayıp bonus vermemeli | e2e (growth) | KALDI → BUG-001 azalan hedef anında tamamlanıyor +30 |
| F17-E4 | F17 | uç durum | hedef formu: başlıksız kaydedilemez; sil onay ister | e2e (growth) | geçti |
| F17-H4 | F17 | mutlu yol | hedef check-in: not yaz → listede görünür; boş not eklenmez | e2e (growth) | geçti |
| F17-H5 | F17 | mutlu yol | haftalık değerlendirme ve öğrenme sekmeleri açılır; boş durumlar | e2e (growth) | geçti |

## F18 Yarış / partner (3.11)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F18-H1 | F18 | mutlu yol | yarış: partner yokken boş durum + "Partnerle eşleş" → eşleşme ekranı; kendi puanların gösterilir | e2e (duel) | geçti |
| F18-H2 | F18 | mutlu yol | demo partner ekle → yarış: günlük/haftalık/aylık sekmeler, ben vs partner puanı, çekişme, gün gün grafik, rafı | e2e (duel) | geçti |
| F18-H3 | F18 | mutlu yol | yarış: önceki döneme git → "Kapandı", sonraki düğmesi güncel dönemde kapalı; gün/hafta/ay arasında gezinme | e2e (duel) | geçti |
| F18-E1 | F18 | uç durum | dürt kuralları: ilk dürtme gider; 2 saat dolmadan ikincisi reddedilir; 2 saat sonra gider; günde en çok 3 | e2e (duel) | geçti |
| F18-E2 | F18 | uç durum | dürt: sessiz saatlerde (23:00) gönderilmez; tebrik (cheer) sınırsız gider | e2e (duel) | geçti |
| F18-E3 | F18 | uç durum | partnerin özel görevi hiçbir yerde başlıkla görünmez (ana ekran: kilit; yarış akışı: "özel bir görevi bitirdi") | e2e (duel) | geçti |
| F18-H4 | F18 | mutlu yol | ana ekran yarış kartı: partner varken iki puan + çekişme çubuğu; karta dokununca Yarış ekranı | e2e (duel) | geçti |
| F18-E4 | F18 | uç durum | demo partneri kaldır → yarış tekrar boş durum | e2e (duel) | geçti |

## F19 Seri ekranı ve takvimi (3.10)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F19-H1 | F19 | mutlu yol | seri ekranı: 3 gün üst üste → "3 günlük seri", En uzun 3, toplam 3; takvim bugünün ayını gösterir | e2e (misc) | geçti |
| F19-E1 | F19 | uç durum | seri: bugün henüz görev yok ama dün ve önceki gün var → seri 2 (bozulmaz); ana ekran rozeti de 2 | e2e (misc) | geçti |
| F19-E2 | F19 | uç durum | seri: dün boş (2 gün önce var) → seri 0; ilk görev tamamlanınca 1'e çıkar | e2e (misc) | geçti |
| F19-E3 | F19 | uç durum | seri takvimi: önceki aya git (Ekim 2026), sonraki ay güncel ayda kapalı | e2e (misc) | geçti |
| F19-E4 | F19 | uç durum | seri sıfırken afiş "bugün tek görev tamamla" gösterir | e2e (misc) | geçti |

## F20 Ayarlar: dil, tema, birim, sıfırla (3.9)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F20-H1 | F20 | mutlu yol | ayarlar: dil English → arayüz anında İngilizce, sekme çubuğu ve ana ekran İngilizce; yenilemede kalıcı; Türkçe'ye dön | e2e (misc) | geçti |
| F20-H2 | F20 | mutlu yol | ayarlar: tema Koyu → arka plan koyu, Açık → açık, Sistem → cihaz teması; yenilemede kalıcı | e2e (misc) | geçti |
| F20-H3 | F20 | mutlu yol | ayarlar: koyu tema — ana ekran, araçlar, ilham, ayarlar, yaşam, çark sayfalarında düşük kontrastlı metin yok | e2e (misc) | geçti |
| F20-H4 | F20 | mutlu yol | ayarlar: birim oz → su sayfası oz gösterir; ml'ye dönünce ml | e2e (misc) | geçti |
| F20-H5 | F20 | mutlu yol | verileri sıfırla: vazgeç → veri kalır; onayla → çekirdek + dilimler + ayarlar silinir, onboarding'e döner | e2e (misc) | geçti |

## F21 Profil / istatistik / rozetler (3.9)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F21-H1 | F21 | mutlu yol | profil: ad, seviye, XP çubuğu, toplam puan, seri/yarış/rozet/istatistik kartları; rozetler ve istatistik sayfaları açılır | e2e (misc) | geçti |
| F21-E1 | F21 | uç durum | profil EN ve koyu tema 390px: taşma yok | e2e (misc) | geçti |

## F22 Diğer araçlar: uyku, 100 yol, motivasyon, nefes, egzersiz (3.8)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F22-H1 | F22 | mutlu yol | uyku: varsayılan 23:30→07:00 = 7 sa 30 dk; kalite seç → Kaydet → "Uyku kaydedildi", 7 gece grafiğinde kayıt | e2e (tools2) | geçti |
| F22-H2 | F22 | mutlu yol | kendimi sevmenin 100 yolu: "Bugün yaptım" → 1/100; işareti kaldır → 0; sayfa yenilense kalır | e2e (tools2) | geçti |
| F22-H3 | F22 | mutlu yol | motivasyon: kalp → favorilere ekler (Favoriler 1); Favoriler sekmesi; kaldırınca 0 | e2e (tools2) | geçti |
| F22-H4 | F22 | mutlu yol | nefes/meditasyon: desen + süre seç → başla → süre dolunca "Çok güzel!" ve geçmişe seans yazılır | e2e (tools2) | geçti |
| F22-H5 | F22 | mutlu yol | egzersiz: rutin seç → hareket listesi → Başla → hazırlan ekranı; duraklat/devam | e2e (tools2) | geçti |

## F23 Çapraz kesen uç durumlar

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F23-E1 | F23 | uç durum | çok uzun, boşluksuz ve emojili görev adı (60 karakter) kartı 390px'te taşırmaz; düzenleyici ve tamamlama çalışır | e2e (edge) | geçti |
| F23-E2 | F23 | uç durum | çevrimdışı: ağ kapalıyken görevler tamamlanır ve saklanır (yerel öncelikli); sayfa/konsol hatası yok | e2e (edge) | geçti |
| F23-E3 | F23 | uç durum | klavye: ＋ düğmesine Tab/odak + Enter ile Yeni Görev açılır; düzenleyici Enter ile kaydedilebilir alanlar odaklanabilir | e2e (edge) | geçti |
| F23-E4 | F23 | uç durum | tarayıcı geri tuşu: Yeni Görev → düzenleyici → geri → Yeni Görev → geri → ana ekran | e2e (edge) | geçti |
| F23-E5 | F23 | uç durum | iki sekme aynı anda: A sekmesinde görev tamamla, B sekmesinde başka görev tamamla → yenileyince ikisi de durmalı | e2e (edge) | KALDI → BUG-007 iki sekmede son yazan kazanır |
| F23-E6 | F23 | uç durum | yenileme: görev tamamlayıp sayfayı yenile → durum korunur; yarım kalan düzenleyici taslağı çökmez | e2e (edge) | geçti |
| F23-E7 | F23 | uç durum | 390px: çok sayıda görev (30) ile ana ekran uzun listede taşmaz, alt sekme çubuğu görünür kalır | e2e (edge) | geçti |
| F23-E8 | F23 | uç durum | sekme çubuğu: 5 sekme arasında gezinme (Rutin, İlham, Çark, Araçlar, Profil) ve her sekme hatasız | e2e (edge) | geçti |

## F24 Erişilebilirlik (etiketler)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| F24-A1 | F24 | uç durum | erişilebilirlik: ana ekranlarda tüm düğme / alan / anahtarın erişilebilir adı var (geri/kapat okları, kalp, +/- düğmeleri, anahtarlar, alanlar) | e2e (a11y) | KALDI → BUG-009 adsız ikon düğmeleri / alanlar |

## SMK Her rota için duman testi (TR+EN, koyu tema, 390px)

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| SMK-01-tr (+en) | SMK | duman | duman TR / | e2e (smoke) | TR geçti / EN geçti |
| SMK-02-tr (+en) | SMK | duman | duman TR /inspire | e2e (smoke) | TR geçti / EN geçti |
| SMK-03-tr (+en) | SMK | duman | duman TR /wheel | e2e (smoke) | TR geçti / EN geçti |
| SMK-04-tr (+en) | SMK | duman | duman TR /tools | e2e (smoke) | TR geçti / EN geçti |
| SMK-05-tr (+en) | SMK | duman | duman TR /profile | e2e (smoke) | TR geçti / EN geçti |
| SMK-06-tr (+en) | SMK | duman | duman TR /new-task | e2e (smoke) | TR geçti / EN geçti |
| SMK-07-tr (+en) | SMK | duman | duman TR /task/new | e2e (smoke) | TR geçti / EN geçti |
| SMK-08-tr (+en) | SMK | duman | duman TR /task/s1 | e2e (smoke) | TR geçti / EN geçti |
| SMK-09-tr (+en) | SMK | duman | duman TR /action?habitId=s1 | e2e (smoke) | TR geçti / EN geçti |
| SMK-10-tr (+en) | SMK | duman | duman TR /action?bonusId=wheel:smoke1&title=Test&emoji=%F0%9F%8E%AF&points=10&group=wheel&pastel=pink&source=wheel | e2e (smoke) | TR geçti / EN geçti |
| SMK-11-tr (+en) | SMK | duman | duman TR /lucky | e2e (smoke) | TR geçti / EN geçti |
| SMK-12-tr (+en) | SMK | duman | duman TR /planner | e2e (smoke) | TR geçti / EN geçti |
| SMK-13-tr (+en) | SMK | duman | duman TR /streak | e2e (smoke) | TR geçti / EN geçti |
| SMK-14-tr (+en) | SMK | duman | duman TR /duel | e2e (smoke) | TR geçti / EN geçti |
| SMK-15-tr (+en) | SMK | duman | duman TR /duel?period=week | e2e (smoke) | TR geçti / EN geçti |
| SMK-16-tr (+en) | SMK | duman | duman TR /duel?period=month | e2e (smoke) | TR geçti / EN geçti |
| SMK-17-tr (+en) | SMK | duman | duman TR /pairing | e2e (smoke) | TR geçti / EN geçti |
| SMK-18-tr (+en) | SMK | duman | duman TR /stats | e2e (smoke) | TR geçti / EN geçti |
| SMK-19-tr (+en) | SMK | duman | duman TR /badges | e2e (smoke) | TR geçti / EN geçti |
| SMK-20-tr (+en) | SMK | duman | duman TR /settings | e2e (smoke) | TR geçti / EN geçti |
| SMK-21-tr (+en) | SMK | duman | duman TR /wheel-edit | e2e (smoke) | TR geçti / EN geçti |
| SMK-22-tr (+en) | SMK | duman | duman TR /inspire/clean-home-basics | e2e (smoke) | TR geçti / EN geçti |
| SMK-23-tr (+en) | SMK | duman | duman TR /inspire/category/cleaning | e2e (smoke) | TR geçti / EN geçti |
| SMK-24-tr (+en) | SMK | duman | duman TR /inspire/favorites | e2e (smoke) | TR geçti / EN geçti |
| SMK-25-tr (+en) | SMK | duman | duman TR /inspire/search | e2e (smoke) | TR geçti / EN geçti |
| SMK-26-tr (+en) | SMK | duman | duman TR /inspire/quiz/morning-person | e2e (smoke) | TR geçti / EN geçti |
| SMK-27-tr (+en) | SMK | duman | duman TR /tools/timer | e2e (smoke) | TR geçti / EN geçti |
| SMK-28-tr (+en) | SMK | duman | duman TR /tools/drink | e2e (smoke) | TR geçti / EN geçti |
| SMK-29-tr (+en) | SMK | duman | duman TR /tools/sleep | e2e (smoke) | TR geçti / EN geçti |
| SMK-30-tr (+en) | SMK | duman | duman TR /tools/reflection | e2e (smoke) | TR geçti / EN geçti |
| SMK-31-tr (+en) | SMK | duman | duman TR /tools/meditate | e2e (smoke) | TR geçti / EN geçti |
| SMK-32-tr (+en) | SMK | duman | duman TR /tools/workout | e2e (smoke) | TR geçti / EN geçti |
| SMK-33-tr (+en) | SMK | duman | duman TR /tools/motivation | e2e (smoke) | TR geçti / EN geçti |
| SMK-34-tr (+en) | SMK | duman | duman TR /tools/soundscape | e2e (smoke) | TR geçti / EN geçti |
| SMK-35-tr (+en) | SMK | duman | duman TR /tools/alarm | e2e (smoke) | TR geçti / EN geçti |
| SMK-36-tr (+en) | SMK | duman | duman TR /tools/love | e2e (smoke) | TR geçti / EN geçti |
| SMK-37-tr (+en) | SMK | duman | duman TR /tools/reflection-write | e2e (smoke) | TR geçti / EN geçti |
| SMK-38-tr (+en) | SMK | duman | duman TR /tools/mood | e2e (smoke) | TR geçti / EN geçti |
| SMK-39-tr (+en) | SMK | duman | duman TR /life | e2e (smoke) | TR geçti / EN geçti |
| SMK-40-tr (+en) | SMK | duman | duman TR /life/smoke | e2e (smoke) | TR geçti / EN geçti |
| SMK-41-tr (+en) | SMK | duman | duman TR /life/meals | e2e (smoke) | TR geçti / EN geçti |
| SMK-42-tr (+en) | SMK | duman | duman TR /life/chores | e2e (smoke) | TR geçti / EN geçti |
| SMK-43-tr (+en) | SMK | duman | duman TR /study | e2e (smoke) | TR geçti / EN geçti |
| SMK-44-tr (+en) | SMK | duman | duman TR /study/item/new | e2e (smoke) | TR geçti / EN geçti |
| SMK-45-tr (+en) | SMK | duman | duman TR /growth | e2e (smoke) | TR geçti / EN geçti |
| SMK-46-tr (+en) | SMK | duman | duman TR /growth/goal/new | e2e (smoke) | TR geçti / EN geçti |
| SMK-D1 | SMK | duman | duman koyu tema / | e2e (smoke) | geçti |
| SMK-D2 | SMK | duman | duman koyu tema /inspire | e2e (smoke) | geçti |
| SMK-D3 | SMK | duman | duman koyu tema /tools | e2e (smoke) | geçti |
| SMK-D4 | SMK | duman | duman koyu tema /settings | e2e (smoke) | geçti |
| SMK-D5 | SMK | duman | duman koyu tema /life | e2e (smoke) | geçti |
| SMK-D6 | SMK | duman | duman koyu tema /study | e2e (smoke) | geçti |
| SMK-ONB | SMK | duman | duman onboarding (ilk açılış) | e2e (smoke) | geçti |

## Manuel / doğrulanamayan durumlar (e2e ile otomatikleştirilemez)

Bu ortamda gerçek telefon, bildirim sistemi, hoparlör ve dokunsal geri bildirim yoktur; aşağıdakiler web önizlemede yalnızca "çökmeden çalışır" düzeyinde
görüldü (bildirim API'leri web'de no-op) ya da hiç denenemedi. Gerçek cihazda (iOS + Android, Expo Go) elle geçilmeli.

| case | flow | type | steps → expected | auto | result |
| --- | --- | --- | --- | --- | --- |
| M-01 | bildirim | olumsuz | görev hatırlatıcısı kur (08:30) → izin ver → saatinde bildirim gelir, dokununca /action?habitId= açılır | manuel (cihaz) | doğrulanamadı |
| M-02 | bildirim | olumsuz | izin reddedilirse hatırlatıcı kurulmaz ve uygulama hata göstermez | manuel (cihaz) | doğrulanamadı |
| M-03 | bildirim | uç | Ayarlar'da bildirimler kapatılınca tüm gruplar (habit, drink, sleep, alarm, timer, smoke, meals, chores, study, growth) iptal; açılınca kullanılan takipçiler yeniden kurulur; dil değişince metinler yeni dilde | manuel (cihaz) | doğrulanamadı |
| M-04 | alarm | uç | alarm sessiz modda / rahatsız etme modunda çalmayabilir (arayüzde uyarı notu var); uygulama kapalıyken tetiklenir | manuel (cihaz) | doğrulanamadı |
| M-05 | zamanlayıcı | uç | odak/pomodoro/makine sayacı bitişi arka planda bildirim verir; uygulama kapatılıp açılınca kalan süre doğru | manuel (cihaz) | doğrulanamadı |
| M-06 | ses ortamı | mutlu yol | yağmur/okyanus/gürültü döngüsü çalar, kesintisiz döner, uyku zamanlayıcısı sesi durdurur; kulaklık çıkınca durur | manuel (cihaz) | doğrulanamadı (yalnız duman testi: sayfa açılıyor) |
| M-07 | haptik | uç | dokunuşlarda hafif/orta titreşim; web'de no-op | manuel (cihaz) | doğrulanamadı |
| M-08 | paylaş | uç | motivasyon sözü / eşleşme kodu paylaşımı sistem paylaşım sayfasını açar | manuel (cihaz) | doğrulanamadı |
| M-09 | partner senkron | mutlu yol | iki cihaz Supabase ile eşleşir, görevler/puanlar/dürtmeler senkronlanır, gizli görev maskelenir | manuel (bulut) | doğrulanamadı (bulut kurulu değil; yalnız demo partner ile yarış ekranı test edildi: F18) |
| M-10 | güvenli alan | uç | çentikli / iç içe güvenli alanlı cihazlarda üst başlık ve alt sekme çubuğu kesilmez; klavye açılınca alan görünür kalır | manuel (cihaz) | doğrulanamadı |
| M-11 | ekran okuyucu | uç | VoiceOver / TalkBack ile ana akışlar: ikon düğmeleri adlandırılmış, sayaç (+/-) düğmeleri ve onay daireleri okunur | manuel (cihaz) + bulgular | kısmen: DOM düzeyinde etiket eksikleri bulundu (bugs.md BUG-009) |
| M-12 | gerçek saat dilimi / DST | uç | cihaz saat dilimi değişince (uçuş) gün anahtarı ve "03:00 gün sınırı" tutarlı; yaz saati geçişinde seri bozulmaz | manuel (cihaz) | doğrulanamadı (yalnız tarayıcı saati kaydırılarak 03:00 sınırı test edildi) |
| M-13 | düşük bellek / uygulamayı sonlandırma | uç | akış ortasında (düzenleyici, sayaç) uygulama sonlandırılıp açılınca kalıcı veri bozulmaz | manuel (cihaz) | doğrulanamadı |
| M-14 | görsel | uç | Çark SVG animasyonu, konfeti, maskot ve gradyanlar iki temada; ekran görüntüleri `shots/rtest/` | manuel (göz) | örnek ekranlar incelendi; ayrıntılı görsel denetim yok |
| M-15 | EAS Update / derleme | uç | bağımsız derlemede ikon, açılış ekranı, güncelleme akışı | manuel (EAS) | doğrulanamadı |
