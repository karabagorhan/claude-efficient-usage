# Harcama Defteri V2.1

Expo SDK 57 ile hazırlanmış Türkçe ve İngilizce kişisel harcama defteri. Harcamalar, aylık bütçe, kategori limitleri, raporlar, abonelikler, yerel bildirimler, Excel dışa aktarma ve JSON yedekleme içerir. Harcama verileri cihazda tutulur; uygulamayı kullanmak için hesap açmak gerekmez.

## Başlatma

Node.js ve npm kurulu bir bilgisayarda bu klasörü aç:

```bash
npm ci
npx expo start
```

QR kodunu iPhone'daki Expo Go ile aç. Telefon ile bilgisayar aynı ağda olmalı. Expo Go, geliştirme içindir; App Store'a yüklenebilen bağımsız uygulama dosyası değildir.

## V2'de değişenler

- Kayıtlar sırayla kalıcı depoya yazılır; yazma hatasında başarı mesajı verilmez. Okuma hatasında boş kayıt açılıp mevcut verinin üstüne yazılmaz.
- Bozuk veya geçersiz tutar ve tarihler reddedilir. Harcama eklerken `YYYY-MM-DD` biçiminde eski bir tarih girilebilir.
- Aboneliklerde geçmiş ödenmemiş dönemler izlenir. Ödeme gerçekleştiğinde harcamanın tarihi işlem günüdür; ait olduğu dönem ayrıca saklanır.
- Bildirimler izin alınmadan açılmaz; yakın gelecek vadeleri planlanır ve uygulama yeniden öne geldiğinde güncellenir.
- Yedek dosyasının uygulama kimliği, sürümü, biçimi ve kayıtları denetlenir. Tekrarlanan kimlikler bir kez birleştirilir.
- İlk kurulumda varsayılan profil adı boştur; arayüz dili cihazın Türkçe/İngilizce diline göre seçilir. Önceki kullanıcı ayarları korunur.

## V2.1 yenilikleri

- Ayarlar'da TRY ve USD gösterimi seçilebilir. Harcamalar, abonelikler, bütçe ve kategori limitleri **TL olarak girilir ve TL olarak saklanır**. USD seçildiğinde ekrandaki para tutarları TCMB'nin USD döviz satış kuruyla (`TL ÷ kur`) gösterilir. Bu bir banka işlemi veya kalıcı döviz çevirisi değildir.
- USD için TCMB'nin günlük kuru internetten alınır; kur ve bülten tarihi Ayarlar'da görünür. Bağlantı yoksa son kaydedilmiş kur kullanılmaya devam eder. Daha önce kur alınmamışsa USD seçimi yapılmaz. Kur el ile yenilenebilir.
- İngilizce arayüzde hatırlatma saati 12 saatlik AM/PM biçimindedir. Kaydedilen saat 0–23 kalır; bildirim zamanlaması buna göre çalışır.
- Excel dışa aktarımı ve JSON yedekleri özgün TL değerlerini içerir. Eski kayıtlar ve yedekler TL olarak korunur.

V1 verileri aynı `harcama-defteri:v1` anahtarından okunur; mevcut kayıtların taşınması için veri silme veya yeniden kurma gerekmez. V1'de abonelik oluşturulma tarihi tutulmadığından geçmiş dönemler geriye dönük kesin olarak çıkarılamaz; mevcut aboneliklerde takip V2'ye geçişten itibaren başlar.

## Yedek ve geri yükleme

Ayarlar bölümündeki **Yedek oluştur** JSON dosyası üretir. **Yedekten geri yükle** mevcut veriye yeni kimlikleri ekler; mevcut aynı kimlikli kayıtları değiştirmez. Web sürümünün `harcama-defteri` sürüm 1 yedekleri desteklenir. Geri yüklemeden önce yedek oluşturmak önerilir.

## Kontroller

```bash
npx tsc --noEmit
npx expo lint
npm run test:core
npm run check:i18n
npx expo export --platform ios
npx expo export --platform web
```

Tarayıcıda ekran testi için web export dizinini `WEB_DIR` olarak verip `npm run test:ui -- tr` veya `npm run test:ui -- en` çalıştırabilirsin. Test Playwright Chromium gerektirir.

App Store için Expo Go yerine imzalı iOS build, TestFlight cihaz testi ve App Store Connect yayını gerekir. `app.json` uygulama sürümü 2.1.0 olduğu için eski runtime'lara yayınlanan EAS güncellemeleri bu sürüme uygulanmaz. Gizlilik ve destek sayfaları ile mağaza ekran görüntüleri ayrıca hazırlanmalıdır.
