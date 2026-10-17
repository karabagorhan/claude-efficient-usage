# Bakım İş Emirleri

Expo Go'da çalışan basit bir bakım iş emri takip uygulaması.

- İş emri ekleme (başlık, ekipman/tag, açıklama, öncelik)
- Durum değiştirme: Açık → Devam Ediyor → Kapalı
- Duruma göre filtreleme, silme
- Veriler telefonda saklanır (AsyncStorage)

## Çalıştırma

```bash
cd bakim-is-emri
npm install
npx expo start
```

Telefonda **Expo Go** uygulamasını aç ve terminaldeki QR kodu okut
(Android: Expo Go içinden, iPhone: Kamera ile). Telefon ve bilgisayar aynı Wi-Fi'da olmalı;
olmazsa `npx expo start --tunnel` dene.

## Yapı

- `App.tsx` – ekranlar (liste, filtre, yeni iş emri formu)
- `src/types.ts` – tipler, öncelik/durum listeleri
- `src/storage.ts` – kalıcı kayıt
