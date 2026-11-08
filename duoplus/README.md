# DuoPlus 💞

İki kişinin birlikte kullandığı rutin / alışkanlık uygulaması. Me+ tarzı günlük planlayıcıya
**puan sistemi** ve **günlük / haftalık / aylık yarış** eklenmiş hâli. Expo (React Native, TypeScript).

## Özellikler

**Rutin ve alışkanlık**
- Günlük plan, sabah / öğleden sonra / akşam gruplaması, hafta şeridi
- Görev türleri: Evet/Hayır, Sayaç (su, sayfa, adım), Zamanlı (süre sayacına bağlı)
- Tekrar: her gün, belirli günler, haftada N kez
- İkon, renk, kategori, zorluk, hatırlatıcı saati, "özel görev" 🔒, "birlikte" 💞
- 44 hazır görev şablonu, 7 hazır paket, hedefe göre onboarding önerisi
- Yerel bildirim hatırlatıcıları (görev başına)
- "Unuttum hakkı": dünü haftada 1 kez, ertesi gün 09:00'a kadar, %70 puanla işaretleme

**Puan ve oyunlaştırma** (`research/gamification.md`)
- Zorluk puanı: Mini 5 · Kolay 10 · Orta 20 · Zor 35 · Efsane 50
- Seri çarpanı (x1.1 → x1.5), erken bonus, Mükemmel Gün bonusu, haftalık kota bonusu
- Günlük yumuşak/sert tavan, zorluk bazlı günlük limitler, yeni görev ilk 24 saat %50
- Seviye / XP, 33 rozet (2 gizli), seri takibi
- **Aynı görev aynı gün iki kez sayılmaz** (tamamlama kimliği = görev + gün)

**İki kişilik yarış**
- Günlük / haftalık / aylık puan tablosu, önceki dönemlere gezinme
- Günün Şampiyonu · Haftanın Yıldızı · Ayın Efsanesi (kapanan dönemlerde XP ödülü)
- Şampiyonluk rafı, son 7 gün formu, gün gün karşılaştırma grafiği
- Dürt 👉 / Tebrik 🎉 (günde 3 dürtme, arada 2 saat, sessiz saatler 22:00-08:00)
- Partnerin son hareketleri (özel görevler gizli)

**Ek araçlar**
- Odak zamanlayıcı (bildirimli), nefes egzersizi (4-4-4-4 ve 4-7-8)
- Ruh hali + günlük notu, ruh hali takvimi
- İstatistik: günlük puan grafiği, ısı haritası, kategori dağılımı, en uzun seriler
- Kütüphane: kısa rehberler (genel bilgi, tıbbi tavsiye değil)

## Kurulum

```bash
cd duoplus
npm install
npx expo start
```

Telefonda **Expo Go** ile QR kodu okutun. Ek hesap/kurulum olmadan **yerel modda** çalışır
(Profil → "Demo partner ekle" ile yarış ekranını deneyebilirsiniz).

### Expo Go sürümü (önemli)

Proje **Expo SDK 58** ile kurulu. Mağazadaki Expo Go yalnızca tek bir SDK'yı destekler. Telefonunuzdaki Expo Go
"incompatible" derse SDK 57'ye düşürün:

```bash
npx expo install expo@^57.0.0 --fix
```

Kod iki sürümde de aynıdır. iOS'ta Expo Go, geliştirme için terminalde `npx expo login` ve uygulamada aynı Expo
hesabıyla giriş isteyebilir (ücretsiz hesap).

## İki telefonu bağlama (Supabase, ücretsiz)

1. [supabase.com](https://supabase.com) → yeni proje (bölge: Avrupa).
2. **Authentication → Providers → Anonymous sign-ins**: açın.
3. **SQL Editor**'e `supabase/0001_init.sql` içeriğini yapıştırıp çalıştırın.
4. **Project Settings → API**'den URL ve `anon`/publishable anahtarı alıp `.env` dosyası oluşturun
   (`.env.example`'a bakın). `service_role` anahtarını **asla** koymayın.
5. `npx expo start` → iki telefonda da açın. Telefon A: "Yeni eşleşme oluştur" → 6 haneli kod.
   Telefon B: "Kod ile katıl".

Mimari: tek `docs` tablosu (kim yazdı, hangi tür, JSON veri), RLS ile yalnızca eşleşme üyeleri okur,
yalnızca sahibi yazar. Telefonlar Realtime ile anında güncellenir, çevrimdışı yazılanlar sonradan gönderilir.

## Testler

```bash
npm test          # puan motoru + store (Node'da)
npm run typecheck
```

## Bilinen sınırlar / yapılmayanlar

- **Partner bildirimi arka planda gelmez**: uzak push Expo Go'da yok. Partnerin hareketi uygulama açıkken görünür.
  Push için development build + Edge Function gerekir.
- **Widget** (ana ekran / kilit ekranı) Expo Go'da mümkün değil, eklenmedi.
- Paywall/abonelik yok, her şey açık. Me+'daki MBTI testi yok.
- Seri kalkanı, mola modu, "Oran Modu" tasarımda var (`research/gamification.md`), henüz kodlanmadı.
- Puanlar cihazda hesaplanır (iki kişi birbirine güvenir). Aynı gün çift sayım engellenir ama cihaz saati değiştirilerek
  hile tamamen engellenmez.
- Anonim hesap kaybolursa (uygulama verisi silinirse) eşleşme yeniden kurulmalıdır. E-posta bağlama eklenmedi.
- Ruh hali ve günlük yalnızca cihazda saklanır, partnerle paylaşılmaz.
- Gün sınırı 03:00, hafta Pazartesi (sabit).
- Me+ ekranları mağaza sitelerine erişilemediği için birebir doğrulanamadı; özellik listesi mağaza özetleri ve
  alışkanlık uygulamalarındaki yaygın kalıplarla oluşturuldu (`research/meplus-features.md`).
