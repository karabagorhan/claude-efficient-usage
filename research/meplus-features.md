# Me+ (Enerjoy) - Özellik Envanteri

Tarih: 2026-11-08. Amaç: özellik fikirleri envanteri (marka/ikon/metin kopyalanmayacak).

## ARAŞTIRMA KISITI (önemli)
- Bu oturumda WebFetch hiçbir siteye erişemedi (apps.apple.com, adapty.io, imore.com, appgoblin.info, screensdesign.com için DNS hatası: ağ izin listesinde değil). Yalnızca WebSearch özetleri kullanıldı.
- Mağaza açıklamasının tam metni, IAP listesi, ekran görüntüleri, paywall ve UI teardown sayfaları DOĞRUDAN OKUNAMADI. Aşağıdaki "doğrulanamadı" ibareleri bu yüzdendir.
- Tam sonuç için: apps.apple.com, play.google.com, screensdesign.com, appllama.io, adapty.io alan adlarını izin listesine ekleyip tekrar çalıştırın veya uygulamayı elle gezin.

## 0. Hangi uygulama?
Seçilen aday: **Me+ Lifestyle Routine** (eski/alternatif adlar: "Me+ Daily Routine Planner", "Self Care & Routine Planner"; App Store alt başlığı "Daily Planner & Habit Tracker"). Geliştirici: Enerjoy Pte. Ltd. App Store ID 1596403446; Google Play paket adı daily.planner.routine.habits. Kategori: Health & Fitness. Ücretsiz indirme + abonelik (IAP).
- Diğer adaylar: aramalarda başka bir "Me+" rutin/alışkanlık uygulaması bulunmadı; tüm sonuçlar aynı listelemeye çıktı. Farklı bir "Me+" olup olmadığı doğrulanamadı (mağaza içi arama gerekir). "Enerjoy" adlı alakasız bir çalışan-bağlılığı yazılımı da çıkıyor, bu mobil uygulama değil.
- Bağlı not: sosyal sinyal olarak 4.5-4.8 yıldız; 235K-840K yorum ve 10M-18M+ indirme rakamları kaynaklar arasında çelişkili (agregatörler) -> yaklaşık değer.

## 1. Ücretsiz vs Premium (VIP)
Bilinenler (kaynaklar: mağaza özeti, üçüncü taraf siteler; tam liste DOĞRULANAMADI):
Çekirdek / mağaza açıklamasında geçen özellikler:
- Günlük rutin planlayıcı + self-care takvimi/programı
- Alışkanlık takibi (habit tracker)
- Mood ve ilerleme takibi (Mood Tracker Calendar, emoji ile duygu kaydı, "Mood Stat" içgörüleri - üçüncü taraf özeti)
- Günlük hedef/alışkanlık/mood kaydı; mood günlüğü (journal) ifadesi bazı listelemelerde
- To-do için hatırlatıcılar ("belirlediğin saatte dost hatırlatma")
- Simge ve renk seçerek özelleştirilebilir program
- Hazır rutin şablonları (örn. kilo kontrolü planı; bir PC listelemesinde "100+ self-care programı" - üçüncü taraf, zayıf kaynak)
- MBTI kişilik testiyle sana uygun rutin önerisi
- iOS 16 Lock Screen + Home Screen widget'ları; Google Play yorumlarında widget'lar övülüyor
- "Library" bölümü (kullanıcı yorumu: refleksiyon, mood tracker, içerik) - içeriği doğrulanamadı
- Bazı sitelerde "AI destekli" ve fotoğraftan temizlik planı iddiası: resmi doğrulama YOK, güvenilmez
Ücretsiz/Premium ayrımı (üçüncü taraf inceleme siteleri, tutarsız):
- Ücretsiz: temel günlük rutin oluşturma + sınırlı alışkanlık takibi
- VIP'e kilitli (iddia): sınırsız alışkanlık, mood takibi, wellness içeriği, meditasyonlar, "gelişmiş analitik, kişisel öneriler, ek özelleştirme" (düşük kaliteli bir sitede)
- Kesin ücretsiz/premium matrisi DOĞRULANAMADI.
Fiyatlar (bölge/tarihe göre değişir, çelişkili): VIP aylık $9.99 veya $7.99; yıllık $39.99 veya $59.99; Google Play aralığı 8.99-74.99 EUR (bir site). 7 günlük ücretsiz deneme (kullanıcı yorumu + teardown). Tek seferlik/lifetime seçenek DOĞRULANAMADI.
Kullanıcı şikayetleri: ücretsiz sürüm çok kısıtlı, paywall agresif; takvim entegrasyonu talebi (yani yok/doğrulanamadı).
Aranıp BULUNAMAYANLAR (doğrulanamadı): su takibi, uyku takibi, odak zamanlayıcı, nefes egzersizi, gün içi zaman çizelgesi görünümü, tema/rozet listesi.

## 2. Ekran yapısı ve akışlar
- Alt sekmeler, ana ekran yerleşimi, rutin ekleme/tamamlama/istatistik ekranları: DOĞRULANAMADI (kaynaklara erişilemedi). Sadece dolaylı bilgiler:
  - Takvim/mood takvimi ve istatistik ("Mood Stat") ekranı var gibi, Library bölümü var.
- Onboarding (screensdesign teardown özeti): 37 adımlı, uzun, kişiselleştirilmiş quiz ile başlayan, "çok bölümlü" kurulum. Örnek adımlar: bildirim izni, topluluk puanlaması/sosyal kanıt, günlük rutin önizlemesi, uyku süresi seçimi. Onboarding sonunda paywall (3 abonelik planı, 7 gün deneme); çıkmaya çalışınca ikinci, daha agresif teklif (exit offer). Teardown ayrıca onboarding uzunluğunun kullanıcıyı caydırabileceğini belirtiyor.
- Ekran sayısı: ~70 yakalanmış ekran (onboarding + paywall + çekirdek sekmeler) - uygulama kütüphanesi listelemesi.
- Rutin ekleme akışı, tamamlama etkileşimi, istatistik akışı: DOĞRULANAMADI.

## 3. Oyunlaştırma
- Rozet, puan, seviye, XP, evcil hayvan vb. kanıtı bulunamadı (arama bu yönde sonuç vermedi).
- Seri (streak): bir üçüncü taraf UI özeti "streak ve ilerleme için görsel geri bildirim" diyor; başka bir arama streak kanıtı bulamadı. Rakip blog, Me+ kullanıcılarının "logging ve streak"ten bıktığını ima ediyor. Kesin durum: DOĞRULANAMADI.

## 4. Görsel tasarım dili
- Renk paleti, kart yapısı, animasyon, ikon seti: DOĞRULANAMADI. Tek bilinen: kullanıcı kendi simge ve renk seçimini yapıyor; widget'lar günün rutinini gösteriyor; mood için ifadeli emojiler; rutinlerde illüstrasyonlu aktivite önerileri (kilo kontrol planı örneği).
- Paywall tasarım detayı (Adapty kütüphanesi sayfası) okunamadı.

## 5. Kaynak URL'leri
- https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446 (resmi mağaza, doğrudan okunamadı; arama özeti)
- https://play.google.com/store/apps/details?id=daily.planner.routine.habits&hl=en_US (arama özeti)
- https://enerjoy.life/me-plus/ (geliştirici sayfası, arama özeti)
- https://screensdesign.com/showcase/me-lifestyle-routine ve https://screensdesign.com/explore/apps/me-plus/onboarding/ (UI/onboarding teardown; okunamadı)
- https://appllama.io/apps/1596403446/me-lifestyle-routine (ekran/paywall koleksiyonu; okunamadı)
- https://adapty.io/paywall-library/me-daily-routine-planner/ (paywall; okunamadı)
- https://www.imore.com/apps/this-habit-tracking-iphone-app-helps-you-build-better-routines (inceleme; okunamadı)
- https://www.productivity-apps.com/apps/me-plus-lifestyle-routine
- https://lifestack.ai/blog/me-app-alternative (rakip blog, taraflı)
- https://appgoblin.info/apps/daily.planner.routine.habits ; https://apppricinglab.com/app/apple/1596403446 (agregatör)
- https://me-premium.pages.dev (düşük kaliteli, güvenilmez)

## Sonraki adım önerisi
Ağ izin listesine apps.apple.com, screensdesign.com, appllama.io, adapty.io, play.google.com ekleyip bölüm 1-4'ü yeniden doldurun.
