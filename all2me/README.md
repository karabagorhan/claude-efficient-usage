# All2Me

İki kişilik günlük rutin + kendine bakım + yaşam takibi uygulaması (Expo SDK 58, expo-router, TypeScript).
Arayüz Türkçe ve İngilizce; ücretli sürüm, kilit ya da reklam yok. Şartname: `docs/SPEC.md`,
geliştirici sözleşmesi: `docs/CONTRACTS.md`.

## Özellikler

- **Rutin panosu**: haftalık gün şeridi, sabah / öğleden sonra / akşam / her zaman görevleri, sayaç ve süreli
  görevler, haftalık kota, "unuttum hakkı" (dün için, haftada bir), partnerle bugünkü yarış kartı ve yaşam takibi
  özet şeridi (yaklaşan teslim, sigara bugün x/limit, gecikmiş ev işi — yalnız kullanılan takipçiler).
- **Puan ve oyunlaştırma**: zorluk tabanlı puan, seri çarpanı, mükemmel gün / haftalık bonus, günlük tavanlar,
  seviye + XP, 40 rozet (seri, puan, rekabet, araçlar, yaşam takibi), Seri takvimi, Yarış ekranı
  (günlük / haftalık / aylık, şampiyonluk rafı, dürt / tebrik et), İstatistik.
- **Yeni görev**: 30+ öneri, bağlı araç görevleri (su, ruh hali, yansıma), çevrimdışı **Akıllı planlayıcı**
  (kural tabanlı), **Şanslı görev**, ayrıntılı görev düzenleyici (tekrar, tür, zorluk, hatırlatıcı, özel, birlikte).
- **Çark**: 3 çark (ev işleri, kendine bakım, hareket), düzenlenebilir dilimler, sınırsız çevirme
  (günde 5 çark görevi puanlanır) → **Harekete geç** ekranı.
- **İlham**: 40+ iki dilli şablon, kategoriler, arama, favoriler, tanı koymayan "kendini tanı" mini testleri.
- **Araçlar**: odak zamanlayıcı / pomodoro (çalışma etiketiyle), su, uyku, ruh hali, yansıma (20+ konu),
  nefes / meditasyon, egzersiz rutinleri, motivasyon sözleri, ses ortamı (betikle sentezlenmiş döngüler),
  alarm, "Kendimi Sevmenin 100 Yolu".
- **Yaşam takibi**: sigara azaltma (azaltma planı, istek erteleme, biriken para, tetikleyiciler, en zor saatler),
  ev yemeği / fast food (haftalık hedef, menü planı, 30+ yemek fikri, alışveriş listesi), ev işleri
  (tekrarlı işler, çamaşır ve bulaşık makinesi akışı), okul / yüksek lisans (dersler, ödev / makale / sınav,
  okuma listesi, tez kilometre taşları, haftalık çalışma süresi), iş ve kişisel gelişim (3 önemli iş, hedefler,
  öğrenme listesi, haftalık değerlendirme).
- **Bildirimler**: her özellik kendi grubunda yerel bildirim kurar; Ayarlar'daki ana anahtar kapatılınca tüm
  gruplar iptal edilir, açılınca / dil değişince kullanılan takipçilerin hatırlatıcıları yeniden kurulur.
  İzin, ilk hatırlatıcı kurulduğu anda istenir.
- **Partner**: Supabase ile iki kişilik eşleşme ve senkron (isteğe bağlı). Bulut yoksa "yerel mod" + yarış
  ekranını denemek için demo partner.
- Açık / koyu tema, ml / oz, verileri tek dokunuşla sıfırlama.

## Kurulum

```bash
npm install
npx expo start            # QR kodu Expo Go ile okutun
npm test                  # motor, çekirdek store, yaşam takibi, okul, planlayıcı testleri (tsx)
npm run typecheck         # tsc --noEmit
```

### Expo Go

- Proje **Expo SDK 58** ile yazıldı; telefondaki Expo Go uygulamasının SDK 58'i desteklemesi gerekir
  (Expo Go yalnız güncel SDK'yı çalıştırır). Sürüm uyumsuzsa Expo Go uyarı verir.
- Özel native modül yok; kullanılan paketlerin hepsi Expo Go'da hazır (`expo-notifications`, `expo-audio`,
  `react-native-svg`, `async-storage`, `expo-linear-gradient` …). `npx expo install --check` temiz.
- Expo Go'da **yerel** bildirimler çalışır; uzaktan push kullanılmaz. Uygulama ikonu ve açılış ekranı
  yalnız bağımsız (EAS) derlemede görünür, Expo Go kendi ikonunu gösterir.
- Yayın: EAS Update yapılandırılmıştır (`runtimeVersion.policy = appVersion`, `updates.url`).

## Supabase ile partner eşleşmesi (isteğe bağlı)

1. Supabase'te yeni proje açın. **Authentication → Providers → Anonymous sign-ins** seçeneğini açın.
2. **SQL Editor**'de `supabase/0001_init.sql` dosyasının tamamını çalıştırın (eşleşme tabloları, belge senkronu,
   satır güvenliği, `create_pair` / `join_pair` fonksiyonları).
3. `.env.example` → `.env` kopyalayın; `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_KEY` (anon / publishable
   key) doldurun. `npx expo start` yeniden başlatın (değişkenler derleme anında okunur).
4. Birinci telefon: onboarding'de ya da Profil → Ayarlar → Partner ekle → **Kod üret**. İkinci telefon aynı
   ekranda **Kod ile katıl** ve kodu girer. Görevler, tamamlamalar, puanlar, rozetler ve dürtmeler senkronlanır.
5. Değişkenler boşsa uygulama tamamen yerel çalışır.

Araç ve yaşam takibi verileri (su, uyku, ruh hali, sigara, yemek, ev işleri, okul, gelişim) yalnız cihazda kalır;
partnerle yalnız çekirdek veri (görevler ve puanlar) paylaşılır.

## Bilinen sınırlar

- Supabase senkronu bu depoda gerçek bir sunucuya karşı uçtan uca test edilmedi (birim testleri ve yerel mod var).
- Bildirimler, ses ortamı, haptik ve alarmlar yalnız web önizlemede ve kod düzeyinde doğrulandı; gerçek cihazda
  (iOS / Android) çalıştırılarak denenmedi. Alarm, yerel bildirimdir: sessiz modda / rahatsız etmeyin modunda
  çalmayabilir ve uygulama kapalıyken gerçek bir saat alarmı gibi davranmaz.
- Ev işleri listesi partnerle paylaşılmaz (yalnız bu cihaz).
- Sağlık içerikleri genel bilgidir, tıbbi tavsiye değildir. Kendini tanı testleri tanı koymaz.
- Android derlemesinde `expo-audio` eklentisi varsayılan olarak mikrofon izni ekler; uygulama kayıt yapmaz.

## Betikler

```bash
node scripts/gen-icons.mjs      # assets/ ikon, uyarlanabilir ikon, splash, favicon (Puf maskotu, Playwright ile)
node scripts/gen-sounds.mjs     # assets/sounds/*.wav (telifsiz sentez döngüler)
npx expo export --platform web && node scripts/shots.mjs --seed --lang tr "rutin=/" "araclar=/tools"
```

`scripts/shots.mjs` seçenekleri: `ad=/rota` (sorgu parametreli rota olabilir), `--seed` (demo profil + görevler),
`--lang tr|en`, `--theme light|dark`, `--wait ms`, `--out shots`, `--dist dist`. `dist/` yerel bir HTTP
sunucusuyla servis edilir ve ön kurulu Playwright Chromium kullanılır. `shots/` ve `dist*/` git'e girmez.
