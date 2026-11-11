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

## Faz 3 — yorum araştırmasından (replica/entrepreneur.md §5), faz 2 ajanları bitince
- [ ] Hatırlatıcı sağlığı ekranı: izin durumu, test bildirimi, sessiz saatler, günlük bildirim üst sınırı (Ayarlar altında).
- [ ] Rutin'de görev sırası: saate göre otomatik + elle sıralama; kaydırarak sil/arşivle + geri al toast'ı.
- [ ] "Önceden işaretle": ileri tarihli görevi puansız işaretleyebilme (unuttum hakkı metnini netleştir).
- [ ] Esnek tekrar: her N gün / hafta / ay + başlangıç (çapa) tarihi (engine isPlannedOn + testler + düzenleyici).
- [ ] Açılış hata sınırı (ErrorBoundary) + kurtarma ekranı (yeniden dene / verileri dışa aktarmadan sıfırla uyarısı).
- [ ] Destek kaynakları (iş ortaklığı yok, genel bilgi) + testlerde "tanı değildir" etiketi kontrolü.
- [ ] Geri bildirim / hata bildir: paylaş menüsüyle tanı metni (sürüm, platform, dil); adres yok (kullanıcıya sorulacak).
- [ ] "Hep ücretsiz" mesajı Ayarlar > Hakkında'da (onboarding'e onb2 ekliyor).
- (Kullanıcı yedekle/geri yükle'yi seçmedi — yapılmayacak. Widget: Expo Go'da yok.)
