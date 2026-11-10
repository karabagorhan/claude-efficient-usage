# All2Me — Ürün ve Teknik Şartname

Bu dosya tüm ajanlar için **sözleşmedir**. Kendi alanın dışındaki dosyalara dokunma.

## 1. Ürün

All2Me: günlük rutin + kendine bakım uygulaması (Expo, React Native, TypeScript). İki kişi birlikte kullanır;
puan toplar ve günlük / haftalık / aylık yarışır. Arayüz dili **Türkçe ve İngilizce** (uygulama içinden seçilir).
Ücretli sürüm yok: **bütün özellikler açık**, kilit / paywall / reklam yok.

Referans: kullanıcının gönderdiği 17 ekran görüntüsü (benzer bir uygulamanın). Dosyalar:
`/tmp/claude-0/-home-user-claude-efficient-usage/7a2449c7-1273-59e8-91d5-98898ce8212b/scratchpad/shots/s01.jpeg … s17.jpeg`
(Read aracıyla görüntülenir). Bunlar **düzen ve his için referanstır, kopyalanmaz**:

- "Me+" adı, logosu, maskotu, illüstrasyonları ve metinleri **kullanılmaz**. Referans görselleri repoya **eklenmez**.
- Sahte sosyal kanıt yok ("30M+ kullanıcı", "… tarafından onaylandı" gibi ifadeler yazılmaz).
- Tanı koyan psikolojik testler yok (travma / DEHB testi yerine tanı içermeyen "kendini tanı" mini testleri).
- Sağlık içeriği genel bilgi düzeyindedir; "tıbbi tavsiye değildir" notu taşır.
- İkonlar: emoji + `@expo/vector-icons` (Ionicons) + kendi SVG çizimlerimiz. Maskot: özgün, basit SVG karakter.

## 2. Görsel dil (referanstan çıkarılan)

- Zemin: çok açık lavanta-beyaz `#F7F7FF`; kartlar beyaz veya pastel.
- Metin: neredeyse siyah `#14171A`; ikincil `#6B7280`.
- Ana buton: **siyah hap (pill)**, beyaz kalın yazı, yükseklik ~56, tam yuvarlak. İkincil: beyaz zemin, siyah 1.5px çerçeve.
- Pastel kart renkleri (görev kartları): mavi `#CFE2FF`, yeşil `#DCF5B5`, mor `#E6D9FB`, nane `#C9F2E7`,
  şeftali `#FCE2C0`, pembe `#FBD5F7`, sarı `#FBEF7E`. Kart yarıçapı ~22, solda büyük emoji (40px), üstte küçük
  alt bilgi ("Her zaman", "0/1"), altta kalın başlık, sağda `›` veya onay dairesi.
- Vurgu renkleri: mercan `#FF6B3D` (onboarding halkaları), mor `#7C5CFC` (harekete geç ekranı gradyanı),
  pembe `#FF7AE0` (çark ekranı gradyanı), mavi `#3B6CF6` (çark çerçevesi), turuncu `#FF8A1F` (seri ekranı).
- Başlıklar büyük ve kalın (26-34px, weight 800). Bölüm başlığı + sağda "Tümü ›".
- Alt sekme çubuğu: beyaz, 5 sekme: **Rutin · İlham · Çark · Araçlar · Profil**. Etkin sekme siyah, pasif gri.
  Ortadaki Çark sekmesi renkli çark simgesi + pembe hap etiket.
- Koyu tema: destekle (aynı düzen, koyu zemin `#0E1016`, pastel kartlar koyulaştırılmış). Açık tema önceliklidir.
- Kutlama: konfeti animasyonu.

## 3. Ekranlar

### 3.1 Onboarding (referans s01, s02, s03, s08)
1. Dil seçimi (Türkçe / English) — ilk ekran, cihaz diline göre ön seçili.
2. Ad + avatar (emoji) + renk.
3. Evet/Hayır soru kartları (büyük başlık, ortada sade görsel, altta "Hayır" çerçeveli + "Evet, hadi!" siyah buton):
   günü düzenlemek, iyi alışkanlık kazanmak, daha iyi uyumak, daha odaklı olmak (4-5 soru).
4. Sonuç ekranı: 2x2 halka gösterge (Öz-denetim, Konsantrasyon, Üretkenlik, Enerji), her biri cevaplara göre
   "Geliştirilebilir / İyi / Harika" etiketi. Sahte istatistik yok.
5. Cevaplara göre önerilen başlangıç görevleri (seçilebilir liste) → eklenir.
6. Partner eşleştirme (kod üret / kodla katıl / şimdilik atla).
7. Konfetili "Çok iyi bir başlangıç!" ekranı → ana ekran.

### 3.2 Rutin sekmesi (ana pano — referans görüntüsü yok, aynı dille tasarla)
- Üst: selam + tarih, sağda seri alevi 🔥 N (dokununca Seri ekranı) ve bugünkü puan rozeti.
- Haftalık tarih şeridi (gün seçilir; geçmiş günler salt okunur, dün için "unuttum hakkı").
- Yarış kartı: ben vs partner bugünkü puan, çekişme çubuğu (dokununca Yarış ekranı). Partner yoksa "Partner ekle".
- Günlük ilerleme halkası/çubuğu (x/y görev).
- Görevler zaman dilimine göre: Sabah · Öğleden sonra · Akşam · Her zaman. Pastel kartlar; dokun = tamamla
  (kısa kutlama + kazanılan puan), sayaç görevlerinde artır, uzun bas = düzenle.
- Sağ altta yüzen **＋** → Yeni Görev sayfası.
- Boş durum: maskot + "İlk görevini ekle".

### 3.3 Yeni Görev sayfası (referans s10, s11) — modal
- Başlık "Yeni Görev" / "Yeniden adlandırmak için dokun" (dokununca özel görev adı yazılır → görev düzenleyici).
- Üstte iki özel kart: **"Gününü akıllı planla"** (çevrimdışı planlayıcı, gradyan kart) ve
  **"Şanslı görevini çevir"** (rastgele kendine bakım görevi önerir).
- Bağlı araç görevleri: Su iç (0/hedef), Ruh hali kaydı (0/1), Yansıma (0/1).
- Önerilen görevler (pastel kartlar, emoji, "Her zaman"): tırnak kes, kahvaltı yap, pencereleri aç, yatağı topla,
  bütçemi kaydet, diş fırçala, ilaç/vitamin al (Hedef 0/1), saç tara, masayı topla … (en az 30 öneri, kategorili).
- Karta dokun → görev düzenleyici (ön dolu) → kaydet.

### 3.4 Görev düzenleyici
Ad, emoji, pastel renk, zaman dilimi, tekrar (her gün / belirli günler / haftada N), tür (evet-hayır / sayaç hedefi /
süreli), zorluk (puan), hatırlatıcı saati, özel (partner görmez), birlikte. Sil = arşivle.

### 3.5 Harekete Geç ekranı (referans s04)
Mor gradyan, "Harekete geçme zamanı!", hafif eğik görev kartı, **"Tamamlandı"** (siyah) / **"Sonra yap"** (çerçeveli),
altta maskot. Çarktan, şanslı görevden ve hatırlatıcıdan açılır.

### 3.6 Çark sekmesi (referans s09, s12)
- Pembe gradyan zemin, "Eğlenceli Ev İşi Çarkı" başlığı, mavi dalgalı çerçeveli **SVG çark**, 10 dilim (pastel),
  her dilimde emoji + kısa ad, ortada maskot. Çevirince yavaşlayarak durur, alttaki şeritte sonuç görünür,
  ardından Harekete Geç ekranı açılır.
- Sağ üst: sıfırla, **düzenle** (dilimleri ekle/sil/yeniden adlandır, emoji seç).
- Çevirme hakkı **sınırsız** (ücretli sürüm davranışı). Birden çok çark: Ev işleri, Kendine bakım, Hareket.
- Tamamlanan çark görevi puan verir (günde en fazla 5 çark görevi puanlanır).

### 3.7 İlham sekmesi (referans s07, s13, s14, s15, s17)
- Başlık "İlham", sağda arama ve favoriler (kalp).
- Üstte kayan afiş (öne çıkan şablonlar).
- Yatay kategori ikonları: Temizlik Planları, Kendime Bakım, Odak ve Sakinlik, Sabah Rutinleri, İş ve Ders,
  Yemek, Spor, Günün Sonu, Güzellik …
- Bölümler (yatay kaydırılan dikey kartlar, "Tümü ›"): Popüler temizlik şablonları, Düzenli ol, İş ve Ders 101,
  Okula dönüş, Yemek ipuçları, Fit ve harika, Günün sonunda, Kaçırılmayacak ipuçları, Kendini tanı (mini testler),
  Merhaba güzellik.
- Şablon kartı: renkli zemin, büyük başlık, içinde 6-9 maddelik ızgara/liste (emoji + ad).
- Şablon detayı: maddeler, "Hepsini rutine ekle" / tek tek ekle, favorile.
- En az **40 özgün şablon**, iki dilde.

### 3.8 Araçlar sekmesi (referans s05, s06)
- Başlık "Kendine Bakım Araçları", afiş: "Kendimi Sevmenin 100 Yolu" (kart destesi).
- Yatay araç ikonları: **Zamanlayıcı, Su, Uyku, Yansıma, Meditasyon, Egzersiz, Motivasyon, Ses Ortamı, Alarm**.
- "Nasıl hissediyorsun? Kaydetmek için dokun" ruh hali kartı.
- "Su içme zamanı! Su takibi ve günlük hatırlatıcılar" kartı.
- "Yansıma" bölümü: yansıma konuları listesi (hepsi açık).

Araçlar:
| Araç | İçerik |
|---|---|
| Zamanlayıcı | Odak/pomodoro geri sayım, hazır süreler, bildirim, bir göreve bağlanabilir |
| Su | Günlük hedef (ml / oz seçimi), bardak ekle, günlük geçmiş, hatırlatıcı aralığı |
| Uyku | Yatış/kalkış kaydı, hedef süre, 7 günlük grafik, yatma hatırlatıcısı |
| Yansıma | Konulu yansıma soruları (en az 20 konu), cevap yazma, geçmiş |
| Meditasyon | Yönlendirmeli nefes (4-4-4-4, 4-7-8, sakin nefes), süre seçimi, animasyon |
| Egzersiz | Hazır kısa rutinler (masa başı esneme, 7 dk, sabah mobilite…), adım adım zamanlayıcı |
| Motivasyon | Günün sözü + kaydırılabilir söz kartları (özgün, iki dilde), favori |
| Ses Ortamı | Döngülü ortam sesleri (yağmur, okyanus, beyaz/pembe/kahverengi gürültü, vantilatör), uyku zamanlayıcısı. Sesler betikle sentezlenir (telifsiz) |
| Alarm | Saat + gün seçimiyle yerel bildirim alarmı, etiket |
| Ruh hali | 5 seviye + etiket + not, takvim görünümü |
| Kendimi Sevmenin 100 Yolu | 100 kısa öneri kartı, "bugün yaptım" işareti |

### 3.9 Profil sekmesi (referans görüntüsü yok)
Avatar, ad, seviye + XP çubuğu, toplam puan; kartlar: Seri (→ Seri ekranı), Yarış (→ Yarış ekranı), Rozetler,
İstatistik (günlük puan grafiği, ısı haritası, kategori dağılımı), Partner/senkron durumu, Ayarlar
(**dil**, birim ml/oz, hatırlatıcılar, tema, verileri sıfırla).

### 3.10 Seri ekranı (referans s16)
Turuncu gradyan, alev, büyük sayı "N günlük seri", teşvik afişi, **Seri Takvimi** (ay görünümü, tamamlanan günler
turuncu daire, ay gezinme). "Gün serisi" = o gün en az 1 görev tamamlandı.

### 3.11 Yarış ekranı
Günlük / Haftalık / Aylık sekmeler, dönem gezinme, ben vs partner puan, çekişme çubuğu, kazanan afişi
(Günün Şampiyonu / Haftanın Yıldızı / Ayın Efsanesi), gün gün grafik, şampiyonluk rafı, son 7 gün formu,
Dürt / Tebrik et, partnerin son hareketleri.

### 3.12 Akıllı planlayıcı (çevrimdışı)
3-4 soru (ne zaman kalkıyorsun, bugünkü enerji, odak alanı: ev / iş / sağlık / kendime bakım, kaç dakikan var) →
kural tabanlı olarak şablon havuzundan saatli bir gün planı önerir → "Rutinime ekle". Ağ / API anahtarı yok.
Ekranda "yapay zekâ" iddiası yok; adı "Akıllı planlayıcı".

## 4. Teknik

- Expo SDK 58, expo-router, TypeScript strict. Expo Go'da çalışmalı (özel native modül yok).
- Mevcut `../duoplus` projesinden **taşınacaklar**: `src/engine/*` (puan motoru, tarih, seviye, liderlik, rozet),
  `src/store/store.ts` (uyarlanarak), `src/lib/{sync,supabase,notifications,id}.ts`, `supabase/0001_init.sql`,
  `tests/*`. Puan kuralları `../research/gamification.md`.
- Çekirdek store (partnerle senkronlanır): profil, görevler, tamamlamalar, puan olayları, rozetler, dürtmeler.
- Araç verileri (su, uyku, ruh hali, yansıma, alarm, çark, favoriler, ayarlar): **ayrı zustand dilimleri**,
  her biri kendi AsyncStorage anahtarıyla, yalnızca cihazda.
- i18n: bağımlılıksız küçük modül. `useT()` → `t('ns.key', params)`. İçerik verileri `{ tr: string; en: string }`
  ve `L(obj)` yardımcı fonksiyonu. **Ekranlarda sabit metin yok**; her metin sözlükten gelir.
- Web önizleme (doğrulama için): `react-native-web` kurulu, Playwright ile ekran görüntüsü betiği.
- Testler: `npm test` (motor + store), `npm run typecheck`. İkisi de geçmeli.

## 5. Çalışma kuralları (ajanlar)

- Yalnızca sana atanan dosyalara yaz. Ortak dosyaları (çekirdek store, tema, ortak bileşenler, `package.json`)
  **değiştirme**; eksik bir şey varsa raporunda belirt.
- `npm install` / `expo install` çalıştırma (temel aşamada kurulur). Gerekli bir paket eksikse raporla.
- `git add/commit/push` yapma. Yönetici (ana oturum) toplar.
- İşin sonunda `npx tsc --noEmit` çalıştır; **kendi dosyalarındaki** hataları sıfırla.
- Rapor: ne yazdın, ne doğrulandı, ne doğrulanmadı / eksik kaldı. Çalıştırmadığın şeyi "çalışıyor" diye yazma.

## 6. Ek: Yaşam takibi (kullanıcı isteği, 2026-11-10)

Amaç: gündelik bir kişinin yapması gereken tüm aktiviteleri **takip**, **motivasyon** ve **hatırlatma** ile desteklemek.
Her takipçide üç katman olmalı: (1) hızlı kayıt (tek dokunuş), (2) ilerleme/istatistik + teşvik mesajları ve kilometre
taşları, (3) yerel bildirim hatırlatıcıları (kendi bildirim grubu; ayarlardan kapatılabilir). Puan: bağlı görev
(`link`) tamamlanınca normal puan; görev dışı başarılar `awardBonus({group, perDay})` ile küçük bonus
(tek seferde en çok 50). Tüm veri cihazda (dilim); partnerle senkron yalnız çekirdek veride.

Rotalar (kayıtlı, `routes.life(..)`, `routes.study()`, `routes.growth()`): `/life` (merkez), `/life/smoke`,
`/life/meals`, `/life/chores`, `/study`, `/study/course/[id]`, `/study/item/[id]` (modal; `id`=öğe ya da `new`,
`courseId?`, `type?`), `/growth`, `/growth/goal/[id]` (modal; `id`=hedef ya da `new`).
Bağlı görev türleri: `smoke | meal | chore | study | growth` (ActivityKind'de de var).
Ad alanları: `life` (merkez, sigara, yemek, ev işleri), `study`, `growth`.

### 6.1 Yaşam merkezi `/life`
Bugünün özeti kartları: sigara (bugün x / limit), yemek (bu hafta ev yemeği / fast food), ev işleri (bugün/gecikmiş),
okul (en yakın teslimler — `useStudySummary()`), gelişim (`useGrowthSummary()`); her kart ilgili ekrana gider.
Üstte günün teşvik mesajı (ilerlemeye göre seçilir).

### 6.2 Sigara azaltma `/life/smoke`
- Kurulum: başlangıç günlük adet, paket fiyatı + paketteki adet (para birimi dile göre ₺ / $, değiştirilebilir),
  hedef (ör. 5/gün ya da 0), azaltma planı: limit her N günde 1 azalır (önizlemeli takvim).
- Bugün: adet / limit halkası, son sigaradan beri geçen süre (canlı), "Bir sigara içtim" (tetikleyici etiketi
  isteğe bağlı: stres, kahve, yemek sonrası, sosyal, sıkıntı, alışkanlık, alkol), geri al.
- "İstek geldi, içmedim": 5 dakikalık erteleme sayacı + nefes egzersizine bağlantı; direnince küçük bonus
  (`group:'smoke'`, günde en çok 5).
- Günü kapatma: limitte kalındıysa "Bugün limitimde kaldım" → `completeLinked('smoke')` (akşam 18:00 sonrası ya da
  ertesi gün 03:00'a kadar).
- İstatistik: 7/30 gün grafik (limit çizgisiyle), içilmeyen sigara ve biriken para (başlangıca göre), limitte kalma
  serisi, tetikleyici dağılımı, en zor saatler. Kilometre taşları (para ve seri). Tıbbi iddia yok; medicalNote.
- Hatırlatıcılar (grup `smoke`): gün içi destek mesajları (seçilen saatler), akşam kapanış hatırlatıcısı.

### 6.3 Ev yemeği / fast food `/life/meals`
- Öğün kaydı: kahvaltı / öğle / akşam / ara öğün × tür: ev yemeği 🏠, dışarıda sağlıklı 🥗, fast food 🍔, atlandı;
  isteğe bağlı not ve tutar.
- Haftalık hedef: fast food en çok N, ev yemeği en az M. Haftalık ızgara (7 gün × öğün renkli), fast food'suz gün
  serisi, aylık fast food harcaması.
- Haftalık menü planlayıcı (7 gün × öğle/akşam) + en az 30 hızlı ev yemeği fikri (iki dilli, süre etiketiyle) +
  menüden alışveriş listesi (onay kutulu).
- Ev yemeği kaydı → `completeLinked('meal')`.
- Hatırlatıcılar (grup `meals`): akşam yemeği planı (ör. 17:00), haftalık hazırlık günü (ör. Pazar 18:00).

### 6.4 Ev işleri `/life/chores`
- Tekrarlı işler: aralık (gün) + son yapılma → durum: gecikmiş / bugün / yakında. Alanlara göre (Mutfak, Banyo,
  Yatak odası, Salon, Genel, Çamaşır). Varsayılan en az 18 iş (çamaşır yıka, as/kurut, katla-yerleştir, ütü,
  bulaşık yıka / makineyi çalıştır, makineyi boşalt, çöp, süpürge, paspas, banyo, tezgâh, buzdolabı, çarşaf, toz,
  bitki sulama…). Ekle/düzenle/sil.
- Çamaşır döngüsü ve bulaşık makinesi akışı: adım adım (Yıka → As/Kurut → Katla → Yerleştir), makine süresi için
  sayaç + bitince bildirim.
- Bir iş yapıldı → son yapılma güncellenir, `completeLinked('chore')`, küçük bonus (`group:'chore'`, günde en çok 6).
- Haftalık temizlik puanı/ilerlemesi, en çok ertelenen işler. Hatırlatıcı (grup `chores`): günlük kontrol saati.
- Not: ev işleri şimdilik yalnız bu cihazda; partnerle paylaşılan iş listesi sonraki sürüm.

### 6.5 Okul / yüksek lisans `/study`
- Dersler: ad, kod, hoca, renk, ders günleri/saatleri, dönem.
- Öğeler (ders altında ya da derssiz): tür = ödev, makale okuma, makale/rapor yazma, sınav, sunum, proje,
  tez bölümü; teslim tarihi (+saat), durum (yapılacak / devam / bitti / teslim edildi), öncelik, tahmini saat,
  alt görev listesi, notlar. Makale okumada: yazarlar, yıl, DOI/link, sayfa x/y, okuma geçişi (1-2-3), özet notu.
- Tez: kilometre taşları (konu, öneri, literatür, yöntem, veri, analiz, yazım, savunma) hedef tarih + ilerleme.
- Pano: yaklaşan teslimler (geri sayım, gecikmiş kırmızı), bu haftanın yükü, okuma listesi ilerlemesi, haftalık
  çalışma süresi (zamanlayıcı etiketleri Ders/Ödev/Makale) ve haftalık çalışma hedefi, "Odaklan" → zamanlayıcı.
- Öğe tamamlanınca bonus (`group:'study'`, günde en çok 5; tür ağırlıklı), alt görev/çalışma kaydında
  `completeLinked('study')`.
- Hatırlatıcılar (grup `study`): teslimden 1 gün önce ve aynı sabah (öğe bazında ayarlanır), haftalık planlama
  (Pazar akşamı).

### 6.6 İş ve kişisel gelişim `/growth`
- Hedefler: başlık, alan (Kariyer, İş, Beceri, Okuma, Sağlık, Finans, Kişisel), neden, hedef tarih, ölçülebilir
  ilerleme (sayısal hedef + birim ya da kilometre taşı listesi), haftalık check-in.
- "Bugünün 3 önemli işi": iş günü için 3 öncelik, tamamlanmayanları ertesi güne taşı.
- Öğrenme listesi: kitap / kurs / sertifika — ilerleme (sayfa/ders), durum.
- Haftalık değerlendirme: iyi giden, engeller, gelecek hafta (Cuma) — geçmiş kayıtlar.
- Bonus `group:'growth'`; 3 önemli işin tamamı ya da hedef adımı → `completeLinked('growth')`.
- Hatırlatıcılar (grup `growth`): sabah 3 önemli iş planlama, Cuma haftalık değerlendirme.
