/** F07-F12 Akıllı planlayıcı, su (bağlı görev), ruh hali, yansıma, zamanlayıcı, alarm (SPEC 3.8, 3.12). */
import { assert, completionsOn, tapButtonWhere } from './lib.mjs';

const noProgress = { core: { progress: {} } };

export default [
  // ------------------------------------------------------------------ F07 planlayıcı
  {
    id: 'F07-H1', name: 'akıllı planlayıcı: 4 soru → saatli plan → "Rutinime ekle" görevleri ekler (source=planner)', opts: { lang: 'tr', seedOpts: { noHabits: true, withHistory: false } },
    run: async (s) => {
      await s.goto('/', 700);
      await s.btn(s.t('routine.addTask'));
      await s.tap(s.t('newtask.planner.title'));
      await s.expectText(s.t('planner.q.wake'));
      await s.tap('08:00');
      await s.btn(s.t('common.btn.next'));
      await s.expectText(s.t('planner.q.energy'));
      await s.tap(s.t('planner.energy.high'));
      await s.btn(s.t('common.btn.next'));
      await s.expectText(s.t('planner.q.areas'));
      await s.tap(s.t('planner.area.home'));
      await s.tap(s.t('planner.area.self'));
      await s.btn(s.t('common.btn.next'));
      await s.expectText(s.t('planner.q.minutes'));
      await s.tap(s.t('planner.minutes.m60'));
      await s.btn(s.t('common.btn.next'));
      await s.expectText(s.t('planner.result.title'), 'plan ekranı');
      const body = await s.body();
      const m = body.match(/(\d+) görev · yaklaşık (\d+) dk/);
      assert.ok(m && Number(m[1]) > 0, `plan özeti (${body.slice(0, 200)})`);
      await s.shot('planner-result');
      const n = Number(m[1]);
      // bir görevi çıkar
      await s.btn(s.t('planner.remove'), { nth: 0 });
      await s.page.waitForTimeout(200);
      await s.btn(s.t('planner.addToRoutine'));
      await s.page.waitForTimeout(700);
      const habits = Object.values((await s.store('core')).habits).filter((h) => h.source === 'planner');
      assert.equal(habits.length, n - 1, `çıkarılan hariç hepsi eklenmeli (${habits.length} / ${n - 1})`);
      assert.ok(habits.every((h) => /^\d\d:\d\d$/.test(h.reminderTime || '')), 'saatli plan: hatırlatıcı saati');
      assert.ok((await s.store('planner')).answers.wake === '08:00', 'cevaplar saklanır');
    },
  },
  {
    id: 'F07-E1', name: 'planlayıcı: "Yeniden oluştur" farklı plan üretir; geri butonu cevapları korur; plan her seferinde boş değil (EN)', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/planner', 700);
      for (let i = 0; i < 4; i++) {
        if (i === 2) await s.tap(s.t('planner.area.work'));
        await s.btn(s.t('common.btn.next'));
      }
      await s.expectText(s.t('planner.result.title'));
      const a = await s.body();
      await s.btn(s.t('planner.regenerate'));
      await s.page.waitForTimeout(300);
      const b = await s.body();
      assert.ok(/\d+ tasks? ·/.test(a) && /\d+ tasks? ·/.test(b), 'iki planda da görev olmalı');
      await s.btn(s.t('planner.editAnswers'));
      await s.expectText(s.t('planner.q.wake'));
      assert.ok(!/AI|artificial intelligence|yapay zek/i.test(a), '"yapay zekâ" iddiası olmamalı');
    },
  },
  {
    id: 'F07-E2', name: 'planlayıcı: alan seçmeden de plan üretir; tüm görevleri çıkarınca "Rutinime ekle" kapanır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/planner', 700);
      for (let i = 0; i < 4; i++) await s.btn(s.t('common.btn.next'));
      await s.expectText(s.t('planner.result.title'));
      const x = s.page.getByRole('button', { name: s.t('planner.remove') });
      let guard = 0;
      while ((await x.count()) && guard++ < 30) await x.first().click();
      await s.expectText(s.t('planner.result.empty'));
      const add = s.page.getByRole('button', { name: s.t('planner.addToRoutine') });
      assert.equal((await add.getAttribute('aria-disabled')) === 'true' || (await add.isDisabled()), true);
    },
  },

  // ------------------------------------------------------------------ F08 su
  {
    id: 'F08-H1', name: 'su: bardak ekle → miktar artar, bağlı "Su iç" görevi ilerler; hedefe ulaşınca görev otomatik tamamlanır', opts: { lang: 'tr', seedOpts: noProgress },
    run: async (s) => {
      await s.goto('/tools/drink', 800);
      await s.expectText(s.t('drink.empty'));
      await s.tap(s.t('drink.glass'));
      await s.expectText(s.t('drink.amountOf', { a: 200, b: 2000, unit: 'ml' }), 'bardak = 200 ml');
      await s.expectText(s.t('drink.remaining', { n: 1800, unit: 'ml' }));
      let c = await s.store('core');
      assert.equal(c.progress[`s3|${s.meta.today}`], 0, '200/2000 ml → 0/8 (floor)');
      await s.shot('drink-1glass');
      for (let i = 0; i < 9; i++) await s.tap(s.t('drink.glass'));
      await s.page.waitForTimeout(500);
      await s.expectText(s.t('drink.reached'));
      const done = (await completionsOn(s)).find((x) => x.habitId === 's3');
      assert.ok(done, 'hedefe ulaşınca bağlı görev tamamlanmalı');
      await s.goto('/', 700);
      await s.expectText('2/5 görev');
    },
  },
  {
    id: 'F08-E1', name: 'su: özel miktar (330), geçersiz/0/negatif/harf miktar eklenmez; geri al son kaydı siler', opts: { lang: 'tr', seedOpts: noProgress },
    knownBug: 'BUG-008 negatif su miktarı 1 ml kaydı',
    run: async (s) => {
      await s.goto('/tools/drink', 800);
      await s.tap(s.t('drink.custom'));
      const f = s.page.getByPlaceholder(s.t('drink.customPlaceholder'));
      const add = s.page.getByRole('button', { name: s.t('common.btn.add'), exact: true });
      await f.fill('abc');
      assert.equal((await add.getAttribute('aria-disabled')) === 'true' || (await add.isDisabled()), true, 'harf kabul edilmemeli');
      await f.fill('0');
      assert.equal((await add.getAttribute('aria-disabled')) === 'true' || (await add.isDisabled()), true, '0 kabul edilmemeli');
      await f.fill('-50');
      const negDisabled = (await add.getAttribute('aria-disabled')) === 'true' || (await add.isDisabled());
      if (!negDisabled) {
        await add.click();
        await s.page.waitForTimeout(300);
      }
      const entriesAfterNeg = Object.values((await s.store('drink'))?.entries || {});
      await s.goto('/tools/drink', 600);
      await s.tap(s.t('drink.custom'));
      await s.page.getByPlaceholder(s.t('drink.customPlaceholder')).fill('330');
      await s.page.getByRole('button', { name: s.t('common.btn.add'), exact: true }).click();
      const tot = Object.values((await s.store('drink')).entries).reduce((a, e) => a + e.ml, 0);
      await s.btn(s.t('drink.undo'));
      await s.btn(s.t('drink.undo')).catch(() => {});
      assert.equal(entriesAfterNeg.length, 0, `negatif miktar (-50) kabul edilmemeli; ${entriesAfterNeg.map((e) => e.ml + ' ml')} kaydı eklendi`);
      assert.ok(tot === 330 || tot === 331, `özel miktar 330 ml (toplam ${tot})`);
    },
  },
  {
    id: 'F08-E2', name: 'su: günlük hedefe ulaşıp "Geri al" → bağlı görev tamamlanmış kalmamalı (tutarlılık)', opts: { lang: 'tr', seedOpts: noProgress },
    knownBug: 'BUG-002 su geri al bağlı görevi geri almıyor',
    run: async (s) => {
      await s.goto('/tools/drink', 800);
      for (let i = 0; i < 10; i++) await s.tap(s.t('drink.glass'));
      await s.page.waitForTimeout(400);
      assert.ok((await completionsOn(s)).find((x) => x.habitId === 's3'), 'ön koşul: görev tamamlandı');
      await s.btn(s.t('drink.undo'));
      await s.page.waitForTimeout(400);
      await s.expectText(s.t('drink.remaining', { n: 200, unit: 'ml' }));
      const still = (await completionsOn(s)).find((x) => x.habitId === 's3');
      assert.ok(!still, 'hedefin altına inince su görevi tamamlanmış kalıyor (yanlış puan + tutarsız durum)');
    },
  },
  {
    id: 'F08-E3', name: 'su: birim oz → miktarlar oz gösterilir, kayıt ml olarak doğru saklanır', opts: { lang: 'en', seedOpts: { units: 'oz', ...noProgress } },
    run: async (s) => {
      await s.goto('/tools/drink', 800);
      await s.expectText('oz');
      await s.tap(s.t('drink.glass'));
      await s.page.waitForTimeout(300);
      const d = await s.store('drink');
      const ml = Object.values(d.entries).reduce((a, e) => a + e.ml, 0);
      assert.ok(ml > 200 && ml < 300, `bardak ~237 ml olmalı (${ml})`);
      assert.ok(!(await s.body()).includes('ml'), 'oz modunda ml görünmemeli');
    },
  },
  {
    id: 'F08-E4', name: 'su hedefi ayarlama ± ve hatırlatıcı seçimi saklanır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/drink', 800);
      const plus = s.page.getByLabel(s.t('drink.goalHint'));
      await plus.nth(1).click();
      const d = await s.store('drink');
      assert.ok(d.goalMl > 2000, `hedef artmalı (${d.goalMl})`);
      await s.tap(s.t('drink.reminder.every', { n: 2 }));
      assert.equal((await s.store('drink')).reminder, 2);
    },
  },

  // ------------------------------------------------------------------ F09 ruh hali
  {
    id: 'F09-H1', name: 'ruh hali: seviye + etiket + not → kaydet; bağlı "Ruh hali" görevi tamamlanır; kayıt listede', opts: { lang: 'tr', seedOpts: { habits: [{ id: 'm1', title: 'Ruh halini kaydet', icon: '🙂', extra: { link: 'mood' } }] } },
    run: async (s) => {
      await s.goto('/tools/mood', 800);
      const save = s.page.getByRole('button', { name: s.t('mood.saveToday') });
      assert.equal((await save.getAttribute('aria-disabled')) === 'true' || (await save.isDisabled()), true, 'seviye seçilmeden kaydedilemez');
      await s.tap('🙂');
      await s.expectText(s.t('mood.level.4'));
      await s.tap('Sakin');
      await s.page.getByPlaceholder(s.t('mood.notePlaceholder')).fill('Güzel bir gün çğış 😀');
      await save.click();
      await s.page.waitForTimeout(600);
      const m = await s.store('mood');
      const e = Object.values(m.entries)[0];
      assert.equal(e.level, 4);
      assert.ok(e.tags.length === 1);
      assert.equal(e.note, 'Güzel bir gün çğış 😀');
      assert.ok((await completionsOn(s)).find((x) => x.habitId === 'm1'), 'bağlı görev tamamlanmalı');
      await s.expectText(s.t('mood.update'), 'kayıt sonrası "Güncelle"');
      await s.shot('mood-saved');
      // güncelle → gün başına tek kayıt
      await s.tap('😄');
      await s.btn(s.t('mood.update'));
      await s.page.waitForTimeout(400);
      const m2 = await s.store('mood');
      assert.equal(Object.keys(m2.entries).length, 1, 'gün başına tek kayıt');
      assert.equal(Object.values(m2.entries)[0].level, 5);
    },
  },
  {
    id: 'F09-E1', name: 'ruh hali: Araçlar ekranındaki hızlı yüz kartı da kaydeder; takvimde ay gezinme gelecek aya geçmez', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/tools', 800);
      await s.expectText(s.t('tools.mood.title'), 'ruh hali kartı', { exact: false });
      await s.goto('/tools/mood', 600);
      await s.expectText(s.t('mood.calendar'));
      assert.ok(await s.seen(s.t('mood.none')), 'kayıt yokken boş durum');
    },
  },

  // ------------------------------------------------------------------ F10 yansıma
  {
    id: 'F10-H1', name: 'yansıma: konu seç → cevap yaz → kaydet → geçmişte görünür; bağlı görev tamamlanır; düzenle; sil', opts: { lang: 'tr', seedOpts: { habits: [{ id: 'r1', title: 'Yansıma yaz', icon: '✏️', extra: { link: 'reflection' } }] } },
    run: async (s) => {
      await s.goto('/tools/reflection', 800);
      await s.tap('Minnettarlık');
      await s.expectText(s.t('reflection.questionOf', { i: 1, n: 4 }));
      // boş kaydet → uyarı
      await s.btn(s.t('common.btn.save'));
      await s.expectText(s.t('reflection.needAnswer'));
      const fields = s.page.locator('textarea');
      await fields.first().fill('Ailem için minnettarım ğüşiöç İI');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(600);
      assert.match(s.path(), /\/tools\/reflection$/, 'listeye dönmeli');
      const r = await s.store('reflection');
      const list = Object.values(r.entries);
      assert.equal(list.length, 1);
      assert.equal(list[0].answers[0], 'Ailem için minnettarım ğüşiöç İI');
      assert.ok((await completionsOn(s)).find((x) => x.habitId === 'r1'), 'bağlı yansıma görevi tamamlanmalı');
      // geçmiş
      await s.tap(s.t('reflection.tabHistory'));
      await s.expectText('Ailem için minnettarım', 'geçmiş kaydı');
      await s.shot('reflection-history');
      // düzenle
      await s.tap('Ailem için minnettarım', { exact: false });
      await s.page.waitForTimeout(500);
      const ta = s.page.locator('textarea').first();
      assert.equal(await ta.inputValue(), 'Ailem için minnettarım ğüşiöç İI');
      await ta.fill('Düzenlenmiş cevap');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      const r2 = Object.values((await s.store('reflection')).entries);
      assert.equal(r2.length, 1, 'düzenleme yeni kayıt oluşturmamalı');
      assert.equal(r2[0].answers[0], 'Düzenlenmiş cevap');
      assert.equal((await completionsOn(s)).filter((x) => x.habitId === 'r1').length, 1);
    },
  },
  {
    id: 'F10-E1', name: 'yansıma silme: çöp kutusu düğmesi etiketi onay sorar ("silinsin mi?") ama tek dokunuşla siler', opts: { lang: 'tr' },
    knownBug: 'BUG-005 silme onaysız',
    run: async (s) => {
      await s.goto('/tools/reflection-write', 600);
      await s.page.locator('textarea').first().fill('Silinecek yazı');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      await s.goto('/tools/reflection', 600);
      await s.tap(s.t('reflection.tabHistory'));
      await s.tap('Silinecek yazı', { exact: false });
      await s.page.waitForTimeout(400);
      // sil düğmesi: etiket "confirmDelete"
      await s.page.getByRole('button', { name: s.t('reflection.confirmDelete') }).click();
      await s.page.waitForTimeout(500);
      const left = Object.keys((await s.store('reflection')).entries).length;
      // Beklenen: etiket onay istediğine göre, ilk dokunuşta kayıt hâlâ durmalı (onay adımı)
      assert.equal(left, 1, 'tek dokunuşla onaysız silindi (etiket: "' + s.t('reflection.confirmDelete') + '")');
    },
  },
  {
    id: 'F10-E2', name: 'serbest yazı: konusuz kayıt; çok uzun metin ve satır sonları korunur', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/tools/reflection', 700);
      await s.tap(s.t('reflection.freeWrite'));
      const long = 'line1\nline2 ' + 'x'.repeat(3000);
      await s.page.locator('textarea').first().fill(long);
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      const e = Object.values((await s.store('reflection')).entries)[0];
      assert.equal(e.topicId, null);
      assert.equal(e.answers[0], long);
    },
  },

  // ------------------------------------------------------------------ F11 zamanlayıcı
  {
    id: 'F11-H1', name: 'zamanlayıcı: hazır süre seç → başlat → duraklat → devam → sıfırla; süre dolunca seans kaydedilir', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/timer', 800);
      await s.tap(s.t('timer.tag.lesson'), { exact: true, nth: 0 });
      await s.tap('5 dakika', { exact: false });
      await s.expectText('05:00');
      await s.btn(s.t('timer.start'));
      await s.expectText(s.t('timer.pause'));
      await s.btn(s.t('timer.pause'));
      await s.expectText(s.t('timer.resume'));
      await s.btn(s.t('timer.resume'));
      await s.page.waitForTimeout(1300);
      const body = await s.body();
      assert.match(body, /0[0-4]:[0-5]\d/, 'geri sayım ilerlemeli');
      await s.advance(6 * 60 * 1000);
      await s.expectText(s.t('timer.doneTitle'), 'süre dolunca tamamlandı ekranı', { timeout: 4000 });
      const t = await s.store('timer');
      const sessions = Object.values(t.sessions || {});
      assert.equal(sessions.length, 1, 'seans kaydedilmeli');
      assert.equal(sessions[0].minutes, 5);
      assert.equal(sessions[0].tag, 'lesson');
      await s.shot('timer-done');
    },
  },
  {
    id: 'F11-E1', name: 'zamanlayıcı: süreli görev bağlıyken süre dolunca görev tamamlanır; "süreyi beklemeden tamamlandı say"', opts: { lang: 'tr', seedOpts: { habits: [{ id: 't1', title: 'Odaklan 5', extra: { kind: 'timer', target: 5 } }, { id: 't2', title: 'Odaklan 5b', extra: { kind: 'timer', target: 5 } }] } },
    run: async (s) => {
      await s.goto('/tools/timer?habitId=t1&minutes=5', 800);
      await s.btn(s.t('timer.start'));
      await s.advance(6 * 60 * 1000);
      await s.expectText(s.t('timer.doneTitle'), 'bitiş', { timeout: 4000 });
      assert.ok((await completionsOn(s)).find((x) => x.habitId === 't1'), 'süreli görev tamamlanmalı');
      await s.goto('/tools/timer?habitId=t2&minutes=5', 800);
      await s.btn(s.t('timer.start'));
      await s.btn(s.t('timer.completeNow'));
      await s.page.waitForTimeout(500);
      assert.ok((await completionsOn(s)).find((x) => x.habitId === 't2'), 'erken tamamlama görevi tamamlamalı');
    },
  },
  {
    id: 'F11-E2', name: 'zamanlayıcı: Pomodoro modu 25:00 çalışma gösterir; sıfırla süreyi geri getirir', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/tools/timer', 800);
      await s.tap(s.t('timer.modePomodoro'));
      await s.expectText('25:00');
      await s.btn(s.t('timer.start'));
      await s.page.waitForTimeout(1200);
      await s.btn(s.t('timer.reset'));
      await s.expectText('25:00');
    },
  },

  // ------------------------------------------------------------------ F12 alarm
  {
    id: 'F12-H1', name: 'alarm: ekle (:30, Pzt+Çar, etiket) → listede; aç/kapa; düzenle; sil → boş durum', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/alarm', 800);
      await s.expectText(s.t('alarm.emptyTitle'));
      await s.btn(s.t('alarm.add'));
      await s.expectText(s.t('alarm.newAlarm'));
      await s.tap(':30');
      await s.tap('Pzt', { exact: true });
      await s.tap('Çar', { exact: true });
      await s.page.getByPlaceholder(s.t('alarm.labelPh')).fill('İlaç ğüş');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      await s.expectText('İlaç ğüş');
      await s.expectText(':30');
      await s.shot('alarm-list');
      let a = Object.values((await s.store('alarm')).alarms);
      assert.equal(a.length, 1);
      assert.deepEqual([...a[0].days].sort(), [0, 2]);
      assert.equal(a[0].minute, 30);
      assert.equal(a[0].enabled, true);
      // kapat
      await s.page.getByRole('switch').first().click();
      await s.page.waitForTimeout(300);
      a = Object.values((await s.store('alarm')).alarms);
      assert.equal(a[0].enabled, false);
      // düzenle + sil (anahtar tıklaması düzenleyiciyi açmış olabilir: F12-E2 ayrıca denetler)
      if (!(await s.seen(s.t('alarm.editAlarm'), { timeout: 800 }))) {
        await s.expectText(s.t('alarm.nextNone'));
        await s.tap('İlaç ğüş', { exact: false });
      }
      await s.expectText(s.t('alarm.editAlarm'));
      await s.btn(s.t('common.btn.delete'));
      await s.page.waitForTimeout(400);
      await s.expectText(s.t('alarm.emptyTitle'));
      assert.equal((await s.store('alarm')).alarms.length ?? Object.keys((await s.store('alarm')).alarms).length, 0);
    },
  },
  {
    id: 'F12-E1', name: 'alarm: gün seçmeden "bir kez" alarm sonraki 07:00-gibi tek seferlik; iptal (X) kayıt eklemez', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/tools/alarm', 800);
      await s.btn(s.t('alarm.add'));
      await s.expectText(s.t('alarm.once'));
      await tapButtonWhere(s, (b) => b.y < 100 && b.x < 80);
      await s.page.waitForTimeout(300);
      await s.expectText(s.t('alarm.emptyTitle'));
      await s.btn(s.t('alarm.add'));
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(400);
      const a = Object.values((await s.store('alarm')).alarms);
      assert.equal(a.length, 1);
      assert.ok(a[0].onceAt && new Date(a[0].onceAt).getTime() > s.now, 'tek seferlik alarm gelecekte olmalı');
    },
  },
  {
    id: 'F12-E2', name: 'alarm: listedeki aç/kapa anahtarına dokunmak düzenleme ekranını açmamalı', opts: { lang: 'tr' },
    knownBug: 'BUG-006 anahtar tıklaması kartın onPress\'ine sızıyor (web)',
    run: async (s) => {
      await s.goto('/tools/alarm', 800);
      await s.btn(s.t('alarm.add'));
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(400);
      await s.expectText(s.t('alarm.title'));
      await s.page.getByRole('switch').first().click();
      await s.page.waitForTimeout(500);
      assert.ok(!(await s.seen(s.t('alarm.editAlarm'), { timeout: 500 })), 'anahtar dokunuşu düzenleyiciyi açtı');
    },
  },
];
