# Ekran ajanları için ortak talimat

Çalışma dizini: `/home/user/claude-efficient-usage/all2me`. Aynı anda 7 ajan bu dizinde çalışıyor.

## Önce oku
1. `docs/SPEC.md` — ürün şartnamesi (özellikle kendi ekranlarının bölümü ve §1 kısıtlar).
2. `docs/CONTRACTS.md` — ortak bileşenler, tema, i18n, store API'si, rotalar. **Tamamını oku.**
3. Referans ekran görüntüleri (yalnız düzen/his için; kopyalanmaz, repoya eklenmez):
   `/tmp/claude-0/-home-user-claude-efficient-usage/7a2449c7-1273-59e8-91d5-98898ce8212b/scratchpad/shots/sNN.jpeg`
   Görevinde belirtilenleri Read ile aç.
4. Gerekirse ortak kodu oku (`src/components/ui.tsx`, `src/store/core.ts`, `src/lib/routes.ts`) ama **değiştirme**.

## Kurallar
- Yalnız sana atanan dosyalara yaz: kendi rota dosyaların, kendi `src/i18n/locales/<ns>.ts` ad alanların, kendi
  `src/store/slices/<ad>.ts` dilimlerin, `src/data/<senin>*.ts`, `src/features/<senin>/**`.
- Ortak dosyaları, `package.json`'ı, başka ajanın dosyalarını değiştirme. `npm install` / `expo install` yok.
  Eksik paket/ortak API gerekiyorsa çalış-etrafından ve raporda belirt.
- `git add / commit / push` yok.
- Ekranda sabit metin yok: her şey `t('ns.key')` ya da `L(loc, lang)`. TR ve EN anahtarları birebir aynı olmalı.
  Türkçe metinler doğal ve doğru Türkçe karakterlerle; İngilizce doğal.
- Kalite çıtası: referanstaki gibi ferah, pastel, büyük kalın başlıklar, siyah hap butonlar. Renkleri temadan al.
  Koyu temada da okunur olmalı. 390px genişlikte taşma olmamalı.
- zustand v5 tuzağı: seçicide her çağrıda yeni dizi/nesne üretme (sonsuz render). İlkel seç, `useShallow` ya da `useMemo`.
- "Me+" adı/maskotu/metni, sahte istatistik, tanı koyan test, kilit/paywall, "yapay zekâ" iddiası yok.
- Sağlıkla ilgili içerikte `t('common.medicalNote')` notunu göster.

## Doğrulama (zorunlu)
1. `npx tsc --noEmit` — **kendi dosyalarındaki** hata 0 olmalı. Başka ajanın yarım dosyasından gelen hatayı düzeltme,
   yalnız raporla.
2. Görsel kontrol: kendi çıktı klasörüne web export al ve ekranlarının görüntüsünü çek:
   ```
   npx expo export --platform web --output-dir dist-<AJAN>
   node scripts/shots.mjs --dist dist-<AJAN> --out shots/<AJAN> --seed --lang tr "ad=/rota" ...
   node scripts/shots.mjs --dist dist-<AJAN> --out shots/<AJAN>-en --seed --lang en "ad=/rota" ...
   ```
   Görüntüleri Read ile aç ve gerçekten bak: taşma, eksik çeviri (`ns.key` görünüyorsa eksik), boş ekran, hizalama.
   Gördüğün sorunları düzelt ve yeniden çek. Export başka ajanın yarım dosyası yüzünden kırılırsa 1-2 dakika sonra
   bir kez daha dene; yine kırılırsa raporla. İş bitince `dist-<AJAN>` klasörünü sil (shots kalsın).
   Etkileşim gereken durumlar (ör. dolu liste) için geçici bir Playwright betiğini scratchpad'e yazıp kullanabilirsin:
   `/tmp/claude-0/-home-user-claude-efficient-usage/7a2449c7-1273-59e8-91d5-98898ce8212b/scratchpad/<AJAN>/`
3. `npm test` hâlâ geçmeli (ortak koda dokunmadığın için geçer; çalıştır ve doğrula).

## Rapor (son mesaj)
- Yazdığın dosyalar.
- Doğrulama: komutların gerçek sonucu, hangi görüntülere baktın, ne gördün.
- Doğrulanmayan / eksik kalan / varsayım yaptığın yerler. Cihazda denemediğin şeyi "çalışıyor" diye yazma.
- Ortak koddan istediğin değişiklikler (varsa).
