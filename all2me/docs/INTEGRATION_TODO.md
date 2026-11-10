# Bütünleştirme yapılacakları (yönetici notu)

- [ ] Tüm dilimlerin `reset()`'lerini tek yerden çağıran `resetAllSlices()` (src/store/resetAll.ts) + Ayarlar'daki
      "Verileri sıfırla" bunu kullansın (onboard ajanı: şu an yalnız AsyncStorage anahtarları + core + settings).
- [ ] Rutin panosuna yaşam takibi kartları: yaklaşan teslim (useStudySummary), sigara bugün x/limit, ev işi gecikmiş.
- [ ] Yeni rozetler: limitte 7 gün (sigara), fast food'suz 7 gün, 20 ev işi, 10 okul öğesi, ilk hedef tamam.
- [ ] `src/features/planner/plan.test.ts` → node:assert tip hatası (tsconfig exclude ya da tests/ altına taşı).
- [ ] Onboarding "Konsantrasyon" etiketi kesiliyordu; 13px düzeltmesi sonrası yeniden görüntü alınmadı.
- [ ] sleep.ts locale `qualityLabel` dizisi Dict'e uymuyor (toolsa ajanı bitince kontrol).
- [ ] Bildirim izni: ilk hatırlatıcı kurulumunda iste; ayarlar kapalıyken tüm gruplar iptal.
- [ ] Uygulama ikonu / splash özgün değil (Expo varsayılanı).
- [ ] `npm test` betiğine yeni testleri ekle (life, study, planner).
- [ ] Tüm ekranların TR/EN + koyu tema tam tur görüntüsü, referansla karşılaştırma.
- [ ] Expo Go SDK uyumu notu (README).
- [ ] Rutin (`app/(tabs)/index.tsx`): bağlı göreve dokununca `router.push(routes.linkTarget(h.link))` (yeni: smoke/meal/chore/study/growth).
- [ ] Görev düzenleyici (`app/task/[id].tsx`): `difficulty` URL parametresini oku; new-task önerileri zorluğu `routes.createTask({difficulty})` ile geçsin.
- [ ] Rutin selamı TR'de iki satır düzeltmesi sonrası yeniden görüntü.
- [x] task.link.* yeni bağlantı adları (yönetici ekledi), shots.mjs sorgu parametreli rota düzeltmesi, routes.linkTarget.
- [ ] reflection.tsx: elle kurulan '/tools/reflection-write?entryId=' yerine routes.reflectionWrite(undefined, id) kullan; EN /tools başlık düzeltmesi sonrası yeniden görüntü.
- [ ] Zamanlayıcı rotasına `tag` parametresi (routes.timer({tag})) — okul/gelişim Odaklan bunu kullansın; şu an setTag ile.
