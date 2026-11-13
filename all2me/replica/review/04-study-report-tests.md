# İnceleme 4 — Okul, gelişim, rapor ve test kalitesi (392e858..fca1271)
Karar: Düzeltmelerle. Kritik: yok. (Doğrulama: npm test, tsc, e2e F16/F17/F19 37/37.)

## Önemli
1. Teslim geri sayımı 00:00–03:00 arasında yanlış ("Yarın 10:00" 9 saat kala; geçmiş teslim "Bugün 23:00") (features/study/calc.ts:28-38) → an düzeyinde hesap + test.
2. Bonus yaşam döngüsü tutarsız: silmede revokeBonus yok (slices/study.ts:184-189, :252; slices/growth.ts:154-159, :199-204); study yeni öğeyi "Bitti" doğunca bonus veriyor (study.ts:115-118) → "bitti oluştur → sil" döngüsü. Dört dilimde tek kural.
3. E2E saate bağlı kararsız: Node saati vs tarayıcı sabit saati (e2e/study.test.mjs:5-8, growth.test.mjs:5-8); phase3.test.mjs:195 UTC gün anahtarı.
4. Totolojik/yutulan assert'ler ve olduğundan fazla kapsama iddiası: study.test.mjs:172 (>=0), onb2.test.mjs:97 (|| true), study.test.mjs:31 ve misc.test.mjs:87 (.catch(()=>{})); F16-H4, F16-E2, F16-E4, F17-H3, F17-H5 adları doğrulanmıyor; test-plan "geçti" diyor.
5. Kritik yol test boşlukları: study dilimi birim testi yok; geri sayım gece penceresi; reminderTimes 09:00 öncesi dalı; report.test.ts:180-182 eşiği sabitlemiyor; report.test.ts:383-389 kaynak grep (change detector).

## Küçük
- study/calc.ts:171-174 teslim ≤01:00 sabah hatırlatıcısı teslim anına denk; sessiz saat ertelemesi hatırlatıcıyı teslimden sonraya itebilir.
- growth: biten öğrenme öğesi geri alınamıyor (slices/growth.ts:94); ekran gün değeri bayat (growth/index.tsx:117..196); azalan hedefte +1 çipi yanlış yön (:293-295); Stepper rol/etiket yok.
- report: arşivleme geçmiş haftaları değiştiriyor (calc.ts:112); devam eden haftada kısmi çalışma süresi tam hedefle kıyaslanıyor (insights.ts:227-229); su paydası bugünü ve takip öncesini sayıyor (calc.ts:298-304); "%80" EN'de sabit (report.tsx:180,248).
- Test altyapısı: F19 kimlik çakışması; eski knownBug işaretleri; ~200 waitForTimeout; çapasız expectGone; .click().catch(fallback); run.mjs zaman aşımı testi iptal etmiyor; store.test.ts gerçek saat; study:milestone vs study:thesis id uyuşmazlığı.
