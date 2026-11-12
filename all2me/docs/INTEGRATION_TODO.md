# Bütünleştirme yapılacakları (yönetici notu)

- [x] Tüm dilimlerin `reset()`'lerini tek yerden çağıran `resetAllSlices()` / `resetAllData()` (src/store/resetAll.ts):
      19 dilim + core.resetAll + resetSettings + `all2me-` AsyncStorage anahtarları + tüm bildirim grupları.
      Ayarlar'daki "Verileri sıfırla" bunu kullanıyor (web'de sayfa yenileme kaldırıldı).
- [x] Rutin panosuna yaşam takibi özet şeridi (`src/features/routine/LifeStrip.tsx`): yaklaşan/gecikmiş teslim
      (useStudySummary), sigara bugün x/limit (plan varsa), gecikmiş ev işi (ev işi geçmişi varsa); dokununca ilgili ekran.
- [x] Yeni rozetler: `smoke7` (limitte 7 gün), `nofast7` (fast food'suz 7 gün), `chores20`, `study10`, `goal1`.
      Değerlendirme çekirdekte: `activity` (`smokeOk`, `fastFood`, `meal`, `choreDone`, `goalDone`) + bonus olayları
      (`refId` `study:item:*`, `growth:goal:*`). Testler `tests/store.test.ts`.
- [x] `src/features/planner/plan.test.ts` → tsconfig `**/*.test.ts` hariç tutuyor; `npm test` içinde çalışıyor.
- [x] Onboarding "Konsantrasyon" etiketi: yeniden görüntü alındı, kesilme yok.
- [x] sleep.ts locale `qualityLabel` (sayısal anahtarlı nesne) Dict ile uyumlu; tsc 0 hata, i18n taraması temiz.
- [x] Bildirim izni: ilk hatırlatıcı kurulurken isteniyor (boş grupta izin istenmez). Ayarlar'da bildirimler
      kapatılınca `cancelGroups(NOTIF_GROUPS)` tüm grupları iptal ediyor; açılınca / dil değişince
      `resyncAllReminders()` (src/lib/reminders.ts) kullanılan takipçileri yeniden kuruyor.
- [x] Uygulama ikonu / splash: özgün Puf maskotu, `scripts/gen-icons.mjs` ile üretiliyor (koyu splash dahil).
- [x] `npm test` betiği: engine, store, life, study, planner.
- [x] Tüm ekranların TR + ana ekranların EN ve koyu tema tam tur görüntüsü (scratchpad `shots/final`).
- [x] Expo Go SDK uyumu notu (README).
- [x] Rutin: bağlı göreve dokununca `router.push(routes.linkTarget(h.link))` (tüm bağlantı türleri).
- [x] Görev düzenleyici `difficulty` URL parametresini okuyor; Yeni Görev önerileri zorluğu geçiriyor.
- [x] Rutin selamı TR iki satır: yeniden görüntü alındı.
- [x] task.link.* yeni bağlantı adları (yönetici ekledi), shots.mjs sorgu parametreli rota düzeltmesi, routes.linkTarget.
- [x] reflection.tsx `routes.reflectionWrite(undefined, id)` kullanıyor; EN /tools başlığı yeniden görüntülendi.
- [x] Zamanlayıcı rotasına `tag` parametresi (`routes.timer({tag})`); okul/gelişim "Odaklan" bunu kullanıyor.

## Bilinçli olarak açık kalanlar
- Gerçek cihazda bildirim / ses / alarm / haptik denemesi yapılmadı; Supabase senkronu uçtan uca denenmedi.
- Ev işleri partnerle paylaşılmıyor (sonraki sürüm).

## Faz 3 — yorum araştırmasından (replica/entrepreneur.md §5) — 2026-11-12
- [x] Hatırlatıcı sağlığı ekranı (`app/settings-reminders.tsx`, Ayarlar > Hatırlatıcılar): izin durumu + İzin ver / Ayarları aç,
      Android tam zamanlı alarm izni (alarm ekranının `exactAlarmStatus` kontrolü), 5 sn test bildirimi ('test' grubu),
      gruplara göre planlı sayılar, sessiz saatler ve günlük üst sınır (`src/lib/notifBudget.ts`, `scheduleGroup`/`scheduleOne`
      içinde; alarm/zamanlayıcı/test muaf), son kurulumun etkisi. Planlama işlemleri sıraya alındı (yarış koşulu yok).
- [x] Rutin'de görev sırası: Ayarlar > Görev sırası (saate göre / elle), uzun bas menüsü (Düzenle · Yukarı · Aşağı · En üste · Sil),
      `habit.order` (senkronlanır; yeni görev en sona), `moveHabit`, `sortHabits`; kaydırarak sil (`SwipeRow`, PanResponder) +
      "Geri al" toast'ı (`Toast.action`, `unarchiveHabit`).
- [x] "Önceden işaretle": ileri tarihli gün → `complete(id, day, {advance:true})`, puan 0, olay yok; seri/liderlik/rozet/mükemmel gün
      hesabına girmez (görev serisinde nötr; testler `tests/engine.test.ts`, `tests/store.test.ts`). Unuttum hakkı metni netleşti.
- [x] Esnek tekrar: `Schedule.every {unit, n, anchor}`; `isPlannedOn`, seri, rozet, rapor, rutin, hatırlatıcı (sonraki 8 oluşum),
      takvim (interval/monthly); düzenleyicide "Her N gün / hafta / ay" + başlangıç günü + önizleme. Ay sonu ve 03:00 testleri.
- [x] Açılış hata sınırı (`src/components/ErrorBoundary.tsx`) + kurtarma ekranı (yeniden dene / ayrıntıyı paylaş / onaylı sıfırla);
      kalıcı durumda bozuk JSON ya da tür uyuşmazlığı dilimi çökertmez (`src/store/safeStorage.ts`, tüm dilimler).
- [x] Destek kaynakları: Ayarlar > "Zor bir gün mü?" (numara yok, acil durum notu, iş ortaklığı yok). "Tanı değildir" notu
      İlham testleri (`inspire.quiz.notDiagnosis`), onboarding sonucu ve rutin tipi testinde zaten vardı (e2e kapsıyor).
- [x] Geri bildirim / hata bildir: Ayarlar'da not + Paylaş (`src/lib/diagnostics.ts`: sürüm, `Updates.updateId`, platform, dil,
      tarih); web'de Web Share yoksa panoya kopyalar. E-posta adresi yok.
- [x] "Hep ücretsiz" mesajı Ayarlar > Hakkında'da (+ "veriler cihazda, hesap gerekmez").
- (Kullanıcı yedekle/geri yükle'yi seçmedi — yapılmayacak. Widget: Expo Go'da yok.)
- [x] E2E kararsızlığı: F07-E1 nedeni test deseniydi (`/AI/i` rastgele plandaki "email", "stairs", "Air" kelimelerine uyuyordu;
      plan tohumu Date'e bağlı) → `\bAI\b` + iki planı da denetler. F23-E4: expo-router web'de URL'yi ekran çizildikten sonra yazıyor;
      yük altında geri tuşu URL yazılmadan basılınca bir önceki girdiye dönülüyordu → her adımda `waitForURL`. F02-E16 faz 2 sonrası
      kararlı (baseline'da geçti).
- [x] Görev düzenleyicide başlık alanı (`TextInput`, `minWidth` yok) web'de sayfayı 31 px yatay kaydırıyordu → `minWidth: 0`.

## Bilinçli olarak açık kalanlar (faz 3 sonrası)
- Gerçek cihazda (iOS/Android) bildirim, test bildirimi, sessiz saat/üst sınır, alarm, takvim, paylaşım menüsü, kaydırma jesti,
  ses ve haptik denenmedi. Supabase senkronu uçtan uca denenmedi (`habit.order` ve `completion.advance` alanları belge verisinin
  parçası olarak gider; sunucu şeması değişmedi).
- Üst sınır nedeniyle kırpılan düşük öncelikli hatırlatıcılar yer açılınca kendiliğinden geri gelmez ("Yeniden kur" gerekir).
