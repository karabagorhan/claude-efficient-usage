# İki Kişilik Rutin Uygulaması: Puan ve Oyunlaştırma Sistemi Tasarımı

Tarih: 2026-11-08 | Kapsam: 2 kişilik (çift/arkadaş) günlük rutin yarışı | Dil: Türkçe

Bu belgedeki tüm sayılar başlangıç önerisidir. Hepsi tek bir yapılandırma dosyasında (bkz. Bölüm 9) tutulmalı, test sürecinde ayarlanabilmelidir.

---

## 0. Araştırma Özeti ve İlham Notları (kopyalama yok)

Web aramasında resmi dokümantasyona değil çoğunlukla ikincil kaynaklara (blog, inceleme, wiki) ulaşılabildi. Kesin formül bulunamadı; aşağıdakiler yön gösterici ilkeler olarak alındı, sayılar bu tasarıma özgüdür.

| Uygulama | Gözlenen mekanik (kaynaklara göre) | Bizim yorumumuz |
|---|---|---|
| Habitica | Zor görev daha çok altın/XP verir; kaçırılan günlük görev can (HP) kaybettirir; görev "değeri" renkle değişir; seri altın bonusu verir. | Zorluk basamakları ve seri çarpanı var. Can kaybı/ölüm cezası yok, çünkü iki kişilik ilişkide cezalandırıcı his motivasyonu düşürür. |
| Duolingo | Haftalık XP ligleri, seri dondurma (streak freeze), seri kaybı korkusu. Eleştiri: XP "kolay işe" yönlendirebilir. | Haftalık sıralama ve seri kalkanı var. Kolay görev enflasyonunu engelleyen kurallar eklendi (Bölüm 1.7). |
| Streaks | Görevler belirli haftanın günlerine ya da haftada/ayda N kereye ayarlanabilir; duraklatma var; planlı günde kaçırmak seriyi sıfırlar. | Seri yalnızca "planlı gün" üzerinden sayılır; haftalık kotalı rutinler için hafta serisi var (Bölüm 2.3). |
| Habitify | "Atla" (skip) seçeneği seriyi korur; esnek/isteğe bağlı gün mantığı. | "Mola modu" ve kalkan sistemi (Bölüm 2.4). |
| Fabulous | Sabah/öğleden sonra/akşam rutinleri ve çok günlü "yolculuk" yapısı; rozet doğrulanamadı. | Şablonlar sabah/akşam paketleri halinde (Bölüm 5). |
| Me+ | Planlayıcı odaklı; arama sonuçlarına göre oyunlaştırması hafif. Oyunlaştırma için esas ilham Habitica ve Duolingo'dan alındı. | Planlama kolaylığı: hazır şablon ve paketler. |

Kaynaklar (erişim 2026-11-08, hepsi ikincil kaynak):
- https://habitica.fandom.com/wiki/Creating_a_Unique_Experience
- https://forum.beeminder.com/t/habitica-how-it-works-how-beeminders-integration-works/4643
- https://desirabilitylab.com/backfill/backfill-2023-310-duolingo-streak-system
- https://desirabilitylab.com/backfill/backfill-2023-278-duolingo-social-features
- https://www.protein.xyz/don-t-break-the-chain/
- https://feedback.habitify.me/p/new-habit-logic-grace-optional-days-skip-vs-fail
- https://design.google/library/engagement-is-fabulous-health-app
- https://www.productivity-apps.com/apps/me-plus-lifestyle-routine

Tasarım ilkeleri:
1. Kayıp korkusundan çok ilerleme hissi. Negatif puan varsayılan olarak yok.
2. İki kişi için adil olmalı. Daha çok/daha kolay görev ekleyen avantaj sağlamamalı (tavan + enflasyon kuralları).
3. Rekabet ile işbirliği ayrı katmanlar: "Sıralama Puanı" yarıştırır, "Bonus XP" birlikte büyütür.
4. Her kural tek cümleyle açıklanabilir olmalı.

---

## 1. Puan Kuralları

### 1.1 Para birimleri

- **SP (Sıralama Puanı):** Görevlerden ve günlük bonuslardan kazanılır. Liderlik tablosunu belirler. Aynı zamanda XP'ye eklenir.
- **Bonus XP:** Rozet, şampiyonluk, ortak hedef gibi ödüllerden gelir. Sadece seviyeyi ilerletir, liderlik tablosuna girmez (kartopu etkisini önlemek için).
- **Toplam XP = toplam SP + toplam Bonus XP.**
- **Kalkan:** Seri koruma hakkı (Bölüm 2.4). Puan değildir.

### 1.2 Görev zorluk seviyeleri (taban puan)

| Seviye | Taban SP | Ölçüt | Örnek |
|---|---|---|---|
| Mini | 5 | 2 dakikadan kısa, direnci yok | Yatağı topla, vitamin al |
| Kolay | 10 | Yaklaşık 10 dakikaya kadar, düşük direnç | Sabah esnemesi, günlük yazma |
| Orta | 20 | 10-30 dakika ya da orta direnç | 25 dk odak, 20 dk yürüyüş |
| Zor | 35 | 30+ dakika ya da yüksek direnç | 40 dk antrenman, 90 dk derin çalışma |
| Efsane | 50 | 60+ dakika, haftalık/aylık nitelikte emek | Haftalık yemek hazırlığı, 2 saat doğa yürüyüşü |

Çok adımlı/sayaçlı görevlerde (örnek: 8 bardak su) puan hedefe ulaşıldığında tek seferde verilir; ara ilerleme için puan verilmez, yalnızca ilerleme halkası dolar.

### 1.3 Seri (streak) bonusu

Bonus görev bazlıdır: görevin kendi serisi uzadıkça o görevin puanı çarpılır. Yuvarlama en yakın tam sayıya yapılır.

| Görevin güncel serisi | Çarpan |
|---|---|
| 0-2 | x1.00 |
| 3-6 | x1.10 |
| 7-13 | x1.20 |
| 14-29 | x1.30 |
| 30-59 | x1.40 |
| 60+ | x1.50 (üst sınır) |

Ek olarak "Gün Serisi" (Bölüm 2.1) her 7. günde bir kalkan kazandırır.

### 1.4 Günlük tüm görevleri bitirme bonusu (Mükemmel Gün)

- Koşul: O gün planlı en az 3 görev olmalı ve hepsi tamamlanmış olmalı (esnek/kotalı görevler paydaya girmez).
- **Mükemmel Gün bonusu = o günün taban puanları toplamının %15'i, en az 10, en çok 40 SP.**
- **Neredeyse Mükemmel:** Planlı görevlerin %80-%99'u tamamlandıysa sabit +5 SP.
- **Haftalık Mükemmel:** Haftalık kotalı tüm görevler Pazar günü gün sonuna kadar kotayı doldurursa +25 SP (Pazar gününe yazılır).

### 1.5 Erken tamamlama bonusu (var, küçük tutuldu)

- Kullanıcı görev için isteğe bağlı "hedef saat" belirler (örnek: 08:00). Hedef saatten önce işaretlenirse **+%10 taban puan, en az 1, en çok 5 SP**.
- Günlük erken bonus toplamı en çok **15 SP**.
- Hedef saat, görevin başlangıcından en az 30 dk sonra olmalı; sistem saati sunucu zamanıdır, geçmişe dönük işaretlemede erken bonus yoktur.
- Amaç: "gün bitmeden son dakikaya bırakma" davranışını hafifçe ödüllendirmek, erken kalkanı dezavantajlı bırakmamak. Bonus küçük olduğu için gece geç çalışanları cezalandırmaz.

### 1.6 Kaçırılan görev: ceza olacak mı? (öneri)

**Varsayılan: Hayır, negatif puan yok.** Kaçırılan görev puan getirmez ve görevin serisini keser (kalkan yoksa). Gerekçe: iki kişilik ilişkide puan kaybı gerilim ve kaygı yaratır; zaten sıralamada rakibin önde olması yeterli "ceza"dır.

**İsteğe bağlı: "Taahhüt Görevi".** Yalnızca kişi kendi seçerse:
- Görev "Taahhüt" işaretlenir (haftada en çok 2 görev).
- Başarıda +%20 puan; kaçırılırsa -%50 taban puan (örnek Orta: -10 SP).
- Günlük toplam ceza en çok -30 SP; günün net SP'si 0'ın altına düşmez.
- Partner onayı gerekmez, ancak partner Taahhüt'ü görür ("Ayşe bugün 2 taahhüt verdi").
- Mola modundaki günlerde ceza uygulanmaz.

### 1.7 Günlük puan tavanı ve hile önleme

Tavanlar:
- **Planlanabilir taban puan sınırı: günde 200 SP.** Bir günün planlı görevlerinin taban toplamı 200'ü aşıyorsa uygulama "Fazlası yarışa sayılmaz" uyarısı gösterir; sıralamada yalnızca ilk 200 taban puana denk gelen görevler esas alınır (kullanıcının sırasıyla).
- **Yumuşak tavan: 300 SP/gün.** 300'ü aşan puanın yalnızca %25'i sayılır.
- **Sert tavan: 350 SP/gün** (bonuslar dahil). Teorik azami: 200 x 1.5 + 40 + 15 = 355, yani sert tavan neredeyse hiç sınırlayıcı değildir; hile değil uç durum koruması.

Hile ve enflasyon önleme kuralları:
1. Her görev günde bir kez puan verir. Geri alma (undo) 5 dakika içinde serbesttir; sonrasında geri alınırsa puan düşülür.
2. **Mini enflasyonu:** Günde 6'dan fazla Mini görevin 7. ve sonrası 0 SP verir (seriye sayılır).
3. **Zorluk dengesi:** Günde en çok 3 Zor ve 1 Efsane görev puan verir; fazlası Orta puanı alır.
4. **Zorluk değişimi:** Bir görevin zorluğu haftada en çok 1 kez değiştirilebilir, değişiklik ertesi günden geçerlidir. Yeni özel görev ilk 24 saatte %50 puan verir (puan enflasyonu için ekleyip hemen işaretlemeyi engeller).
5. **Toplu işaretleme:** 60 saniyede 5'ten fazla görev işaretlenirse 6. ve sonrası %50 puan alır, erken bonus almaz. Uygulama "Geçmişe dönük mü işaretliyorsun?" diye sorar.
6. **Unuttum hakkı:** Haftada 1 kez dünün görevleri ertesi sabah 09:00'a kadar işaretlenebilir; %70 puan, erken bonus ve seri çarpanı hariç seri korunur. Sonuçlar 09:00'da kesinleşir.
7. **Sayaç/zamanlı görevler:** Zamanlayıcıyla tutulan görevlerde minimum süre dolmadan tamamlanamaz.
8. **Zor/Efsane doğrulama (isteğe bağlı):** Partner "Onayla" derse +%10 bonus; onay olmasa da puan verilir (güven temelli). Partner, haftada 1 görev için "Hakem" bayrağı kaldırabilir; kişi 24 saat içinde not/fotoğrafla yanıt vermezse o görevin puanı yarıya iner. Ayarlardan kapatılabilir.
9. **Saat dilimi sabitleme:** Sunucu saati esastır; saat dilimi değişikliği haftada 1 kez ve onayla yapılabilir.

### 1.8 Örnek gün hesabı (doğrulanmış)

Sekiz planlı görev, taban toplam 125 SP:

| Görev | Taban | Seri günü | Çarpan | Puan | Erken |
|---|---|---|---|---|---|
| Yatağı topla | 5 | 5 | 1.1 | 6 | - |
| Su: 8 bardak | 10 | 12 | 1.2 | 12 | - |
| Sabah yürüyüşü 20 dk | 20 | 8 | 1.2 | 24 | +2 |
| Meditasyon 10 dk | 20 | 16 | 1.3 | 26 | +2 |
| Antrenman 40 dk | 35 | 31 | 1.4 | 49 | - |
| Kitap 20 sayfa | 20 | 3 | 1.1 | 22 | - |
| Diş ipi | 5 | 9 | 1.2 | 6 | - |
| Telefonsuz 1 saat | 10 | 20 | 1.3 | 13 | - |
| **Toplam** | **125** | | | **158** | **+4** |

Mükemmel Gün bonusu: %15 x 125 = 18.75, yuvarlanır 19 SP. **Gün toplamı = 158 + 4 + 19 = 181 SP.** Tipik kullanıcı için günlük 150-200 SP beklenir.

---

## 2. Seviye (XP) Eğrisi, Seri Kuralları

### 2.1 Seviye eğrisi

- Seviye L-1'den L'ye geçmek için gereken XP: **60 x (L-1) + 40**
- L seviyesine ulaşmak için toplam XP: **30L² + 10L - 40**
- Tipik 180 SP/gün ile tahmini süre aşağıdaki gibidir (bonus XP hariç, gerçekte biraz daha kısa).

| Seviye | Bu adım için XP | Toplam XP | Tahmini süre (180 SP/gün) |
|---|---|---|---|
| 2 | 100 | 100 | 1. gün |
| 3 | 160 | 260 | 2 gün |
| 5 | 280 | 760 | 4 gün |
| 7 | 400 | 1.500 | 8 gün |
| 10 | 580 | 3.060 | 17 gün |
| 15 | 880 | 6.860 | 38 gün |
| 20 | 1.180 | 12.160 | 2 ay |
| 25 | 1.480 | 18.960 | 3,5 ay |
| 30 | 1.780 | 27.260 | 5 ay |
| 40 | 2.380 | 48.360 | 9 ay |
| 50 | 2.980 | 75.460 | 14 ay |
| 75 | 4.480 | 169.460 | 2,6 yıl |
| 100 | 5.980 | 300.960 | 4,6 yıl |

Seviye 100 sonrası "Prestij" (yıldız) sistemi: XP sıfırlanmaz, her 6.000 XP'de bir Prestij yıldızı.

Unvanlar ve açılanlar:

| Seviye | Unvan | Açılan |
|---|---|---|
| 1-4 | Çaylak | Temel tema |
| 5-9 | Acemi Alışkan | 2. avatar çerçevesi, haftada 1 "Unuttum hakkı" |
| 10-14 | Düzenli | Kalkan stok kapasitesi 2 |
| 15-19 | Disiplinli | Özel ikon paketi, görev renkleri |
| 20-29 | Usta | Taahhüt Görevi, 3. çerçeve |
| 30-39 | Kahraman | Ortak hedef şablonları (büyük) |
| 40-49 | Efsane | Animasyonlu rozet vitrini |
| 50+ | Titan | Altın çerçeve, "Titan" kutlaması |

### 2.2 Seri türleri

1. **Görev serisi:** Bir görevin planlı günlerinde üst üste tamamlama sayısı. Puan çarpanını belirler (Bölüm 1.3).
2. **Gün serisi:** O günün planlı görevlerinin en az %70'i ve en az 1 görev tamamlanan üst üste gün sayısı. Planlı görevi olmayan gün seriyi artırmaz ama bozmaz (nötr gün).
3. **Çift serisi:** İki kişinin ikisinin de aynı gün "gün serisi" şartını sağladığı üst üste gün. Biri bozarsa çift serisi sıfırlanır (kalkanla korunabilir).

### 2.3 Hafta içi hedefli ve kotalı rutinler için seri nasıl sayılır

| Rutin türü | Örnek | Seri birimi | Kural |
|---|---|---|---|
| Her gün | Su, vitamin | Gün | Tüm günler planlı. |
| Belirli günler | Hafta içi spor (Pzt-Çar-Cum) | Planlı gün | Yalnızca planlı günler sayılır. Planlı olmayan gün nötrdür: seriyi ne artırır ne bozar. Pzt-Çar-Cum yapıldıysa seri 3'tür; Salı yapılmaması hata değildir. |
| Hafta içi (Pzt-Cum) | Çalışma saatleri | Planlı gün | Hafta sonu nötr. Cuma'dan sonra Pazartesi gelir, seri devam eder. |
| Haftada N kez (esnek) | Haftada 3 spor | Hafta | Pazartesi 03:00'da kapanan haftada kota dolduysa hafta serisi +1. Kota aşımı (N+2'ye kadar) %50 puan verir. |
| Ayda N kez | Ayda 4 uzun yürüyüş | Ay | Ay kapanışında kota doldu mu? Ay serisi olarak sayılır. |
| Tek seferlik/iş sonu | Fatura öde | Seri yok | Sadece puan. |

Ek notlar:
- Resmi tatil/özel gün: Kullanıcı o günü "planlı değil" işaretleyebilir (görev ayarlarında tek seferlik istisna); seri nötr kalır. Ayda en çok 4 istisna.
- Rutin gün planını değiştirmek geçmiş seriyi bozmaz; yeni plan ertesi günden geçerlidir.
- En iyi seri (rekor) ayrı tutulur ve profilde gösterilir.

### 2.4 Seri koruma: Kalkan, Mola modu, Toparlanma

- **Kalkan:** Gün serisinde her 7. günde +1 kalkan kazanılır; en çok 2 stok (Seviye 10'dan önce 1). Planlı görev kaçırılırsa otomatik kullanılır ve serinin o gününü korur. Bir kalkan tek günü kapatır. Görev serileri kalkanla da korunabilir (kişi seçer; varsayılan: yalnızca gün serisi).
- **Mola modu (hasta/seyahat/tatil):** Yılda 30 gün, art arda en çok 14 gün. Serileri dondurur, puan/ceza yok. O günlerin liderlik tablosu "Mola" olarak işaretlenir; şampiyon unvanı verilmez (Bölüm 3.4). Her iki kişi de aynı anda mola alabilir ("Çift molası").
- **Toparlanma:** Seri koptuktan sonraki 24 saat içinde, kaçırılan günün görevlerinin iki katı kadar görev tamamlayıp "Toparla" butonuna basarsa seri geri gelir. Ayda 1 kez ve rekor serisi için geçerli değildir.
- **Af hakkı:** Gün serisi 30 ve üzerindeyse ayda 1 kaçırma otomatik affedilir (kalkan gerekmez).

---

## 3. Liderlik Tabloları

### 3.1 Dönemler ve sıralama ölçütü

| Tablo | Dönem | Skor | Unvan |
|---|---|---|---|
| Günlük | 03:00 - ertesi gün 02:59 | O günün SP'si (Bölüm 1.7 tavanlı) | **Günün Şampiyonu** |
| Haftalık | Pazartesi 03:00 - sonraki Pazartesi 02:59 | Günlük SP toplamı + Haftalık Mükemmel bonusu | **Haftanın Yıldızı** |
| Aylık | Takvim ayı: 1'i 03:00 - sonraki ayın 1'i 02:59 | Günlük SP toplamı + haftalık bonuslar | **Ayın Efsanesi** |
| Çeyrek (isteğe bağlı) | 3 ay | Aylık galibiyet sayısı | **Çeyreğin Kralı/Kraliçesi** |

Hafta başlangıcı Pazartesi'dir; hafta, haftanın başlangıcı olarak 03:00 sınırıyla birlikte kapanır. Haftalık galibiyet için en az 3 aktif gün ve en az 150 SP, aylık için en az 10 aktif gün gerekir; aksi halde "Yeterli veri yok" ve unvan verilmez.

### 3.2 Adil oyun modu seçeneği

Çiftler iki mod arasında seçer:
- **Puan Modu (varsayılan):** SP karşılaştırılır. Tavanlar ve planlı puan sınırı sayesinde görev sayısı farkı sınırlıdır.
- **Oran Modu (daha adil):** "Planlı SP'nin yüzde kaçı kazanıldı" karşılaştırılır. Kişilerden biri daha az görev planlasa da yarışabilir. Eşitlik ihtimali daha yüksek olduğundan eşitlik kuralları aynı kalır.

### 3.3 Gün sonu ve zaman dilimi

- **Gün sınırı: 03:00** (çiftin ortak saat dilimi, varsayılan Europe/Istanbul, UTC+3, yaz saati yok). Gece yarısından sonra yapılan uyku/akşam görevleri bir önceki güne yazılır.
- Gün sınırı 00:00-05:00 arasında iki kişi birlikte onaylayarak değiştirilebilir, değişiklik bir sonraki Pazartesi'den geçerlidir.
- **Farklı saat dilimindeki çiftler:** Her kullanıcının günü kendi saat diliminde 03:00'te kapanır. Günlük sonuç, **her iki kullanıcının günü de kapandığında** kesinleşir (geç kapanan beklenir); o zamana kadar "Geçici" etiketi gösterilir. Böylece biri diğerinin saatinde avantaj/dezavantaj yaşamaz.
- **Sonuç bildirimi:** Sonuçlar ertesi sabah 09:00'da açıklanır (Unuttum hakkı penceresi sonrası).
- Sunucu saati esastır; cihaz saati değiştirilerek hile yapılması engellenir.

### 3.4 Eşitlik ve geçersiz gün kuralları

**Günlük kazanan olmak için:** en az 40 SP ve en az 3 tamamlanmış görev gerekir (boş günlerde unvan yok). Biri molada ise gün "Çekişmesiz" sayılır: skor kaydedilir, unvan verilmez.

Eşitlik durumunda sırasıyla:
1. **Günlük:** (a) Tamamlama oranı yüksek olan; (b) son puanı daha erken kazanan (gün içinde o toplam skora daha erken ulaşan); (c) hâlâ eşitse **Berabere**.
2. **Haftalık:** (a) Kazanılan günlük şampiyonluk sayısı; (b) ortalama tamamlama oranı; (c) Berabere.
3. **Aylık:** (a) Kazanılan haftalık unvan sayısı; (b) kazanılan günlük şampiyonluk sayısı; (c) Berabere.

**Berabere:** Unvan verilmez; iki kişinin "Beraberlik" sayacı +1 artar; ikisi de unvan Bonus XP'sinin yarısını alır. Haftada 1 kez "Uzatma turu" seçeneği: bir sonraki günkü skora göre beraberlik bozulur (isteğe bağlı eğlence kuralı).

### 3.5 Ödüller ve unvanlar

| Unvan | Bonus XP | Görsel ödül | Gerçek hayat ödülü (çift seçer) |
|---|---|---|---|
| Günün Şampiyonu | +20 | Altın taç ikonu, 24 saat profil çerçevesi, kutlama animasyonu | Küçük ayrıcalık: akşam yemeğini seçmek, bulaşıksız akşam |
| Haftanın Yıldızı | +75 | Yıldız rozeti, 7 gün özel profil rengi | Film/dizi seçme hakkı, kahve ısmarlama |
| Ayın Efsanesi | +200 | Efsane kupası, 30 gün vitrin, 1 kalkan | Bir günlük "hayır deme" hakkı, kazananın seçtiği aktivite |
| Çeyreğin Kralı/Kraliçesi | +500 | Animasyonlu taç | Çiftin birlikte belirlediği büyük ödül |

- "Ödül Kuponu" listesi uygulamada çift tarafından yazılır (örnek: "Kazanan film seçer"); kazanan kuponu kullanınca partnerine bildirim gider ve "Kullanıldı" olarak işaretlenir. Kuponlar para ile ilişkilendirilmez, sadece eğlence amaçlıdır.
- Kaybeden için teselli: "Rövanş Rozeti" görseli ve hemen ertesi günün hedefi gösterilir; puan avantajı verilmez (kasıtlı düşük performans yapmayı teşvik etmemek için).

### 3.6 Geçmiş şampiyonluk sayacı

Profilde ve kafa kafaya ekranında:
- Toplam: Günün Şampiyonu / Haftanın Yıldızı / Ayın Efsanesi / Çeyreğin Kralı sayıları, her iki kişi için.
- Beraberlik sayısı.
- **Şampiyonluk serisi:** Üst üste kazanılan gün/hafta sayısı, rekor seri.
- Aylık "kupa rafı": her ay için kazanan avatar küçük kupa olarak görünür, tıklayınca o ayın özeti açılır.
- Mevcut sezon ve tüm zamanlar ayrımı; "Sezonu sıfırla" yoktur, sayaçlar arşivlenir.

### 3.7 İki kişi arası kafa kafaya (head-to-head) ekranı önerisi

Üstte: bugün için **ip çekme çubuğu** (iki yanda avatar; ortadaki işaret SP farkına göre kayar), altında canlı fark ("Ayşe 35 puan önde, kapatmak için yaklaşık 2 Orta görev").

Bölümler:
1. **Bugün:** Her iki kişinin SP'si, tamamlama halkası, kalan görev sayısı, "Form" göstergesi (son 7 gün: 🟢 kazandı / ⚪ berabere / 🔴 kaybetti).
2. **Skor tablosu:** Günlük/haftalık/aylık/tüm zamanlar için K-B-M (galibiyet-beraberlik-mağlubiyet).
3. **Kategori düellosu:** Sabah, Akşam, Sağlık, Odak, Spor, Uyku kategorilerinde kim önde (radar grafik veya kategori çubukları). Kategori galibiyeti sembolik rozet verir.
4. **Rekorlar:** En yüksek günlük SP, en büyük fark, en uzun şampiyonluk serisi, en uzun seri, en çok ortak mükemmel gün.
5. **Son 30 gün grafiği:** İki çizgi, günlük SP; kazanılan günler üstte nokta olarak işaretli.
6. **Gizli mod (isteğe bağlı):** Günün son 3 saatinde partnerin puanı gizlenir ("Sis modu"), son anda kapanan sürpriz skor heyecanı için. Her çift kendi açar.
7. **Adil oyun uyarıları:** "Bu hafta Ali 2 gün mola aldı, hafta sonucu çekişmesiz günler hariç değerlendirilir."

---

## 4. İki Kişilik Sosyal Özellikler

### 4.1 Birbirinin puanını görme ve gizlilik

- Varsayılan: Partnerin günlük SP, tamamlama halkası, tamamladığı görev adları (liste).
- **Özel görev:** Kişi bir görevi "özel" işaretleyebilir (örnek: ilaç, sağlık); partner yalnızca "bir görev tamamlandı +10 SP" görür, adını görmez.
- **Canlı akış:** "Ayşe: Spor 40 dk +49 SP" şeklinde zaman damgalı kısa akış; kapatılabilir. Günde en çok 20 olay.
- Akşam 20:00 sonrası "Gün özeti" kartı: ikisinin gün skoru yan yana.

### 4.2 Dürtme (nudge)

- Partner, kalan görevi olan kişiyi dürtebilir: hazır mesajlar ("Hadi bir yürüyüş yapalım?", "Su içtin mi?", "Sana güveniyorum!"), isteğe bağlı emoji.
- **Sınırlar:** günde en çok 3 dürtme, iki dürtme arası en az 2 saat, sessiz saatler 22:00-08:00 (alıcı ayarlayabilir). Dürtme kapatılabilir ("Rahatsız etme" modu).
- **Teşvik:** Alıcı dürtmeden sonra 2 saat içinde görev tamamlarsa dürten kişi +2 Bonus XP alır (günde en çok 6 XP). SP verilmez, böylece sıralamada kayırma olmaz.
- Rakibi rahatsız etme riskine karşı, yalnızca bir saat dilimi uyuyan partnere "Uyuyor" göstergesiyle dürtme engellenir.

### 4.3 Tebrik ve kutlama

- Partner bir hedefe ulaştığında (rozet, seviye, seri 7/14/30/100, Mükemmel Gün) bildirim gelir ve tek dokunuşla **tebrik** gönderilebilir: 🎉 👏 🔥 💪 ve kısa hazır mesaj. Tebrikler puan vermez; "Alkış Makinesi" rozeti sayar.
- Bir üye seviye atladığında diğerinin ekranında konfeti ve "Kutla" düğmesi görünür; kutlama gönderilirse ilk kutlayana +5 Bonus XP (günde 1 kez).

### 4.4 Ortak hedefler

Ortak hedef çiftin birlikte seçtiği ya da şablondan aldığı ortak bir amaçtır. İlerleme iki kişinin katkısının toplamıdır; sıralamayı etkilemez (ek SP vermez).

| Hedef | Koşul | Süre | Ödül (Bonus XP her ikisine) |
|---|---|---|---|
| Birlikte 1.000 | Haftada ikisinin SP toplamı 1.000 | Hafta | +100 |
| İkimiz de 5 gün | Her ikisi 5 günde gün serisi şartını sağlar | Hafta | +100 |
| Ortak Mükemmel Hafta | Her ikisi de 7/7 "Neredeyse Mükemmel" | Hafta | +250 |
| Çiftin 100 kilometresi | Ortak sayaç (yürüyüş/koşu) | Ay | +300 |
| 30 gün telefonsuz akşam yemeği | İkisi de "Birlikte yemek" işaretler | 30 gün | +400 ve kupon |
| Çift serisi 30 | Üst üste 30 gün çift serisi | Süresiz | +500 |

- Hedef başlığı çift tarafından yazılabilir; "Ortak Ödül" gerçek hayatta çiftin seçtiği bir aktivite olur (örnek: hafta sonu kahvaltısı).
- **Birlikte görevi:** Görev "Birlikte" etiketiyle iki kişide de varsa, aynı gün ikisi de yapınca her ikisine +5 Bonus XP (günde en çok 3).

### 4.5 Karşılıklı kutlama anları

- **İkili konfeti:** Ortak hedef tamamlanınca iki ekranda aynı anda tam ekran kutlama, "Takım rozeti".
- **Haftalık özet kartı (Pazar 20:00):** Hafta sonuçları, kimin hangi kategoride önde olduğu, ortak hedef ilerlemesi, "Bu hafta partnerine teşekkür et" tek dokunuşluk mesaj.
- **Yıl dönümleri:** Eşleşmenin 7., 30., 100. ve 365. günü özel kutlama ve rozet.
- **Rövanş daveti:** Günün kaybedeni "Yarın rövanş" butonuyla partnerine meydan okuyabilir; yarın kazanan 2 kat Bonus XP (+40) alır. Haftada en çok 2 kez.

---

## 5. Rozet Listesi (42 rozet)

Rozet kademeleri ve Bonus XP: Bronz 25, Gümüş 75, Altın 200, Efsanevi 500. Gizli rozetler, açılana kadar adı/koşulu görünmez ("???").

| # | Rozet | Kademe | Koşul |
|---|---|---|---|
| 1 | İlk Adım | Bronz | İlk görevini tamamla. |
| 2 | Yuva Kurucu | Bronz | Partnerini davet et ve eşleş. |
| 3 | Rutin Mimarı | Bronz | 5 aktif görev oluştur. |
| 4 | İlk Mükemmel Gün | Bronz | Bir "Mükemmel Gün" yakala. |
| 5 | Üçlü Zincir | Bronz | Gün serisi 3. |
| 6 | Haftalık Ritim | Bronz | Gün serisi 7. |
| 7 | İki Hafta Demir | Gümüş | Gün serisi 14. |
| 8 | Ay Yıldızı | Gümüş | Gün serisi 30. |
| 9 | Yüz Gün Yolcusu | Altın | Gün serisi 100. |
| 10 | Yıl Boyu | Efsanevi | Gün serisi 365. |
| 11 | Hafta Sonu Savaşçısı | Gümüş | Cumartesi ve Pazar planlı görevlerini 8 hafta üst üste tamamla. |
| 12 | Geri Dönüş | Gümüş | En iyi serin 14+ iken seri koptuktan sonra yeniden 7 güne ulaş. |
| 13 | Bin Puan | Bronz | Toplam 1.000 SP. |
| 14 | On Bin | Gümüş | Toplam 10.000 SP. |
| 15 | Yüz Bin | Efsanevi | Toplam 100.000 SP. |
| 16 | Çift Haneli | Bronz | Seviye 10'a ulaş. |
| 17 | Çeyrek Asır | Gümüş | Seviye 25'e ulaş. |
| 18 | Yarım Yüzyıl | Altın | Seviye 50'ye ulaş. |
| 19 | Erken Kuş | Gümüş | 7 gün üst üste en az 1 görevde erken bonus al. |
| 20 | Uykucu Kral/Kraliçe | Gümüş | "Hedef saatte yat" görevini 7 gece üst üste yap. |
| 21 | Su Perisi | Gümüş | Su hedefini 30 gün üst üste tamamla. |
| 22 | Kitap Kurdu | Gümüş | Toplam 1.000 sayfa ya da 30 günlük okuma serisi. |
| 23 | Demir İrade | Altın | Toplam 50 Zor/Efsane görev tamamla. |
| 24 | Kategori Ustası | Gümüş | Tek kategoride 200 tamamlama (her kategori için ayrı rozet görseli). |
| 25 | Çok Yönlü | Bronz | Bir haftada 6 farklı kategoride en az 1 görev yap. |
| 26 | Mükemmel 7 | Altın | 7 gün üst üste "Mükemmel Gün". |
| 27 | İlk Zafer | Bronz | İlk "Günün Şampiyonu". |
| 28 | Hafta Hakimi | Gümüş | İlk "Haftanın Yıldızı". |
| 29 | Ay Efendisi | Altın | İlk "Ayın Efsanesi". |
| 30 | Hat-trick | Gümüş | Üst üste 3 gün Günün Şampiyonu ol. |
| 31 | Son Dakika Golü | Gümüş | Saat 21:00'de 20+ SP gerideyken günü kazan. |
| 32 | Centilmen | Bronz | 3 beraberlik yaşa. |
| 33 | Büyük Geri Dönüş | Altın | Haftanın ortasında (Perşembe 03:00) 100+ SP geride iken haftayı kazan. |
| 34 | Kıvılcım | Bronz | Dürttüğün partner 2 saat içinde görev tamamlasın (ilk kez). |
| 35 | Alkış Makinesi | Gümüş | 50 tebrik gönder. |
| 36 | Takım Ruhu | Bronz | İlk ortak hedefi tamamla. |
| 37 | İkiz Ritim | Gümüş | Çift serisi 14. |
| 38 | Birlikte Güçlü | Gümüş | Aynı gün ikisi de 10 "Birlikte" görevi tamamla (toplam). |
| 39 | Yüzüncü Gün | Altın | Eşleşmenin 100. günü (ikisi de aktif). |
| 40 | Gece Yarısı Pilotu (gizli) | Bronz | 23:55-23:59 arasında en az 3 görevi tamamla. |
| 41 | Seher Vakti (gizli) | Gümüş | 05:30'dan önce 5 gün üst üste görev işaretle. |
| 42 | Mola Bilgesi (gizli) | Bronz | Mola modundan sonra ilk gün tüm planlı görevleri yap. |

Rozetler vitrinde 3 öne çıkan olarak seçilebilir, partner vitrini görebilir.

---

## 6. Hazır Rutin Şablonları (44 görev)

Her görevde: ikon önerisi (emoji / Lucide ikon adı), zorluk, varsayılan SP, tür. Tür: **Sayaç** = hedef sayıya ulaşınca tamamlanır; **Zamanlı** = zamanlayıcıyla; **Evet/Hayır** = tek dokunuş; **Birlikte** = iki kişiye birden atanabilir. Varsayılan planı Her gün, aksi belirtilmedikçe.

### Sabah
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 1 | Yatağı topla | 🛏️ bed | Mini | 5 | Evet/Hayır |
| 2 | Güne bir bardak suyla başla | 💧 glass-water | Mini | 5 | Evet/Hayır |
| 3 | Hedef saatte kalk | ⏰ alarm-clock | Orta | 20 | Erken bonus ana görevi; Evet/Hayır |
| 4 | Sabah esnemesi (5 dk) | 🧘 stretch-horizontal | Kolay | 10 | Zamanlı |
| 5 | Güne niyet yaz (1-2 cümle) | 📓 notebook-pen | Kolay | 10 | Evet/Hayır |
| 6 | Dengeli kahvaltı yap | 🍳 egg-fried | Kolay | 10 | Evet/Hayır |

### Akşam
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 7 | Yarının çantasını/kıyafetini hazırla | 🎒 backpack | Kolay | 10 | Evet/Hayır |
| 8 | Mutfağı topla | 🍽️ utensils | Kolay | 10 | Birlikte olabilir |
| 9 | 10 dakikalık ev toplama | 🧹 brush-cleaning | Orta | 20 | Zamanlı |
| 10 | Gün sonu yansıması (3 şükür) | 🌙 moon-star | Kolay | 10 | Evet/Hayır |
| 11 | Yatmadan 30 dk önce ekranı kapat | 📵 smartphone-off | Orta | 20 | Evet/Hayır |
| 12 | Cilt bakımı | 🧴 sparkles | Mini | 5 | Evet/Hayır |

### Sağlık
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 13 | 8 bardak su iç | 💧 droplets | Kolay | 10 | Sayaç |
| 14 | Vitamin/ilaç al | 💊 pill | Mini | 5 | Evet/Hayır, "özel" önerilir |
| 15 | 5 porsiyon meyve-sebze | 🥗 salad | Orta | 20 | Sayaç |
| 16 | Şekerli içecek içme | 🚫🥤 cup-soda | Kolay | 10 | Evet/Hayır |
| 17 | Diş ipi/ağız bakımı | 🦷 smile | Mini | 5 | Evet/Hayır |
| 18 | 15 dk dışarıda güneş al | ☀️ sun | Kolay | 10 | Zamanlı |
| 19 | Öğle sonrası kafein kesme (14:00 sonrası) | ☕ coffee | Kolay | 10 | Evet/Hayır |

### Odak
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 20 | 25 dk odak (pomodoro) | 🍅 timer | Orta | 20 | Zamanlı |
| 21 | 90 dk derin çalışma | 🎯 target | Zor | 35 | Zamanlı, günde 1 |
| 22 | Günün en önemli 1 işini bitir | ✅ circle-check | Orta | 20 | Evet/Hayır |
| 23 | 20 sayfa kitap oku | 📖 book-open | Orta | 20 | Sayaç |
| 24 | 15 dk yeni bir şey öğren | 🎓 graduation-cap | Orta | 20 | Zamanlı |
| 25 | Telefonsuz 1 saat | 📵 phone-off | Kolay | 10 | Zamanlı |
| 26 | Gelen kutusunu/planı gözden geçir | 📥 inbox | Mini | 5 | Evet/Hayır |

### Spor
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 27 | 20 dk yürüyüş | 🚶 footprints | Orta | 20 | Zamanlı |
| 28 | 10.000 adım | 👟 shoe | Orta | 20 | Sayaç (adım entegrasyonu) |
| 29 | 40 dk antrenman | 🏋️ dumbbell | Zor | 35 | Haftada 3 (kotalı), Zamanlı |
| 30 | 5 km koşu | 🏃 route | Zor | 35 | Kotalı (örnek haftada 2) |
| 31 | 10 dk esneme/mobilite | 🤸 person-standing | Kolay | 10 | Zamanlı |

### Uyku
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 32 | Hedef saatte yat (±30 dk) | 🛌 bed-double | Orta | 20 | Gün sınırı kuralıyla önceki güne yazılır |
| 33 | 7 saat+ uyu | 😴 moon | Orta | 20 | Evet/Hayır |
| 34 | 5 dk nefes egzersizi | 🌬️ wind | Kolay | 10 | Zamanlı |

### Zihin ve İlişki
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 35 | 10 dk meditasyon | 🧘‍♂️ brain | Orta | 20 | Zamanlı |
| 36 | Partnerine güzel bir mesaj yaz | 💌 heart | Mini | 5 | Evet/Hayır |
| 37 | Akşam birlikte yürüyüş | 🌆 footprints | Orta | 20 | Birlikte |
| 38 | Telefonsuz birlikte yemek | 🍲 soup | Kolay | 10 | Birlikte |
| 39 | Bir yakınını ara | 📞 phone-call | Kolay | 10 | Haftada 3 (kotalı) |

### Ev ve Finans
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 40 | Harcamaları kaydet | 💳 wallet | Kolay | 10 | Evet/Hayır |
| 41 | Bir ev işini bitir (çamaşır vb.) | 🧺 shirt | Kolay | 10 | Evet/Hayır |
| 42 | Haftalık market/liste planı | 🛒 shopping-cart | Orta | 20 | Haftada 1 |

### Efsane (haftalık/aylık)
| # | Görev | İkon | Zorluk | SP | Not |
|---|---|---|---|---|---|
| 43 | Haftalık yemek hazırlığı (meal-prep) | 🍱 chef-hat | Efsane | 50 | Haftada 1, Birlikte olabilir |
| 44 | 2 saatlik doğa yürüyüşü | 🥾 mountain | Efsane | 50 | Haftada 1 veya ayda 2, Birlikte olabilir |

### Hazır paketler (tek dokunuşla ekle)

| Paket | İçerik (görev no) | Taban SP |
|---|---|---|
| Sabah Işığı | 1, 2, 3, 4, 5, 6 | 60 |
| Akşam Yavaşlama | 7, 8, 10, 11, 12 | 55 |
| Sağlam Başlangıç (yeni başlayanlar) | 1, 13, 14, 27, 32 | 60 |
| Odak Günü | 20, 22, 25, 26, 23 | 75 |
| Spor Haftası | 29 (haftada 3), 28, 31 | 65 (antrenman günü) |
| Uyku Düzeni | 11, 19, 32, 34 | 60 |
| Çift Paketi | 36, 37, 38, 43 | 85 |

Varsayılan: yeni kullanıcıya en fazla 5-7 görev önerilir (tavandan uzak, yaklaşık 70-100 taban SP). Haftada 1 yeni görev ekleme önerisi ("Alışkanlık yığma") gösterilir.

---

## 7. Başlangıç Deneyimi ve Dengeleme Önerileri

- Yeni kullanıcı ilk hafta "Çaylak koruması": görev serisi çarpanları normal, ama Mükemmel Gün eşiği %80'e düşer (hayal kırıklığını azaltmak için).
- Eşleşmede iki kişi arasında "Sıralama modu" (Puan/Oran) ve "Ödül kuponları" birlikte seçilir.
- Kalibrasyon: İlk iki hafta ortalama günlük SP'yi ölçüp hedef 150-200 SP aralığından sapan çiftlere "Görev sayısı çok az/çok" önerisi göster.
- Metrikler (iç ölçüm): Günlük aktif kullanıcı, 7. gün ve 30. gün tutma, seri kopma oranı, kalkan kullanım oranı, dürtme sonrası tamamlama oranı, mola modu kullanımı.

---

## 8. Riskler ve Önlemler

| Risk | Önlem |
|---|---|
| Biri yarışı tamamen kazanıp diğeri küser. | Oran Modu, rövanş daveti, ortak hedefler, kaybedene teselli rozeti ve ödül kuponları. |
| Aşırı görev ekleyip puan şişirme. | Planlanabilir puan sınırı 200, Mini/Zor/Efsane limitleri, yeni görev %50 kuralı. |
| Seri kaygısı/tükenmişlik. | Kalkan, mola modu, af hakkı, nötr günler. |
| Partner baskısı/gözetleme hissi. | Özel görev, gizli mod, dürtme limitleri, sessiz saatler. |
| Saat dilimi/gün sınırı tartışmaları. | Çiftin ortak 03:00 sınırı, farklı bölgeler için "iki taraf kapanınca kesinleşir" kuralı. |
| Hile (toplu tıklama, geri alma). | Sunucu saati, toplu işaret kuralı, undo penceresi, isteğe bağlı Hakem bayrağı. |

---

## 9. Yapılandırma Özeti (tek dosyada tutulacak sabitler)

```yaml
difficulty_base_points: {mini: 5, easy: 10, medium: 20, hard: 35, epic: 50}
streak_multiplier:      # görev serisi günü -> çarpan
  "0-2": 1.00
  "3-6": 1.10
  "7-13": 1.20
  "14-29": 1.30
  "30-59": 1.40
  "60+": 1.50
perfect_day: {min_tasks: 3, pct: 0.15, min: 10, max: 40, almost_pct: 0.80, almost_bonus: 5}
weekly_perfect_bonus: 25
early_bonus: {pct: 0.10, min: 1, max: 5, daily_max: 15, min_lead_minutes: 30}
planned_base_cap_per_day: 200
soft_cap: {points: 300, over_rate: 0.25}
hard_cap: 350
limits: {mini_per_day_scored: 6, hard_per_day_scored: 3, epic_per_day_scored: 1}
new_task_first_24h_rate: 0.5
bulk_complete: {window_seconds: 60, max_full: 5, extra_rate: 0.5}
undo_window_minutes: 5
backfill: {per_week: 1, until: "09:00", rate: 0.7}
day_boundary: "03:00"
week_start: monday
timezone_default: Europe/Istanbul
win_thresholds: {daily_min_sp: 40, daily_min_tasks: 3, weekly_min_sp: 150, weekly_min_days: 3, monthly_min_days: 10}
level: {step_xp: "60*(L-1)+40", cumulative_xp: "30*L^2+10*L-40"}
shield: {earn_every_streak_days: 7, max_stock: 2, forgiveness_after_streak: 30, forgiveness_per_month: 1}
break_mode: {days_per_year: 30, max_consecutive: 14}
nudge: {per_day: 3, min_gap_hours: 2, quiet_hours: "22:00-08:00", reward_bonus_xp: 2, reward_daily_max: 6}
champion_bonus_xp: {daily: 20, weekly: 75, monthly: 200, quarterly: 500}
badge_bonus_xp: {bronze: 25, silver: 75, gold: 200, legendary: 500}
```

---

## 10. Sonraki Adımlar

1. Kuralları basit bir hesaplama betiğiyle (günlük puan + tavan + seri) birim testlerle doğrula; Bölüm 1.8'deki örnek test senaryosu olarak kullanılabilir (beklenen: 181 SP).
2. 2-3 çiftle 2 haftalık deneme: günlük SP dağılımı 150-200 hedef aralığında mı, eşitlik ve beraberlik sıklığı nedir?
3. Kafa kafaya ekranı için düşük çözünürlüklü prototip (ip çekme çubuğu, form göstergesi, kategori çubukları).
4. Resmi kaynaklardan (Habitica kodu/wiki, Duolingo yardım sayfaları) formül doğrulaması yapılırsa karşılaştırma tablosu güncellenebilir.
