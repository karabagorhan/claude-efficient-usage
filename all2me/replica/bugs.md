# Hata listesi: All2Me

Build: çalışma ağacı (commit'siz, `expo export --platform web`)  Tarih: 2026-11-11  Tarayıcı: Playwright Chromium, 390x844, tohum veri
Yöntem: replica-test. Her hata bir e2e testiyle yeniden üretildi (`node e2e/run.mjs <test kimliği>`); yalnız yeniden üretilenler listelendi.
Önem: S1 veri kaybı / güvenlik / çekirdek akış kilitli, S2 özellik bozuk (geçici çözüm yok), S3 geçici çözümle bozuk ya da görünür biçimde yanlış, S4 kozmetik.
S1 açık hata yok (düzeltme turu sonrası: 10 hatanın 10'u kapalı). Dosya:satır tahminleri okuma ile çıkarıldı (düzeltme yapan ajan doğrulamalı). Evidence yolları `all2me/shots/rtest/` altında.
Bu dosya ilk tespit tarihli; her hatanın altındaki `Status` satırı düzeltme turundaki (2026-11-11) son durumdur.

Özet: S2 x1, S3 x6, S4 x3.

---

### BUG-001: Azalan hedef (kilo 90 → 80) kaydedilince anında "tamamlandı" sayılıp +30 puan veriliyor

- Severity: S2
- Flow / case: F17 / F17-E3
- Screen: /growth/goal/new
- Build: çalışma ağacı  Browser / device: Chromium 390px

Steps
1. /growth/goal/new aç, başlığa "Kilo ver" yaz.
2. Sayısal ölçü: Başlangıç 90, Hedef 80 yaz (Şu anki değer varsayılan 0 kalır).
3. Kaydet (✓).

Expected: İlerleme %0 görünür (şu anki değer başlangıçla aynı, 90); hedef açık kalır, bonus yok.
Actual: Formda "İlerleme %100" görünür; kaydedince hedef `doneDay` alır ve `growth:goal:<id>` bonusu +30 puan verilir (`logActivity('goalDone')` de çalışır). Her yeni azalan hedef bir kez +30 kazandırır (puan avcılığı); hedef listesinde de tamamlanmış görünür.
Evidence: shots/rtest/growth-decreasing-goal.png, shots/rtest/FAIL-F17-E3.png, test F17-E3
Suspected cause: `app/growth/goal/[id].tsx:54` yeni hedefte `current: 0` ile başlıyor (başlangıç değerine eşitlenmiyor); `src/features/growth/calc.ts:6-13` `goalProgress` (0-90)/(80-90)=9 → 1'e kıstırıyor; `src/store/slices/growth.ts:74` `commitGoal` yeni kayıtta `isGoalComplete` doğru çıkınca bonus veriyor. Çözüm: `current`'ı kaydederken `startValue`'ya eşitle (ya da `current === undefined` iken ilerleme 0 say) ve ilk kayıtta ilerleme sıfırken tamamlandı sayma.
Status: Düzeltildi (2026-11-11). `app/growth/goal/[id].tsx`: yeni hedefte `current` başlangıç değerine eşitlenir; `src/store/slices/growth.ts` `commitGoal`: yeni kayıt tamamlanmış doğsa da bonus/`goalDone` yok. Test: F17-E3 (e2e), `tests/store.test.ts` (azalan hedef, BUG-001).

---

### BUG-002: Kaynak kaydı geri alınınca / silinince bağlı görev tamamlanmış ve puanlı kalıyor (su "Geri al", ev yemeği kaydını sil)

- Severity: S3
- Flow / case: F08 / F08-E2, F14 / F14-E1
- Screen: /tools/drink, /life/meals
- Build: çalışma ağacı  Browser / device: Chromium 390px

Steps (su)
1. Ana ekranda "Su iç" (bağlı, sayaç hedef 8) görevi olsun; /tools/drink aç.
2. "Bardak"a 10 kez dokun (10 x 200 ml = 2000 ml hedef) → "Günlük hedefe ulaştın", Su iç görevi tamamlanır, puan yazılır.
3. "Geri al"a dokun (son bardak silinir, 1800 ml kalır).

Steps (yemek)
1. Bağlı "Ev yemeği ye" görevi varken /life/meals → "Ev yemeği" kaydı ekle (görev tamamlanır).
2. Bugünün kayıtlarında çöp kutusu (Sil) ile kaydı sil.

Expected: Hedefin altına inen su ve silinen ev yemeği kaydı için bağlı görev geri alınır (puanı düşer) ya da en azından ilerleme hedefle tutarlı olur.
Actual: Su 1800/2000 ml gösterir ama "Su iç" görevi tamamlı ve puanı yerinde; ev yemeği kaydı silinse de görev tamamlı + puan duruyor. Kullanıcı yanlışlıkla ekleyip geri alarak puan kazanmış/tutmuş olur.
Evidence: shots/rtest/FAIL-F08-E2.png, shots/rtest/FAIL-F14-E1.png, testler F08-E2, F14-E1
Suspected cause: `app/tools/drink.tsx:71-78` `undo()` yalnızca `setLinkedProgress('drink', 0)` ve yeniden eşitleme yapıyor, `core.undo(habitId)` çağrılmıyor; `src/store/core.ts:457` `setLinkedProgress` tamamlamayı hiç kaldırmaz. `app/life/meals.tsx:193` silme yalnızca `useMeals.remove`. (Chores/smoke "yapıldı" işaretlerinin geri alınması da aynı aileden; aynı kalıp kontrol edilmeli.)
Status: Düzeltildi. Çekirdeğe `undoLinked(link, dayKey?)` eklendi (`src/store/core.ts`, CONTRACTS §çekirdek tablosu); su "Geri al" hedefin altına inince (`app/tools/drink.tsx`) ve son ev yemeği kaydı silinince (`mealRemove`, `src/features/life/actions.ts`) bağlı görev + puan geri alınır. Test: F08-E2, F14-E1 (e2e), `tests/store.test.ts` (undoLinked). Chores/smoke "yapıldı" işaretleri kayıt silme değil, tek yönlü (geri alma yok); aynı aile sorunu bulunmadı.

---

### BUG-003: Görev kartına çift dokunma (double tap / double click) tamamlamayı geri alıyor

- Severity: S3
- Flow / case: F02 / F02-E1
- Screen: Rutin (/)
- Build: çalışma ağacı  Browser / device: Chromium 390px (çift tıklama); dokunmatikte aynı mantık

Steps
1. Ana ekranda tamamlanmamış "Kahvaltı yap" kartına hızlı çift dokun.

Expected: Görev tamamlanır ve tamamlı kalır (ikinci dokunuş yoksayılır / debounce); puan bir kez yazılır.
Actual: İlk dokunuş tamamlar, ikinci dokunuş aynı anda "geri al" (`undo`) yapar; görev tamamlanmamış kalır, "Geri alındı" toast'u çıkar, kutlama oynar. Yani çift dokunan kullanıcı puan alamaz (ve onay kutusunda aynı).
Evidence: shots/rtest/FAIL-F02-E1.png, test F02-E1
Suspected cause: `app/(tabs)/index.tsx:122-150` `onPress`/`onToggle`: tamamlanmış kartta bugün için doğrudan `undoNow` çağırıyor (onay sorusu ya da kısa kilit yok). Öneri: tamamlamadan sonra ~600 ms dokunuşu yoksay ya da geri almayı uzun basış / onay arkasına al.
Status: Düzeltildi. `app/(tabs)/index.tsx`: tamamlamadan sonra 600 ms (`UNDO_LOCK_MS`) geri alma yok sayılır. Test: F02-E1 (e2e; çift tıklama → tamamlı + tek puan; 600 ms sonra dokunuş yine geri alır: F02-E10).

---

### BUG-004: Aynı ev işi aynı gün iki kez "yaptım" işaretlenince yinelenen kayıt oluşuyor (haftalık puan şişiyor)

- Severity: S4
- Flow / case: F15 / F15-E1
- Screen: /life/chores
- Build: çalışma ağacı  Browser / device: Chromium 390px

Steps
1. /life/chores aç, "Bulaşıkları yıka" kartındaki ✓ (Tamamlandı) düğmesine dokun.
2. Aynı kartın ✓ düğmesine tekrar dokun (kart "Yakında/Daha sonra" grubuna geçse de düğme duruyor).

Expected: Aynı gün aynı iş için tek kayıt; ikinci dokunuş yok sayılır (bonus zaten tek veriliyor).
Actual: `history`'ye ikinci `ChoreLog` ve `doneCount+1` yazılıyor; "Bu hafta N iş yapıldı" ve haftalık yüzde şişiyor (bonus tek kalıyor, rozet sayacı etkilenmiyor).
Evidence: shots/rtest/FAIL-F15-E1.png, test F15-E1
Suspected cause: `src/store/slices/chores.ts:67-76` `done()` aynı gün için kontrol yapmadan her zaman log üretiyor; `src/features/life/actions.ts:77-100` `choreDone` dönüş değerine güveniyor.
Status: Düzeltildi. `src/store/slices/chores.ts` `done()`: aynı gün aynı iş için ikinci kayıt `null` döner (sayaç/log artmaz). Test: F15-E1.

---

### BUG-005: Yansıma silme tek dokunuşta, onaysız ve geri alınamaz

- Severity: S3
- Flow / case: F10 / F10-E1
- Screen: /tools/reflection-write (kayıt düzenleme)
- Build: çalışma ağacı  Browser / device: Chromium 390px

Steps
1. /tools/reflection → bir konuyla yansıma yaz, kaydet.
2. Geçmiş sekmesi → kayda dokun (düzenleme açılır).
3. Sağ üstteki çöp kutusu simgesine dokun.

Expected: Silmeden önce onay (görev, ders, hedef, işler için "Evet, sil" onayı var).
Actual: Kayıt anında silinir, "silindi" toast'u çıkar, geri alma yok; yanlış dokunuşta yazılmış metin kaybolur (kullanıcı verisi kaybı).
Evidence: shots/rtest/FAIL-F10-E1.png, test F10-E1
Suspected cause: `app/tools/reflection-write.tsx:44-49` `del()` doğrudan `remove` çağırıyor; düğme etiketi `reflection.confirmDelete` = "Bu yansımayı sil" (onay sorusu yok). Diğer ekranlardaki `ConfirmDelete` kalıbı kullanılmalı.
Status: Düzeltildi. `app/tools/reflection-write.tsx`: çöp kutusu onay kutusu açar ("Bu yansıma silinsin mi?" / "Evet, sil"). Test: F10-E1 (onay adımı + onaydan sonra silme), F10-H1.

---

### BUG-006: Alarm listesinde aç/kapa anahtarına dokunmak düzenleme ekranını da açıyor (web önizleme)

- Severity: S3
- Flow / case: F12 / F12-E2
- Screen: /tools/alarm
- Build: çalışma ağacı  Browser / device: Chromium 390px (react-native-web). Gerçek cihazda doğrulanamadı.

Steps
1. /tools/alarm → "Alarm ekle" → Kaydet (alarm listede).
2. Kartın sağındaki anahtarı (Switch) aç/kapa.

Expected: Yalnız alarm açılıp kapanır.
Actual: Anahtar değişir, ama dokunuş kartın `onPress`'ine de sızıp "Alarmı düzenle" ekranını açar (kullanıcı listeden toggle edemez, her seferinde editörden çıkması gerekir).
Evidence: shots/rtest/FAIL-F12-E2.png, test F12-E2
Suspected cause: `app/tools/alarm.tsx:184` `Card onPress` içinde `app/tools/alarm.tsx:195` `Switch` var; web'de tıklama kabarcıklanıyor. Anahtarı `Pressable` dışına alın ya da `onClick` olayında `stopPropagation` / ayrı dokunma alanı kullanın.
Status: Düzeltildi. `app/tools/alarm.tsx`: düzenleme alanı ayrı `Pressable`, `Switch` kardeş öğe (kart `onPress` yok); anahtara dokunmak editörü açmaz. Test: F12-E2. Gerçek cihazda doğrulanmadı (web).

---

### BUG-007: İki sekmede aynı anda kullanımda son yazan kazanır; diğer sekmedeki tamamlama kayboluyor (web önizleme)

- Severity: S3
- Flow / case: F23 / F23-E5
- Screen: Rutin (/)
- Build: çalışma ağacı  Browser / device: Chromium, iki sekme aynı bağlamda. Mobil uygulamada tek süreç olduğundan geçerli değil; web önizleme ve olası PWA kullanımı için.

Steps
1. Aynı tarayıcıda / yı iki sekmede aç.
2. Sekme A'da "Kahvaltı yap"ı tamamla; sekme B'de (yenilemeden) "Masayı topla"yı tamamla.
3. Sekme A'yı yenile.

Expected: İki tamamlama da görünür (storage olayıyla birleştirme ya da en azından kayıpsız yazım).
Actual: Yalnız B'nin durumu kalır; A'daki "Kahvaltı yap" tamamlaması ve puanı kayboluyor (zustand `persist` her sekmede eski bellek durumunu bütün olarak yazıyor).
Evidence: shots/rtest/FAIL-F23-E5.png, test F23-E5
Suspected cause: `src/store/core.ts:739` `createJSONStorage(() => AsyncStorage)` + web'de `storage` olayı dinlenmiyor. Öneri: `window.addEventListener('storage')` ile `useCore.persist.rehydrate()` ya da web için tek sekme kilidi.
Status: Düzeltildi (web). `src/lib/tabSync.ts` + `app/_layout.tsx`: `storage` olayında ilgili persist store `rehydrate()` edilir; yerel uygulamada etkisiz. Test: F23-E5. Not: bu, sekmeler arası yazımın kayıpsız birleşmesini sağlar; eşzamanlı yazım yarışı (aynı milisaniye) teorik olarak mümkün.

---

### BUG-008: Özel su miktarı alanı negatif sayıyı kabul edip sessizce 1 ml kaydediyor

- Severity: S4
- Flow / case: F08 / F08-E1
- Screen: /tools/drink (Özel)
- Build: çalışma ağacı  Browser / device: Chromium 390px

Steps
1. /tools/drink → "Özel" → miktara -50 yaz → "Ekle" aktif.
2. Ekle'ye dokun.

Expected: Negatif / sıfır / harf değerlerde "Ekle" kapalı kalır (0 ve harf için kapalı).
Actual: -50 için düğme açık; kayıt `Math.max(1, …)` ile 1 ml olarak eklenir (listede "1 ml").
Evidence: shots/rtest/FAIL-F08-E1.png, test F08-E1
Suspected cause: `app/tools/drink.tsx:188` `disabled={!Number(customVal)}` negatifi geçiriyor; `src/store/slices/drink.ts:46` `Math.max(1, …)`. `Number(customVal) <= 0` kontrolü eklenmeli.
Status: Düzeltildi. `app/tools/drink.tsx`: `add()` ve "Ekle" düğmesi `> 0` ister (negatif/0/harf kapalı). Test: F08-E1.

---

### BUG-009: Birçok ikon düğmesi, anahtar ve alanın erişilebilir adı yok (ekran okuyucu)

- Severity: S3
- Flow / case: F24 / F24-A1 (manuel M-11 ile birlikte)
- Screen: Tüm geri/kapat okları, İlham kalp düğmesi, sayaç ± düğmeleri, ayar anahtarları, bazı form alanları
- Build: çalışma ağacı  Browser / device: Chromium DOM taraması (gerçek VoiceOver/TalkBack denenemedi)

Steps
1. /new-task, /task/s1, /inspire/clean-home-basics, /tools/drink, /life/smoke, /settings, /study/item/new, /growth/goal/new sayfalarını sırayla aç.
2. `role=button/checkbox/switch`, `input` öğelerinden erişilebilir adı (aria-label, metin, placeholder) olmayanları tara.

Expected: Her etkileşimli öğenin adı olur ("Geri", "Kapat", "Favorilere ekle", "Artır / Azalt"...).
Actual: Header sol ok/kapat düğmesi adsız (tüm modal ve kart ekranlarında), `FavHeart` adsız (`inspire.detail.favorite` sözlük anahtarı var, kullanılmıyor), `Stepper` +/- düğmeleri (okul/gelişim/ev işi/sigara) rolsüz ve adsız, Ayarlar bildirim anahtarı ve görev düzenleyici anahtarları adsız, sigara kurulumunda fiyat alanı adsız, `Field` etiketi girdiyle ilişkilendirilmemiş (`getByLabel` ile bulunamıyor).
Evidence: test F24-A1 çıktısı (ekran bazlı liste), shots/rtest/FAIL-F24-A1.png
Suspected cause: `src/components/ui.tsx:293` Header `IconButton`'ına `label` verilmiyor; `src/features/inspire/TemplateCard.tsx:16-32` FavHeart; `src/features/study/ui.tsx:83-130` ve `src/features/life/ui.tsx:53` Stepper; `src/components/ui.tsx` `Field` (label ↔ TextInput `accessibilityLabel`/`aria-labelledby`); `Switch` bileşenleri `accessibilityLabel` almıyor.
Status: Düzeltildi. Header `IconButton` etiketi (Geri/Kapat), `FavHeart`, iki `Stepper` (±), tüm `Switch` (`accessibilityLabel`), `Field` (etiket/placeholder → `accessibilityLabel`), `Card`/`PastelCard`/`IconTile`/`Chip` rolleri, başlıklar `role="header"`. Test: F24-A1 (tüm sayfalarda adsız etkileşimli öğe yok). Gerçek VoiceOver/TalkBack denenmedi.

---

### BUG-010: "Yaptım ✓" düğmesi tekrar dokununca işareti sessizce kaldırıyor (100 yol kartları)

- Severity: S4
- Flow / case: F22 / F22-H2
- Screen: /tools/love
- Build: çalışma ağacı  Browser / device: Chromium 390px

Steps
1. /tools/love → "Bugün yaptım ✓"a dokun (sayaç 1/100).
2. Düğme "Yaptım ✓" (çerçeveli) olur; ona dokun.

Expected: Tamamlanmış durumda ayrı bir "İşareti kaldır" eylemi ya da onay (sözlükte `love.undo` = "İşareti kaldır" var ama kullanılmıyor).
Actual: Yaptım göstergesi gibi görünen düğme geri alır (sayaç 0/100); kazara dokunmada ilerleme kaybolur.
Evidence: test F22-H2 (davranış, test geçiyor; belgelendi)
Suspected cause: `app/tools/love.tsx:43,125` etiket `love.doneMark` ama basınca `toggle`.
Status: Düzeltildi. `app/tools/love.tsx`: yapıldı durumu düğme değil metin ("Bugün yapıldı ✓"); geri alma ayrı, görünür "İşareti kaldır" düğmesi (`love.undo`). Test: F22-H2.

---

## Kontrol edilecekler (yeniden üretilmedi / belirsiz)

- Görev kartı ➕ düğmesi (yüzen) ilk ekranda listedeki son kartın onay dairesini örtüyor (kaydırınca düzeliyor, `padBottom={110}` var): `shots/rtest/dark-home.png`. Kozmetik; cihazda kontrol edilmeli.
- Toast kuyruğu: art arda birden çok toast (ör. 6 direnme) sırayla ~2,7 sn gösteriliyor; son uyarı ("bonus doldu") 13 sn sonra geliyor (F13-E5). Davranış tasarımsal olabilir; birleştirme / kuyruğu sınırlama değerlendirilebilir.
- Tez kilometre taşı satırında başlık alanı `onBlur`'da kaydediyor (`app/study/index.tsx` MilestoneRow): yalnız odaklanıp çıkmak varsayılan çevrilmiş başlığı kullanıcı başlığına çeviriyor (dil değişince çevrilmez). Web'de denenmedi.
- `autoCapitalize="characters"` (ders kodu) web'de uygulanmıyor ("yl501" küçük kalıyor); yalnız web; cihazda beklenen davranış doğrulanamadı.

### Kontrol edilecekler: son durum (düzeltme turu)

- Yüzen ➕ düğmesi son kartı örtüyor: kodda `padBottom={110}` mevcut; kaydırınca düzeliyor, kozmetik. Cihazda doğrulanamadı, açık bırakıldı.
- Toast kuyruğu (13 sn): tasarım gereği bırakıldı, değiştirilmedi.
- Tez kilometre taşı `onBlur`: kodda zaten korumalı (`title !== milestoneTitle(m, lang)` değilse kaydetmez); yalnız odak-çıkış çevrilmiş başlığı bozmaz. Sorun yok.
- `autoCapitalize="characters"` web'de uygulanmıyor: yalnız react-native-web sınırı; cihazda doğrulanamadı, açık.
