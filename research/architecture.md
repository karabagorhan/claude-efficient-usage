# Çift Kişilik Rutin/Alışkanlık Takip Uygulaması: Mimari Araştırması

Tarih: 2026-11-08. Kapsam: Expo (React Native, TypeScript), 2 kullanıcı, Expo Go ile test, ücretsiz katman, minimum hesap.
Bu dosya yalnızca araştırma ve öneridir. Kod içermez.

## 0. Yönetici özeti

- Öneri: Expo + expo-router + Supabase (Postgres + Realtime + anonim Auth) + TanStack Query (AsyncStorage'a kalıcı önbellek ve çevrimdışı mutasyon kuyruğu) + expo-notifications (yalnızca yerel bildirim).
- Eşleştirme: iki kişi de "anonim giriş" yapar, biri 6 haneli kod üretir, diğeri kodu girer. E-posta, şifre veya OAuth yoktur.
- Puanlar sunucuda (Postgres trigger/RPC) hesaplanır. Çift sayım `UNIQUE(habit_id, user_id, local_date)` ve istemci tarafı UUID ile idempotent yazımla engellenir.
- Günlük/haftalık/aylık sıralama tabloda saklanmaz, okuma anında `point_events.local_date` üzerinden hesaplanır. Hafta başlangıcı pair ayarıdır.
- En büyük risk teknik değil, dağıtım: Expo Go artık mağazada tek bir SDK sürümünü destekliyor ve yeni SDK'ya geç geliyor (bkz. 1.2). Ayrıca iOS'ta Expo Go için ücretsiz bir Expo hesabıyla giriş şart (bkz. 1.3).

## 1. Güncel durum doğrulaması (2026-11-08)

### 1.1 Sürümler

| Bileşen | Durum | Kaynak |
|---|---|---|
| Expo SDK 58 | Kararlı, 2026-10-15. React Native 0.88, Node 22.13+ / 24.3+ / 26+ (tek sayılı sürümler desteklenmez). | expo.dev/changelog/sdk-58 |
| Expo SDK 57 | 2026-06-30. RN 0.86, React 19.2. Expo Go'nun mağaza sürümü şu an bunu hedefliyor (aşağıya bak). | expo.dev/changelog/sdk-57 |
| Expo SDK 56 | 2026-05-21. RN 0.85. expo-router artık `react-navigation`'a bağımlı değil. | expo.dev/changelog/sdk-56 |
| npm `expo@latest` | 58.0.23 | npm registry |
| expo-router | 58.0.30. SDK 56'dan beri `@react-navigation/*` doğrudan import edilmemeli. SDK 58'de data loader/SSR/middleware kararlı (web için, bizi ilgilendirmiyor). `unstable-native-tabs` artık `expo-router/native-tabs`. | npm + changelog |
| expo-notifications | 58.1.8. SDK 58'de ön planda bildirim varsayılan olarak gösterilir; Android'e `delivery: 'alarmClock'` seçeneği geldi. | npm + changelog |
| expo-sqlite | 58.0.15. Kararlı. SDK 58'de libSQL desteği kaldırıldı (bizi etkilemez). | npm + changelog |
| AsyncStorage | `expo install` 2.2.0 sabitliyor (npm'de 3.1.1 var, Expo'nun uyumlu listesinde yok). `expo install` ne seçerse onu kullanın. | bundledNativeModules |
| supabase-js | 2.119.0 (Node >= 22 ister, yalnızca geliştirme makinesi için). | npm |
| TypeScript | Şablon `~6.0.3` sabitliyor. npm'de 7.0.2 var ama SDK şablonunda yok, şablonu izleyin. | expo-template-default |

### 1.2 Expo Go ve mağaza gecikmesi (kritik)

- Expo Go'nun mağaza sürümü yalnızca tek bir SDK'yı destekler. SDK 58 için Expo Go "birkaç hafta içinde" App Store ve Google Play'e gelecek denmiş (2026-10-15 duyurusu). 2026-11-04 tarihli kaynaklarda henüz geldiğine dair doğrulama bulamadım.
- Mayıs 2026'da SDK 55 için App Store onayı uzun süre bekledi. Expo, Expo Go'yu "öncelikle eğitim aracı" olarak konumlandırıyor ve gerçek kullanım için development build öneriyor. Yani Expo Go yolu bir miktar kırılgan.
- SDK 58 yükseltme rehberi, Expo Go'da kalmak isteyenlere `create-expo-app` sorusunda SDK 57'yi seçmelerini söylüyor. `create-expo-app` Expo Go 58 gelene kadar SDK 57 projesi üretiyor.
- Yapılacak: Önce iki telefonda mağazadaki Expo Go'nun hangi SDK'yı desteklediğine bakın (uygulama içinde veya açılışta "incompatible" hatasından görülür). Proje SDK'sını ona göre seçin. Kod her iki SDK'da aynıdır. Yalnızca paket sürümleri değişir (bkz. 7). Expo Go 58 gelince `npx expo install expo@^58.0.0 --fix` ve `npx expo-doctor@latest` ile yükseltin.
- Ücretli alternatifler (hesap/ücret yükü getirir, ihtiyaç hâlinde): iOS için `eas go` + TestFlight (Apple Developer Program, 99 USD/yıl), Android için development build (ücretsiz, EAS Build veya yerel).

### 1.3 Expo Go giriş zorunluluğu (hesap sayısını etkiler)

- 2026-09-03 duyurusu: Expo Go (SDK 57 desteğiyle gelen sürüm), iOS'ta geliştirme modunda proje çalıştırmak için hem terminalde (`npx expo login`) hem Expo Go uygulamasında aynı Expo hesabıyla giriş ister. Simülatör ve development build muaf. Android'e "daha sonra" planlanıyor. Ücretsiz hesabın yeterli olup olmadığı duyuruda yazmıyor, ücretsiz hesap açmak yeterli olacak gibi görünüyor ama doğrulayamadım.
- Sonuç: Gerçek minimum hesap sayısı Supabase (1) + Expo (1, ücretsiz). Telefon başına ayrı hesap gerekmiyor. Aynı Expo hesabıyla iki telefonda da giriş yapılabilir.
- Not: Mayıs 2026'da EAS Update projelerini yükleme sahiplik/organizasyon üyeliğine bağlandı, ama biz EAS Update kullanmıyoruz.

### 1.4 Expo Go içinde bildirimler

- Uzak push (push token alma) Expo Go'da SDK 53'ten beri yok, development build gerekir. Yerel zamanlanmış bildirimler (`scheduleNotificationAsync`) Expo Go'da çalışır. Gereksinimimiz yerel hatırlatıcı olduğu için uyumlu.
- Sonuç: "Partner şunu tamamladı" tarzı arka plan bildirimi (push) Expo Go ile mümkün değil. Uygulama açıkken Realtime ile gösteririz. Push ileride development build + Supabase Edge Function + Expo Push ile eklenir (kapsam dışı).

### 1.5 Araştırma sınırlamaları

docs.expo.dev, supabase.com ve apps.apple.com bu ortamın ağ izninde olmadığı için açılamadı. Sürüm bilgileri expo.dev changelog ve npm registry'den (paket sürümleri ve `bundledNativeModules.json`, birincil kaynak), kota ve davranış bilgileri arama sonuçlarındaki üçüncü taraf özetlerinden geldi. Kota rakamlarını kurulumdan önce resmi fiyat sayfalarında bir kez doğrulayın.

## 2. Backend karşılaştırması

| Ölçüt | Supabase | Firebase (Firestore) | Convex | PocketBase |
|---|---|---|---|---|
| Expo Go uyumu | Evet, saf JS (`supabase-js` + AsyncStorage). Resmi Expo rehberi var. | Evet, yalnızca Firebase JS SDK ile. `@react-native-firebase` native olduğu için Expo Go'da çalışmaz. | Büyük olasılıkla evet (saf JS WebSocket istemcisi), bu araştırmada doğrulamadım. | JS SDK evet, ama realtime (SSE) için `react-native-sse` polyfill gerekir. |
| Realtime | Postgres Changes (RLS'e saygılı) ve Broadcast. 2 kullanıcı için fazlasıyla yeterli. | En olgun `onSnapshot`. | Reaktif sorgular, çok iyi. | SSE aboneliği, polyfill ile. |
| Ücretsiz kota (üçüncü taraf kaynaklara göre, doğrulayın) | 2 proje, 500 MB DB, 50K MAU, 200 eşzamanlı Realtime bağlantısı, 2M mesaj/ay. Bir hafta etkinlik yoksa proje duraklatılır (veri korunur, panelden elle geri açılır). | Spark: günlük 50K okuma, 20K yazma, 20K silme, 1 GiB. Auth 50K MAU. Cloud Functions için Blaze (kart) gerekir. | Ücretsiz plan var, iki kişilik kişisel proje için "yeterli" deniyor. Üçüncü taraf rakamları birbirini tutmuyor. | Yazılım ücretsiz ama barındırma yok (VPS/Fly/tünel gerekir). |
| Basit auth yolu | `signInAnonymously()` (panelde etkinleştirilir). Anonim kullanıcı e-posta bağlayarak kalıcılaştırılabilir. Anonim girişte IP başına saatte 30 istek sınırı var, bizim için sorun değil. | Anonymous Auth, JS SDK'da `initializeAuth` + AsyncStorage persistence elle kurulur. Metro/export sorunlarına dair geçmiş raporlar var (SDK 53 dönemi). | Convex Auth anonim sağlayıcı mevcut ama RN desteği web kadar oturmuş değil, doğrulayamadım. | E-posta/şifre kullanıcı kaydı (anonim yok). |
| Eşleştirme kodu | RPC (SECURITY DEFINER fonksiyon) ile temiz ve atomik. | Çağrılabilir fonksiyon için Blaze gerekir. Yalnızca Security Rules ile "kod = doküman ID" hilesi mümkün ama kırılgan. | Mutation ile kolay. | API kuralları/hook ile mümkün. |
| Puan toplama (haftalık/aylık) | SQL `GROUP BY`, view/RPC. En doğal. | `sum()` toplama sorgusu var ama zaman dilimi/hafta başlangıcı mantığı istemcide kalır. | Sorgu içinde JS ile, sınırlı veri için iyi. | SQL (SQLite) view'ları yazılabilir ama daha az ergonomik. |
| Çevrimdışı | SDK'da yok, bizim katmanımız (TanStack Query kalıcı kuyruk) sağlar. | JS SDK'da RN için kalıcı Firestore önbelleği güvenilir değil, bellek önbelleği. | Yok. | Yok. |
| Kurulum adımları / hesap | 1 hesap (GitHub veya e-posta), panelde SQL yapıştır, 1 anahtar. Kart gerekmez. | 1 Google hesabı, konsol, Firestore, Auth, kurallar. Fonksiyon için kart. | 1 hesap (GitHub), CLI ile `convex dev`. | Sunucu kurulumu, en çok iş. |
| Veri modeli uyumu | Çok yüksek (ilişkisel: users/pairs/habits/completions/point_events, kısıtlar, trigger). | Orta (alt koleksiyonlar, tekilleştirme için doküman ID hileleri). | Yüksek ama ilişkisel kısıtlar elle. | Yüksek. |

### Öneri: Supabase

1. Veri modeli ilişkisel ve tekillik kısıtları (çift sayımı engelleme) veritabanı seviyesinde. Puan hesabı için trigger ve RPC doğal.
2. Eşleştirme kodu, tek bir atomik RPC ile ücretsiz katmanda çözülür. Firebase'te aynı iş Blaze'a (kart) zorlar.
3. Günlük/haftalık/aylık toplama saf SQL. Zaman dilimi ve hafta başlangıcı tek bir yerde (SQL fonksiyonu) tanımlanır.
4. Expo Go'da saf JS, hiçbir native modül yok.
5. Hesap yükü düşük: tek Supabase hesabı. Telefon başına hesap açtırmaz (anonim giriş).
6. Kota iki kişi için yüzlerce kat fazla.

Bilinen dezavantajlar ve karşı önlemler:
- Duraklatma: ücretsiz proje bir hafta etkinlik yoksa duraklar. Günlük kullanan iki kişide sorun olmaz. Tatilde olursa panelden "Restore" yapılır. İsteğe bağlı: haftada bir sorgu atan zamanlanmış GitHub Action.
- Anonim hesap kaybı: uygulama verisi silinirse/yeniden kurulursa anonim kimlik kaybolur. Önlem: "E-posta bağla" (isteğe bağlı) veya bölüm 3'teki kurtarma yolu.
- Güvenlik tamamen RLS'e dayanır (anahtar istemcide açık olur), bu yüzden RLS'i baştan yazmak şart.

Firebase ne zaman? Zaten Google hesabı kullanmak ve Spark yeterliyse, kendi yüksek `onSnapshot` kalitesi gerekiyorsa. Convex ne zaman? Tüm yığını TypeScript ile uçtan uca istiyorsanız. PocketBase: kendi sunucunuz yoksa elenir.

## 3. Kimlik doğrulama ve eşleştirme akışı

Akış (hepsi anonim oturum + RPC):
1. Uygulama ilk açılışta `signInAnonymously()` ile oturum açar. Oturum AsyncStorage'ta saklanır, `autoRefreshToken` açık.
2. Kullanıcı A ad girer, `create_pair()` RPC'si pair + 6 haneli kod üretir (belirsiz karakterler çıkarılmış alfabe, örn. 0/O, 1/I yok), A'yı üye yapar.
3. A kodu mesajla paylaşır (Share sheet / clipboard).
4. Kullanıcı B anonim girişle ad girer, kodu yazar, `join_pair(code)` RPC'si B'yi üye yapar. Kod tek kullanımlıktır, 2 üye dolunca geçersizdir (trigger ile en fazla 2 üye), isteğe bağlı 24 saat süre sonu, yanlış deneme sayacı.
5. Sonraki tüm erişim RLS ile `is_pair_member(pair_id)` üzerinden.

Kurtarma (anonim hesabı kaybetme): iki seçenek, ikisi de isteğe bağlı: (a) ayarlardan e-posta bağla (`updateUser`, tek seferlik), (b) kurulum ekranında "yeni cihaz" akışı: eski pair'e partnerin onayıyla yeniden katılma (kod yenile). MVP'de (a) yeterli, (b) sonraya.

Güvenlik notları: Panelde e-posta kaydını kapatmak yüzeyi daraltır. Anonim giriş için CAPTCHA, herkese açık bir ürün olmadığı için gereksiz. RPC'lerde `SECURITY DEFINER` + `search_path` sabitleme. İstemciye service role anahtarı asla konmaz, yalnızca publishable (anon) anahtar.

## 4. Veri modeli

Tüm id'ler UUID. İstemci kendi UUID'sini üretir (çevrimdışı oluşturma ve tekrar gönderimde idempotentlik için). Tüm tablolarda `created_at`, düzenlenebilirlerde `updated_at` (trigger).

| Tablo | Ana alanlar | Notlar |
|---|---|---|
| `profiles` | `id` (= auth.uid), `display_name`, `emoji/color`, `timezone` (IANA, örn. Europe/Istanbul) | Kullanıcı başına bir satır. |
| `pairs` | `id`, `invite_code` (unique), `invite_expires_at`, `week_start` (1=Pzt ... 7=Paz, varsayılan 1), `day_start_hour` (varsayılan 0), `created_by` | Haftalık dönem ve gün sınırı ortak ayarlar. |
| `pair_members` | `pair_id`, `user_id`, `joined_at`; PK (`pair_id`, `user_id`); `user_id` unique (bir kullanıcı tek pair) | Trigger: pair başına en fazla 2 üye. |
| `habits` | `id`, `pair_id`, `owner_id`, `title`, `icon`, `points` (1-10), `schedule` (günlük / belirli günler / haftada N), `weekly_target`, `reminder_time` (yerel "HH:MM", isteğe bağlı), `archived_at` | Partner görebilir, yalnız sahibi değiştirir. Silmek yerine arşivle (geçmiş puanlar bozulmasın). |
| `completions` | `id` (istemci UUID), `habit_id`, `user_id`, `pair_id`, `local_date` (date), `completed_at` (timestamptz, istemci), `created_at` (sunucu), `points_snapshot`, `backfilled` (bool) | `UNIQUE(habit_id, user_id, local_date)`. Gün başına birden fazla sayılacak alışkanlıklar için `seq` eklenip unique'e dahil edilir. |
| `point_events` | `id`, `pair_id`, `user_id`, `local_date`, `kind` (completion / daily_bonus / streak_bonus / weekly_bonus / adjustment), `points`, `source_completion_id` (nullable, unique, ON DELETE CASCADE), `dedupe_key` (unique) | Puan defteri (ledger). İstemci doğrudan yazamaz, yalnızca trigger/RPC. |

İlişki: `pairs` 1-2 `pair_members` ve `profiles`; `habits` -> `completions` -> `point_events` (1:1 completion türü + bonus türleri).

Dizinler: `point_events (pair_id, local_date, user_id)`, `completions (pair_id, local_date)`, `habits (pair_id)`.

## 5. Puan hesaplama

### 5.1 Kural

- Tek gerçek kaynak sunucu. İstemci yalnızca "bu habit'i şu `local_date` için tamamladım" der (`complete_habit` RPC veya doğrudan insert + trigger). Puan miktarını istemci belirlemez, habit'in o anki `points` değeri `points_snapshot` olarak kaydedilir (sonradan puan değişse eski kayıtlar etkilenmez).
- Her completion için trigger tek bir `completion` türü `point_events` satırı üretir (`source_completion_id` unique).
- Bonuslar (örn. günün tüm alışkanlıkları tamam +N, 7/30 günlük seri, haftalık hedef) `dedupe_key` ile idempotent: `daily:{user}:{date}`, `streak7:{habit}:{date}`, `weekly:{user}:{hafta_başı}`. Yeniden hesaplama fonksiyonu (`recompute_bonuses(user, date)`) o güne ait bonusları silip yeniden üretir. Geri alma (completion silme) bonusları da düzeltir.
- Geri alma: completion silinir, cascade ile ilgili `point_events` gider, bonuslar yeniden hesaplanır. Kasıtlı manuel düzeltme için `adjustment` türü.

### 5.2 Çift sayım ve hile önleme (katmanlar)

1. Veritabanı kısıtı: `UNIQUE(habit_id, user_id, local_date)`. Aynı gün ikinci tıklama veya iki cihaz çakışması reddedilir/yok sayılır (`ON CONFLICT DO NOTHING`).
2. İdempotent yazma: completion `id` istemci UUID'si. Çevrimdışı kuyruk aynı isteği defalarca tekrar gönderse de tek kayıt oluşur.
3. Sunucu tarafı puan: istemci puan gönderemez, `point_events` için INSERT politikası yok.
4. Tarih penceresi: `local_date`, sunucu zamanından +-1 gün (çevrimdışı geri doldurma için ayarlanabilir 2 güne kadar) dışında reddedilir. Gelecek tarih asla kabul edilmez. Geç gelen (backfill) kayıtlar `backfilled=true` işaretlenir, isteğe bağlı yarım puan.
5. RLS: kullanıcı yalnız kendi `user_id`'si için completion ekleyebilir/silebilir. Partnerinki salt okunur.
6. Denetim: `completed_at` (istemci) ile `created_at` (sunucu) farkı büyükse işaretlenebilir. Cihaz saatini değiştirmek 4. katmanla sınırlanır.
7. İki kişi birbirine güvendiği için (rekabet ama arkadaşça) daha fazlası (örn. kanıt fotoğrafı, partner onayı) MVP'de gerek yok. İsteğe bağlı: haftalık günlük puan tavanı.

## 6. Günlük/haftalık/aylık toplama ve zaman dilimi

Prensip: Zaman damgası yerine takvim günü (`local_date`, `YYYY-MM-DD`) saklanır ve gruplanır. Böylece DST ve saat dilimi kayması kalmaz.

- `local_date` kullanıcının cihaz saat diliminden (`expo-localization` / `Intl`) ve pair'in `day_start_hour` ofsetinden (gece kuşları için örn. 04:00) hesaplanır: `local_date = tarih(şimdi_yerel - day_start_hour)`. Profil `timezone` alanı bilgi/raporlama içindir.
- Dönem sınırları okuma anında hesaplanır, saklanmaz:
  - Gün: `local_date = d`
  - Hafta: `hafta_başı = d - ((isodow(d) - week_start + 7) mod 7)`, aralık `[hafta_başı, hafta_başı + 6]`. `week_start` pair ayarıdır (TR için varsayılan Pazartesi). Değiştirmek eski haftaların da yeniden gruplanmasına yol açar (kabul edilebilir, belgelenir).
  - Ay: `date_trunc('month', d)`.
- Liderlik tablosu bir SQL fonksiyonu (`get_leaderboard(pair_id, period, anchor_date)`): `point_events`'i `user_id` ile gruplar, kullanıcı başına toplam puan, tamamlanan sayısı, o dönemin kazananı. Önceki/sonraki dönem gezinmesi `anchor_date`'i değiştirir. Dönem geçmişi (haftalık kazananlar) `generate_series` ile tek sorguda.
- İki kullanıcı farklı saat diliminde (örn. İstanbul ve Berlin) olabilir. Her olay sahibinin kendi günü olarak sayılır. Dönem sınırlarında en fazla birkaç saatlik tutarsızlık olur, 2 kişilik arkadaşça kullanım için kabul edilebilir ve belgelenmelidir.
- Cron veya materyalize tablo gerekmez. Veri hacmi küçük (2 kullanıcı x ~10 olay/gün ~ yılda 7 bin satır), dizinle sorgular ms düzeyinde.
- İstemcide "şu anki dönem" gösterimi `date-fns` (+ `@date-fns/tz`) ile hesaplanır, `weekStartsOn` pair ayarından. Uygulama ön plana dönerken (`AppState` active) gün değişimi yeniden kontrol edilir.

## 7. Realtime

- `completions` ve `point_events` tablolarını `supabase_realtime` yayınına ekleyin.
- İstemci `pair_id=eq.<id>` süzgeciyle Postgres Changes'a abone olur. Olay gelince yamalamak yerine ilgili TanStack Query anahtarlarını `invalidate` eder (basit ve hataya dayanıklı). Ek olarak ön plana dönüşte ve ağ geri gelince yeniden çeker.
- RLS Postgres Changes'ta uygulanır. DELETE olaylarında süzgeç çalışmaz, bu yüzden silmede de tam yeniden çekim yapılır.
- Ölçek: resmî dokümanlar büyük ölçekte Broadcast'i (veritabanı tetikleyicisinden `realtime.broadcast_changes`) önerir. 2 kullanıcıda gerek yok. İleride gerekirse geçiş yolu açık.
- Uygulama arka plandayken WebSocket kapanır, bildirim için push gerekir (1.4).

## 8. Çevrimdışı öncelikli yaklaşım

Öneri (MVP): TanStack Query + kalıcılaştırma.
- `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` ile sorgu önbelleği AsyncStorage'a yazılır. Uygulama çevrimdışı açılınca son bilinen veri görünür (kendi habit'leriniz, partnerin son puanları).
- Mutasyonlar (`complete_habit`, `create_habit`, `undo`) `networkMode: 'offlineFirst'`, iyimser güncelleme (optimistic update) ve kalıcı mutasyon kuyruğuyla çalışır. Çevrimiçi olunca sırayla yeniden oynatılır. İstemci UUID + unique kısıt sayesinde tekrar oynatma güvenlidir. `setMutationDefaults` kayıtları kuyruk devam ettirilmeden önce yapılmış olmalı (bilinen tuzak).
- Ağ durumu: `expo-network` olay dinleyicisi ile TanStack `onlineManager`'a bağlanır (ek native paket gerekmez).
- Çakışma politikası: completion ekleme/silme çakışmaz (unique + idempotent). Habit düzenleme için "son yazan kazanır" (`updated_at`), tek sahibi olduğu için pratikte çakışma yok.
- Bildirimler tamamen yereldir, ağdan bağımsız.

Gelişmiş yol (gerekirse): `expo-sqlite` ile yerel veritabanı + `outbox` tablosu + `updated_at` ile delta çekme. Yerel SQL ile karmaşık çevrimdışı sorgular veya çok büyük geçmiş gerekirse. İki kullanıcı için başta fazla iş. Hazır senkron motorları (örn. PowerSync) native modül gerektirdiği için Expo Go'da çalışmaz (genel bilgi, bu araştırmada doğrulanmadı).

## 9. Yerel bildirim hatırlatıcıları

- İzin: ilk habit hatırlatıcısı kurulurken iste. Android 8+ için kanal oluştur.
- Her habit `reminder_time` için tekrarlayan tetikleyici (günlük veya haftanın günleri) kurulur. iOS'ta bekleyen yerel bildirim sınırı 64'tür, bu yüzden "her gün için tek bildirim" yerine tekrarlayan tetikleyici kullanın.
- Habit oluşturma/düzenleme/arşivleme ve zaman dilimi değişimi sonrası o habit'in bildirimleri iptal edilip yeniden kurulur. Bildirim ID'leri saklanır (AsyncStorage veya habit satırında yerel alan).
- "Bugün tamamlandıysa hatırlatma gelmesin" isteniyorsa: tekrarlayan tetikleyici yerine önümüzdeki 7 günlük tek seferlik bildirimleri uygulama her açılışta yeniden kurma yaklaşımı (habit sayısı x 7 < 64 olmalı). MVP'de tekrarlayan tetikleyici, bu iyileştirme sonraya.
- Uzak push yok (1.4). Partner etkinliği yalnızca uygulama açıkken gösterilir (Realtime).

## 10. Klasör yapısı (expo-router, `src/` kullanılarak)

```
app/                         (veya src/app)  yalnızca ekranlar ve düzenler
  _layout.tsx                kökte sağlayıcılar: QueryClient+persist, oturum kapısı
  (onboarding)/
    index.tsx                karşılama, ad
    create-pair.tsx          kod üret/paylaş
    join-pair.tsx            kod gir
  (tabs)/
    _layout.tsx              Tabs
    today.tsx                bugünün habit'leri, tamamla
    leaderboard.tsx          gün/hafta/ay sekmeleri
    habits.tsx               liste/düzenle
    settings.tsx             hafta başı, gün başlangıcı, saat dilimi, e-posta bağla
  habit/
    new.tsx, [id].tsx
src/
  lib/
    supabase.ts              istemci (AsyncStorage, autoRefreshToken)
    queryClient.ts           kalıcılaştırma, onlineManager, mutasyon varsayılanları
    time.ts                  local_date, hafta/ay aralığı, gün başlangıç ofseti (saf fonksiyonlar, birim testli)
    notifications.ts         izin, kanal, zamanlama/iptal
    ids.ts                   UUID üretimi (expo-crypto)
  features/
    auth/ pairing/ habits/ completions/ leaderboard/ notifications/
      api.ts                 Supabase çağrıları (RPC/select)
      hooks.ts               useQuery/useMutation
      schemas.ts             zod şemaları
      components/
  realtime/useRealtimeSync.ts  abonelik -> invalidate
  components/ui/             ortak bileşenler
  types/database.types.ts    Supabase'den üretilen tipler
supabase/
  migrations/0001_init.sql   tablolar, RLS, RPC, trigger, view (panelde SQL editörüne yapıştırılabilir)
.env                          EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY (publishable)
app.json, tsconfig.json (strict)
```

## 11. Paket listesi

Kurulum komutu: `npx create-expo-app@latest <ad> --template default@sdk-57` (veya `@sdk-58`), sonra tüm Expo paketleri `npx expo install <paket>` ile eklenmeli. Aşağıdaki sürümler `expo@57.0.32` ve `expo@58.0.23` paketlerinin `bundledNativeModules.json` dosyasından ve şablon bağımlılıklarından alındı. `expo install` bunları otomatik sabitler, elle sürüm yazmayın.

| Paket | SDK 57 (Expo Go mağaza hedefi, bugün) | SDK 58 (kararlı, Expo Go bekleniyor) |
|---|---|---|
| expo | ~57.0.32 | ~58.0.23 |
| react-native | 0.86.3 | 0.88.1 |
| react / react-dom | 19.2.3 | 19.3.0 |
| expo-router | ~57.0.30 | ~58.0.30 |
| expo-notifications | ~57.0.25 | ~58.1.8 |
| expo-localization | ~57.0.2 | ~58.0.5 |
| expo-crypto (UUID) | ~57.0.4 | ~58.0.7 |
| expo-network | ~57.0.3 | ~58.0.4 |
| expo-clipboard | ~57.0.2 | ~58.0.4 |
| expo-haptics | ~57.0.3 | ~58.0.7 |
| expo-constants / expo-linking / expo-status-bar | ~57.0.23 / ~57.0.13 / ~57.0.1 | ~58.0.15 / ~58.0.16 / ~58.0.4 |
| expo-font / expo-splash-screen / expo-system-ui | ~57.0.4 / ~57.0.11 / ~57.0.4 | ~58.0.11 / ~58.0.13 / ~58.0.7 |
| react-native-screens / safe-area-context | ~4.26.0 / ~5.7.0 | ~4.30.1 / ~5.11.1 |
| react-native-reanimated / gesture-handler | 4.5.1 / ~2.32.0 | 4.7.1 / ~3.3.0 |
| react-native-worklets | 0.10.1 | 0.13.0 |
| @react-native-async-storage/async-storage | 2.2.0 | 2.2.0 |
| @expo/vector-icons (isteğe bağlı) | ^15.0.2 | ^15.0.2 |
| expo-sqlite (yalnız gelişmiş çevrimdışı yolu için) | ~57.0.4 | ~58.0.15 |
| typescript / @types/react (dev) | ~6.0.3 / ~19.2.2 | ~6.0.3 / ~19.3.0 |

Expo dışı paketler (npm'de bugünkü son sürüm, `npm install` ile):

| Paket | Sürüm | Not |
|---|---|---|
| @supabase/supabase-js | ^2.119.0 | |
| @tanstack/react-query | ^5.107.1 | |
| @tanstack/react-query-persist-client | ^5.107.1 | |
| @tanstack/query-async-storage-persister | ^5.107.1 | |
| zod | ^4.6.7 | şema doğrulama |
| date-fns | ^4.4.0 | |
| @date-fns/tz | ^1.5.0 | zaman dilimi destekli tarih işlemleri |
| react-native-url-polyfill | ^4.0.0 | yalnızca URL hatası olursa, bazı Supabase rehberleri ister, güncel SDK'da gerekli olmayabilir (doğrulanmadı) |

Eklenmeyecekler (bilinçli): `@react-native-firebase/*` (native), Expo Go'da uzak push, `react-native-mmkv` gibi native depolama, `expo-secure-store` (Supabase oturumu için AsyncStorage yeterli, anonim ve düşük hassasiyetli), `expo-background-task` (gereksiz).
Not: `zustand` isteğe bağlı (5.1.0), sunucu durumu TanStack Query'de olduğu için çoğu zaman gerekmez. Express/Firebase gibi ek hesaplar yok.

## 12. Kurulum adımları (hesap sayısı: Supabase 1 + Expo 1)

1. supabase.com'da (GitHub veya e-posta ile) proje oluştur, bölge olarak Avrupa seç.
2. Auth ayarlarında "Anonymous sign-ins" aç, e-posta kaydını kapat.
3. SQL Editor'e `supabase/migrations/0001_init.sql` içeriğini yapıştır (tablolar, RLS, RPC'ler, trigger'lar, realtime yayını).
4. Project Settings'ten URL ve publishable anahtarı al, `.env`'ye `EXPO_PUBLIC_` önekiyle koy.
5. `npx create-expo-app` (SDK iki telefonda Expo Go ile uyumlu olan), `npx expo install ...`, `npx expo login`.
6. `npx expo start`, telefonlarda Expo Go'da QR'ı tara. iOS'ta Expo Go uygulamasında da aynı Expo hesabıyla giriş yap.
7. Telefon A'da pair oluştur, kodu B'ye gönder, B'de katıl.

## 13. Riskler ve açık sorular

| Risk | Etki | Önlem |
|---|---|---|
| Expo Go'nun SDK 58 mağaza sürümü gecikebilir veya SDK uyumsuzluğu | Test engellenir | SDK 57 ile başla, sonra yükselt. Kod aynı. Gerekirse Android'de development build (ücretsiz). |
| iOS Expo Go giriş zorunluluğu (ve Android'e gelecek) | +1 ücretsiz Expo hesabı | Tek hesap yeterli, iki telefonda kullanılabilir. |
| Supabase ücretsiz proje duraklaması (1 hafta etkinlik yok) | Uygulama bağlanamaz | Günlük kullanım yeterli, panelden restore, isteğe bağlı keep-alive. |
| Anonim kimlik kaybı | Pair'e erişim kaybı | E-posta bağlama, kodla yeniden katılma akışı. |
| RLS hataları | Veri sızıntısı/yazma açığı | Baştan RLS testi (iki kullanıcıyla, üçüncü anonim kullanıcıyla), tüm tablolarda RLS açık. |
| Çevrimdışı mutasyon kuyruğu tuzakları (varsayılan kayıtları unutmak) | Kayıp tamamlama | İdempotent UUID, birim test, "bekleyen senkron" göstergesi. |
| Saat dilimi farkı iki kullanıcı arası | Dönem sınırında küçük sapma | Belgele, gerekirse pair için tek ortak `timezone` zorunlu kıl. |
| Kota rakamları üçüncü taraf kaynaklı, plan değişebilir | Beklenmeyen limit | Kurulumda resmi sayfadan doğrula. |

Açık sorular (ürün kararı): (1) Habit'ler kişiye özel mi yoksa ortak mı olabilir? Önerilen: kişiye özel, partnere görünür. (2) Birden fazla kez sayılan habit'ler olacak mı? (`seq`) (3) Bonus kuralları (günün hepsi, seri) MVP'de olsun mu? (4) Haftanın kazananına ödül/seri gösterilsin mi?

## 14. Kaynaklar

- Expo SDK 58: https://expo.dev/changelog/sdk-58 , yükseltme rehberi: https://expo.dev/blog/how-to-upgrade-to-sdk-58
- Expo SDK 57: https://expo.dev/changelog/sdk-57 , SDK 56: https://expo.dev/changelog/sdk-56
- Expo Go ve App Store (Mayıs 2026): https://expo.dev/changelog/expo-go-and-app-store-may-2026
- Expo Go giriş zorunluluğu: https://expo.dev/changelog/expo-go-57-login
- Expo Go proje yükleme değişiklikleri: https://expo.dev/changelog/expo-go-loading-changes-may-2026
- npm registry (`expo`, `expo-template-default`, `bundledNativeModules.json`, diğer paketler)
- Supabase: Anonymous Sign-Ins https://supabase.com/docs/guides/auth/auth-anonymous , Expo rehberi https://supabase.com/docs/guides/with-expo , Realtime benchmark/migrasyon https://supabase.com/docs/guides/realtime/benchmarks , duraklatma SSS https://supabase.com/kb/faqs/platform/free-project-pausing (arama sonuçları üzerinden, sayfalar bu ortamda açılamadı)
- Firebase + Expo: https://docs.expo.dev/guides/using-firebase/ (arama özeti)
- PocketBase RN SSE: https://www.npmjs.com/package/react-native-sse
