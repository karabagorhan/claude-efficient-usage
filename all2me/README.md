# All2Me

İki kişilik günlük rutin + kendine bakım + yaşam takibi uygulaması (Expo SDK 58, expo-router, TypeScript).
Arayüz Türkçe ve İngilizce; ücretli sürüm, kilit ya da reklam yok. Şartname: `docs/SPEC.md`,
geliştirici sözleşmesi: `docs/CONTRACTS.md`.

> **Kimin için:** rutin kurmaya çalışan ama ödeme duvarına çarpan öğrenciler, gençler ve dağınık günlerle
> uğraşanlar için All2Me; şirin, renkli bir rutin + çark + araçlar paketini **sınırsız görev, deneme süresi ve
> reklam olmadan**, çevrimdışı ve iki kişilik yarışla sunar. (Konumlandırma: `replica/entrepreneur.md` §5.2;
> dayanak 1.494 App Store yorumunun anahtar sözcük analizi, tek platform.)

## Özellikler

- **Rutin panosu**: haftalık gün şeridi, sabah / öğleden sonra / akşam / her zaman görevleri, sayaç ve süreli
  görevler, haftalık kota, "unuttum hakkı" (dün yapıp işaretlemeyi unuttuğun bir görev, %70 puan, 09:00'a kadar,
  haftada bir), partnerle bugünkü yarış kartı ve yaşam takibi özet şeridi (yaklaşan teslim, sigara bugün x/limit,
  gecikmiş ev işi — yalnız kullanılan takipçiler).
- **Görev sırası**: her zaman diliminde *saate göre* (hatırlatıcı saati olanlar önce) ya da *elle*. Karta uzun
  basınca menü: Düzenle · Yukarı · Aşağı · En üste · Sil (sürükle-bırak paketi yok; sıra `habit.order` alanında,
  partnerle eşitlenir). Kartı **sola kaydırarak sil** + 5 sn'lik **"Geri al"** toast'ı (silme = arşiv).
- **Önceden yap**: ileri bir günü seçip görevleri şimdiden işaretleyebilirsin; **puan verilmez**, seriye, liderliğe
  ve rozetlere sayılmaz (görev serisinde o gün nötrdür), o gün geldiğinde "Önceden yapıldı" olarak görünür.
- **Esnek tekrar**: her gün / belirli günler / haftada N kez yanında **her N gün, N hafta (istenen günlerde) ya da
  N ayda bir**, seçilen başlangıç gününden. Ay sonu kuralı: 31'i seçilirse kısa aylarda ayın son günü (Şubat 28/29).
  Seri, rozet, rapor, hatırlatıcı ve takvim bununla hesaplanır.
- **Puan ve oyunlaştırma**: zorluk tabanlı puan, seri çarpanı, mükemmel gün / haftalık bonus, günlük tavanlar,
  seviye + XP, 40 rozet (seri, puan, rekabet, araçlar, yaşam takibi), Seri takvimi, Yarış ekranı
  (günlük / haftalık / aylık, şampiyonluk rafı, dürt / tebrik et), İstatistik.
- **Kişisel başlangıç**: dil, ad/avatar, kısa evet/hayır soruları ve sonuç halkaları, uyku ritmi (kalkış/yatış),
  enerji zirvesi, odak alanları, özgün **"rutin tipin"** profil testi (eğlence amaçlı, tanı koymaz; Profil'den
  yeniden yapılabilir), ilk gün planı önizlemesi (çıkarılabilir görevler), bildirim izni adımı, partner; her adım
  atlanabilir, "hızlı başla" yolu var. Sonda "hep ücretsiz" notu.
- **Yeni görev**: 30+ öneri, bağlı araç görevleri (su, ruh hali, yansıma), çevrimdışı **Akıllı planlayıcı**
  (kural tabanlı), **Şanslı görev**, ayrıntılı görev düzenleyici (tekrar, tür, zorluk, hatırlatıcı, özel, birlikte).
- **Çark**: 3 çark (ev işleri, kendine bakım, hareket), düzenlenebilir dilimler, sınırsız çevirme
  (günde 5 çark görevi puanlanır) → **Harekete geç** ekranı.
- **İlham**: 40+ iki dilli şablon, kategoriler, arama, favoriler, tanı koymayan "kendini tanı" mini testleri.
- **Araçlar**: odak zamanlayıcı / pomodoro (çalışma etiketiyle), su, uyku, ruh hali, yansıma (20+ konu),
  nefes / meditasyon, egzersiz rutinleri, motivasyon sözleri, ses ortamı (betikle sentezlenmiş döngüler),
  alarm, "Kendine 100 İyilik".
- **Alarm**: Android'de `alarmClock` teslimi + yüksek öncelikli alarm kanalı + tam zamanlı alarm izni kontrolü,
  iOS'ta zamanında ses çalan bildirim; "Ertele 5/10 dk" eylemleri; dokununca tam ekran çalma ekranı
  (Kapat / Ertele). Gerçek bir saat uygulaması kadar garanti değildir (bkz. Bilinen sınırlar).
- **Takvim**: hatırlatıcılı görevleri, teslim tarihlerini ve ders saatlerini telefonun takvimindeki ayrı bir
  "All2Me" takvimine tek yönlü yazar (expo-calendar); diğer takvimlere dokunmaz, tek dokunuşla kaldırılır.
- **Haftalık rapor**: toplam puan, tamamlama oranı, en uzun seri, aktif gün, günlük puan grafiği, zaman dilimine
  göre tamamlama, en iyi gün, partnerle yarış, takipçi özetleri, geçen haftayla kıyas ve cihazda üretilen kural
  tabanlı içgörüler + öneriler (ağ yok), paylaşım; Pazar 19:00 bildirimi.
- **Yaşam takibi**: sigara azaltma (azaltma planı, istek erteleme, biriken para, tetikleyiciler, en zor saatler),
  ev yemeği / fast food (haftalık hedef, menü planı, 30+ yemek fikri, alışveriş listesi), ev işleri
  (tekrarlı işler, çamaşır ve bulaşık makinesi akışı), okul / yüksek lisans (dersler, ödev / makale / sınav,
  okuma listesi, tez kilometre taşları, haftalık çalışma süresi), iş ve kişisel gelişim (3 önemli iş, hedefler,
  öğrenme listesi, haftalık değerlendirme).
- **Bildirimler**: her özellik kendi grubunda yerel bildirim kurar; Ayarlar'daki ana anahtar kapatılınca tüm
  gruplar iptal edilir, açılınca / dil değişince kullanılan takipçilerin hatırlatıcıları yeniden kurulur.
  İzin, ilk hatırlatıcı kurulduğu anda istenir. Planlama işlemleri sıraya alınır (yarış koşulu yok).
- **Hatırlatıcı sağlığı** (Ayarlar): bildirim izni durumu + "İzin ver" / "Ayarları aç", Android tam zamanlı alarm
  izni, **5 sn sonra test bildirimi**, gruplara göre planlı bildirim sayısı, **sessiz saatler** (aralığa düşen
  tekrarlayan hatırlatıcılar kurulmaz, tek seferlikler aralık sonuna ertelenir; alarm ve zamanlayıcı hariç) ve
  **günlük üst sınır** (varsayılan 12; aşılırsa önce su/motivasyon, en son görevler kırpılır). Web'de açıklayıcı durum.
- **Açılış hata sınırı**: bir ekran çizilirken hata olursa beyaz ekran yerine kurtarma ekranı: "Yeniden dene",
  "Hata ayrıntısını paylaş", son çare olarak ne silineceğini açıkça yazan onaylı "Verileri sıfırla". Kalıcı durum
  bozuk JSON ise dilim çökmez: varsayılanla açılır, ham değer `<anahtar>-corrupt` olarak yedeklenir.
- **Destek ve geri bildirim** (Ayarlar): "Zor bir gün mü?" — genel öneriler, ülkeye bağlı numara yok, "acil
  durumda yerel acil numarayı ara" notu, iş ortaklığı yok; "Geri bildirim / hata bildir" paylaşım menüsüyle
  sürüm, güncelleme kimliği, platform, dil, tarih ve kısa notu gönderir (e-posta adresi yok, kişisel veri eklenmez).
  Hakkında: "hep ücretsiz" taahhüdü.
- **Partner**: Supabase ile iki kişilik eşleşme ve senkron (isteğe bağlı). Bulut yoksa "yerel mod" + yarış
  ekranını denemek için demo partner.
- Açık / koyu tema, ml / oz, verileri tek dokunuşla sıfırlama.

## Kurulum

```bash
npm install
npx expo start            # QR kodu Expo Go ile okutun
npm test                  # motor, çekirdek store, yaşam takibi, okul, planlayıcı, rapor, takvim, bildirim bütçesi (tsx)
node e2e/run.mjs --build --jobs 3   # uçtan uca web testleri (Playwright, ön kurulu Chromium)
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
- **Gerçek cihaz testi yapılmadı.** Bildirimler, test bildirimi, sessiz saat / üst sınır uygulaması, alarm,
  takvim yazma, ses ortamı, haptik, paylaşım menüsü ve kaydırarak silme jesti (PanResponder) yalnız web önizlemede
  ve kod / birim testi düzeyinde doğrulandı; iOS / Android'de çalıştırılarak denenmedi. Alarm, yerel bildirimdir:
  sessiz modda / rahatsız etmeyin modunda çalmayabilir, cihaz kapalıyken çalmaz ve gerçek bir saat alarmı kadar
  garanti değildir.
- Günlük üst sınır, planlama anında önümüzdeki 14 güne bakan bir tahmindir; üst sınır nedeniyle kırpılan düşük
  öncelikli hatırlatıcılar, yer açılınca kendiliğinden geri gelmez (Hatırlatıcı sağlığı > "Yeniden kur").
- Esnek tekrarlı görevlerin hatırlatıcıları sonraki en çok 8 oluşum için tek seferlik bildirim olarak kurulur;
  uygulama uzun süre açılmazsa yenilenmez. Takvimde "ayın 31'i" tekrarı, takvim uygulamasının kuralına göre kısa
  aylarda atlanabilir (uygulama içinde ayın son gününe kayar).
- Yedekle / geri yükle (JSON dışa aktarım) ve ana ekran widget'ı yok (widget Expo Go'da mümkün değil).
- Kurtarma ekranını web e2e testinde denemek için yalnız web'de okunan bir test anahtarı var
  (`localStorage.__all2me_crash_test = '1'`); yerel uygulamada etkisizdir.
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
