/** F02 Görevler (SPEC 3.2-3.4): ekle, düzenle, sil, tamamla, geri al, puan, sayaç, süreli, kota, geçmiş gün, gün sınırı. */
import { assert, completionsOn, dayPts, events, selectWeekDay } from './lib.mjs';

const card = (s, title) => s.page.getByText(title, { exact: true }).filter({ visible: true }).first();

export default [
  {
    id: 'F02-H1', name: 'öneriden görev ekle (＋ → öneri → düzenleyici → kaydet) ve ana ekranda görünür', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      await s.btn(s.t('routine.addTask'));
      await s.expectText(s.t('newtask.title'), 'Yeni Görev sayfası');
      await s.expectText(s.t('newtask.suggested'));
      await s.shot('task-newtask-page');
      await s.tap('Tırnak bakımı', { exact: false });
      await s.expectText(s.t('newtask.editor.titleNew'), 'düzenleyici ön dolu açılmalı');
      const v = await s.page.getByPlaceholder(s.t('task.namePlaceholder')).inputValue();
      assert.match(v, /Tırnak bakımı/i, 'ad ön dolu olmalı');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(700);
      assert.equal(s.path().split('?')[0], '/', 'kaydedince ana ekrana dönmeli (modal tamamen kapanmalı)');
      await s.expectText('Tırnak bakımı');
      const c = await s.store('core');
      assert.ok(Object.values(c.habits).some((h) => /Tırnak bakımı/i.test(h.title) && h.source === 'newtask:suggest'));
    },
  },
  {
    id: 'F02-H2', name: 'özel adlı görev: "Yeniden adlandırmak için dokun" → ad yaz → kaydet', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/', 700);
      await s.btn(s.t('routine.addTask'));
      await s.tap(s.t('newtask.rename'));
      await s.page.getByPlaceholder(s.t('task.namePlaceholder')).fill('Call grandma 📞 çğış');
      await s.tap(s.t('task.slot.evening'));
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(600);
      await s.expectText('Call grandma 📞 çğış');
      const h = Object.values((await s.store('core')).habits).find((x) => x.title.startsWith('Call grandma'));
      assert.equal(h.slot, 'evening');
      assert.equal(h.difficulty, 'easy');
    },
  },
  {
    id: 'F02-H3', name: 'görev tamamla → +puan, ilerleme güncellenir; tekrar dokun → geri al, puan düşer', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      const p0 = await dayPts(s);
      assert.equal(p0, 10, 'tohum: bugün 10 puan');
      await s.expectText('1/5 görev');
      await card(s, 'Kahvaltı yap').click();
      await s.expectText('2/5 görev', 'ilerleme');
      const p1 = await dayPts(s);
      assert.ok(p1 > p0, `puan artmalı (${p0} → ${p1})`);
      const evs = (await events(s)).filter((e) => e.type === 'completion' && e.dayKey === s.meta.today);
      assert.equal(evs.length, 2);
      await s.shot('task-completed');
      await s.page.waitForTimeout(700); // tamamlamadan sonraki 600 ms çift dokunuş kilidi (BUG-003)
      await card(s, 'Kahvaltı yap').click();
      await s.expectText('1/5 görev', 'geri alınca ilerleme düşmeli');
      assert.equal(await dayPts(s), p0, 'geri alınca puan eski değere dönmeli');
      assert.equal((await completionsOn(s)).length, 1);
    },
  },
  {
    id: 'F02-E1', name: 'çift tıklama (double click) görevi tamamlı bırakır, puan tek kez sayılır', opts: { lang: 'tr' },
    knownBug: 'BUG-003 çift dokunuş tamamlamayı geri alır',
    run: async (s) => {
      await s.goto('/', 800);
      await card(s, 'Kahvaltı yap').dblclick();
      await s.page.waitForTimeout(500);
      const done = (await completionsOn(s)).filter((c) => c.habitId === 's2');
      assert.equal(done.length, 1, `çift tıklamadan sonra görev tamamlı kalmalı (tamamlama sayısı=${done.length})`);
      const evs = (await events(s)).filter((e) => e.refId === `c:s2:${s.meta.today}`);
      assert.equal(evs.length, 1, 'puan olayı tek olmalı');
    },
  },
  {
    id: 'F02-E2', name: 'onay dairesine çift hızlı dokunuş çift puan vermez (en çok bir tamamlama puanı)', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      const before = await s.points();
      // Kartın sağ kenarına (onay dairesi) iki hızlı tıklama
      const box = await card(s, 'Masayı topla').boundingBox();
      await s.page.mouse.click(370, box.y + box.height / 2);
      await s.page.mouse.click(370, box.y + box.height / 2);
      await s.page.waitForTimeout(400);
      const after = await s.points();
      assert.ok(after - before <= 10, `puan en fazla bir tamamlama kadar artmalı (${before} → ${after})`);
    },
  },
  {
    id: 'F02-E3', name: 'görev düzenle (uzun bas): ad + zaman dilimi değişir; sil = arşivle, geçmiş puan kalır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      // uzun basma (500ms+)
      const b = await card(s, 'Masayı topla').boundingBox();
      await s.page.mouse.move(120, b.y + b.height / 2);
      await s.page.mouse.down();
      await s.page.waitForTimeout(900);
      await s.page.mouse.up();
      await s.page.waitForTimeout(600);
      // faz 3: uzun basış görev menüsünü açar (Düzenle · Yukarı · Aşağı · En üste · Sil); Düzenle → düzenleyici
      await s.expectText(s.t('routine.menu.edit'), 'uzun basış görev menüsünü açmalı');
      await s.btn(s.t('routine.menu.edit'));
      await s.page.waitForTimeout(500);
      await s.expectText(s.t('newtask.editor.titleEdit'), 'menüden düzenleyici açılmalı');
      const input = s.page.getByPlaceholder(s.t('task.namePlaceholder'));
      assert.equal(await input.inputValue(), 'Masayı topla');
      await input.fill('Masayı topla ve sil');
      await s.tap(s.t('task.slot.morning'));
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(600);
      await s.expectText('Masayı topla ve sil');
      const h = (await s.store('core')).habits.s5;
      assert.equal(h.title, 'Masayı topla ve sil');
      assert.equal(h.slot, 'morning');
      // sil
      await s.goto('/task/s1', 600);
      await s.btn(s.t('task.archive'));
      await s.expectText(s.t('newtask.editor.deleteAsk'));
      await s.btn(s.t('newtask.editor.keep'));
      await s.expectGone(s.t('newtask.editor.deleteAsk'));
      await s.btn(s.t('task.archive'));
      await s.btn(s.t('newtask.editor.deleteYes'));
      await s.page.waitForTimeout(700);
      const c = await s.store('core');
      assert.equal(c.habits.s1.archived, true, 'arşivlenmeli');
      assert.ok(c.completions[`c:s1:${s.meta.today}`], 'geçmiş tamamlama silinmemeli');
      await s.goto('/', 700);
      await s.expectGone('Yatağı topla', 'arşivlenen görev listede olmamalı', { exact: true });
    },
  },
  {
    id: 'F02-E4', name: 'düzenleyici doğrulama: boş ad, geçersiz saat, gün seçilmedi → Kaydet kapalı; uzun ad 60 ile sınırlı', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/task/new', 600);
      const save = s.page.getByRole('button', { name: s.t('common.btn.save') });
      const disabled = async () => (await save.getAttribute('aria-disabled')) === 'true' || (await save.isDisabled());
      assert.equal(await disabled(), true, 'boş adla kaydedilemez');
      await s.expectText(s.t('newtask.editor.nameRequired'));
      const name = s.page.getByPlaceholder(s.t('task.namePlaceholder'));
      await name.fill('Ğüşiöç İıĞ '.repeat(12));
      assert.ok((await name.inputValue()).length <= 60, 'ad 60 karakterle sınırlı');
      await name.fill('Test görevi');
      assert.equal(await disabled(), false);
      await s.tap(s.t('task.schedule.days'));
      await s.expectText(s.t('newtask.editor.daysNone'));
      assert.equal(await disabled(), true, 'gün seçilmeden kaydedilemez');
      await s.tap('Çar', { exact: true });
      assert.equal(await disabled(), false);
      const timeInputs = s.page.getByPlaceholder(s.t('newtask.editor.reminderHint'));
      await timeInputs.first().fill('2561');
      await s.expectText(s.t('newtask.editor.reminderInvalid'));
      assert.equal(await disabled(), true, 'geçersiz saatle kaydedilemez');
      await timeInputs.first().fill('0830');
      assert.equal(await timeInputs.first().inputValue(), '08:30', 'saat maskesi');
      assert.equal(await disabled(), false);
    },
  },
  {
    id: 'F02-E6', name: 'sayaç görevi: hedefe kadar dokun, tamamlanır', opts: { lang: 'tr', seedOpts: { habits: [{ id: 'c1', title: 'Üç tur', icon: '🔁', extra: { kind: 'counter', target: 3 } }] } },
    run: async (s) => {
      await s.goto('/', 800);
      await s.expectText('0/3', 'sayaç alt bilgisi', { exact: false });
      await card(s, 'Üç tur').click();
      await s.expectText('1/3');
      await card(s, 'Üç tur').click();
      await s.expectText('2/3');
      assert.equal((await completionsOn(s)).filter((c) => c.habitId === 'c1').length, 0, 'hedeften önce tamamlanmamalı');
      await card(s, 'Üç tur').click();
      await s.page.waitForTimeout(400);
      const done = (await completionsOn(s)).filter((c) => c.habitId === 'c1');
      assert.equal(done.length, 1, 'hedefte tamamlanmalı');
      assert.equal(done[0].points, 10, 'easy görev 10 puan');
    },
  },
  {
    id: 'F02-E7', name: 'süreli görev: dokununca zamanlayıcıyı açar (habitId, dakika)', opts: { lang: 'tr', seedOpts: { habits: [{ id: 't1', title: 'Odaklan 25', icon: '🎯', extra: { kind: 'timer', target: 25 } }] } },
    run: async (s) => {
      await s.goto('/', 800);
      await card(s, 'Odaklan 25').click();
      await s.page.waitForTimeout(700);
      assert.match(s.path(), /\/tools\/timer/);
      assert.match(s.path(), /habitId=t1/);
      assert.match(s.path(), /minutes=25/);
      await s.expectText('25', 'süre görünmeli');
      await s.shot('task-timer-linked');
    },
  },
  {
    id: 'F02-E8', name: 'haftalık kota görevi: "Haftalık hedefler" bölümü, 0/3 → tamamla → 1/3', opts: { lang: 'tr', seedOpts: { habits: [{ id: 'q1', title: 'Koşu', icon: '🏃', extra: { schedule: { days: [], weeklyQuota: 3 } } }] } },
    run: async (s) => {
      await s.goto('/', 800);
      await s.expectText(s.t('routine.weekly.title'));
      await s.expectText(s.t('routine.weekly.count', { done: 0, n: 3 }));
      await card(s, 'Koşu').click();
      await s.expectText(s.t('routine.weekly.count', { done: 1, n: 3 }));
    },
  },
  {
    id: 'F02-E9', name: 'haftalık kota tamamlanınca haftalık bonus (+25) bir kez verilir; geri alınca düşer', opts: { lang: 'tr', seedOpts: { withHistory: false, noHabits: true, habits: [{ id: 'q1', title: 'Koşu', extra: { schedule: { days: [], weeklyQuota: 1 } } }] } },
    run: async (s) => {
      await s.goto('/', 800);
      await card(s, 'Koşu').click();
      await s.page.waitForTimeout(400);
      let evs = (await events(s)).filter((e) => e.type === 'weekly_bonus');
      const all = await events(s);
      // bonus olayı türetilmiş olabilir (store'da yoksa puanlama rozetinden doğrula)
      const pts = await dayPts(s);
      assert.ok(pts >= 25, `kota dolunca haftalık bonus puana yansımalı (rozet=${pts}, olaylar=${JSON.stringify(all.map((e) => [e.type, e.points]))})`);
      void evs;
      await s.page.waitForTimeout(400); // çift dokunuş kilidinin (600 ms) dışında geri al
      await card(s, 'Koşu').click();
      await s.page.waitForTimeout(400);
      assert.equal(await dayPts(s), 0, 'geri alınca bonus da düşmeli');
    },
  },
  {
    id: 'F02-E10', name: 'geri alma mükemmel gün bonusunu düşürür', opts: { lang: 'tr', seedOpts: { withHistory: false, noHabits: true, habits: [
      { id: 'a', title: 'A işi', icon: '🅰️', extra: { }, }, { id: 'b', title: 'B işi', icon: '🅱️' }, { id: 'c', title: 'C işi', icon: '©️' },
    ] } },
    run: async (s) => {
      await s.goto('/', 800);
      for (const t of ['A işi', 'B işi', 'C işi']) { await card(s, t).click(); await s.page.waitForTimeout(250); }
      await s.page.waitForTimeout(500);
      const full = await dayPts(s);
      const evs = await events(s);
      const perfect = evs.find((e) => e.type === 'perfect_day');
      const comp = evs.filter((e) => e.type === 'completion').reduce((a, e) => a + e.points, 0);
      assert.ok(full > comp, `mükemmel gün bonusu rozete yansımalı (rozet=${full}, görev toplamı=${comp}, perfect=${perfect && perfect.points})`);
      await s.shot('task-perfect-day');
      await s.page.waitForTimeout(300); // çift dokunuş kilidinin (600 ms) dışında geri al
      await card(s, 'C işi').click(); // geri al
      await s.page.waitForTimeout(500);
      const after = await dayPts(s);
      const comp2 = (await events(s)).filter((e) => e.type === 'completion').reduce((a, e) => a + e.points, 0);
      assert.equal(after, comp2, `geri alınca mükemmel gün bonusu kalkmalı (rozet=${after}, görev toplamı=${comp2})`);
      assert.ok(after < full);
    },
  },
  {
    id: 'F02-E11', name: 'geçmiş gün salt okunur: dünü seç → kilit notu, dokunmak tamamlamaz (saat 12:00 → unuttum hakkı yok)', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      const y = s.meta.seed.daysAgo(1);
      await selectWeekDay(s, y);
      await s.expectText(s.t('task.readOnlyDay'));
      const before = (await completionsOn(s, y)).length;
      // dün tamamlanmamış görev yok; mevcut kart varsa dokun
      await s.page.getByText('Masayı topla', { exact: true }).first().click({ force: true }).catch(() => {});
      assert.equal((await completionsOn(s, y)).length, before, 'salt okunur günde tamamlama olmamalı');
    },
  },
  {
    id: 'F02-E12', name: 'unuttum hakkı: sabah 08:00 dün seçilir → bant görünür, tamamlama %70 puan; haftada bir kez', opts: { lang: 'tr', at: `${new Date().toISOString().slice(0, 10)}T08:00` },
    run: async (s) => {
      await s.goto('/', 900);
      const y = s.meta.seed.daysAgo(1);
      await selectWeekDay(s, y);
      await s.expectText(s.t('routine.backfill.title'), 'unuttum hakkı bandı');
      await s.shot('task-backfill');
      await card(s, 'Masayı topla').click();
      await s.page.waitForTimeout(500);
      const c = (await completionsOn(s, y)).find((x) => x.habitId === 's5');
      assert.ok(c, 'dün için tamamlama eklenmeli');
      assert.equal(c.points, 7, '%70 puan (10 → 7)');
      const used = (await s.store('core')).backfillUsed;
      assert.ok(Object.keys(used).length === 1, 'hak kullanıldı işaretlenmeli');
      await s.expectGone(s.t('routine.backfill.title'), 'hak bitince bant kalkmalı');
    },
  },
  {
    id: 'F02-E13', name: 'gün sınırı 03:00: 02:30\'da yapılan görev önceki güne yazılır, 03:05\'te yeni gün', opts: { lang: 'tr', at: `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}T02:30`, seedOpts: { withHistory: false } },
    run: async (s) => {
      await s.goto('/', 900);
      const calToday = s.meta.now; // 02:30
      const prevDay = new Date(calToday - 3 * 3600 * 1000);
      const expectKey = `${prevDay.getFullYear()}-${String(prevDay.getMonth() + 1).padStart(2, '0')}-${String(prevDay.getDate()).padStart(2, '0')}`;
      assert.equal(await s.dayKey(), expectKey);
      await card(s, 'Kahvaltı yap').click();
      await s.page.waitForTimeout(400);
      const c = Object.values((await s.store('core')).completions).find((x) => x.habitId === 's2');
      assert.equal(c.dayKey, expectKey, `02:30'da yapılan iş önceki güne (${expectKey}) yazılmalı, yazılan: ${c.dayKey}`);
      // başlık tarihi de önceki günü göstermeli
      const longDay = Number(expectKey.slice(8));
      await s.expectText(String(longDay), 'tarih önceki gün');
    },
  },
  {
    id: 'F02-E14', name: 'gün sınırı: 03:05\'te yeni günün anahtarı kullanılır', opts: { lang: 'tr', at: `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}T03:05`, seedOpts: { withHistory: false } },
    run: async (s) => {
      await s.goto('/', 900);
      const k = new Date(s.meta.now - 3 * 3600 * 1000);
      const expectKey = `${k.getFullYear()}-${String(k.getMonth() + 1).padStart(2, '0')}-${String(k.getDate()).padStart(2, '0')}`;
      const cal = new Date(s.meta.now);
      const calKey = `${cal.getFullYear()}-${String(cal.getMonth() + 1).padStart(2, '0')}-${String(cal.getDate()).padStart(2, '0')}`;
      assert.equal(expectKey, calKey, 'test varsayımı: 03:05 takvim günüyle aynı');
      await card(s, 'Kahvaltı yap').click();
      await s.page.waitForTimeout(400);
      const c = Object.values((await s.store('core')).completions).find((x) => x.habitId === 's2');
      assert.equal(c.dayKey, calKey);
    },
  },
  {
    id: 'F02-E15', name: 'boş durum: görev yokken maskot + "İlk görevini ekle" → Yeni Görev', opts: { lang: 'tr', seedOpts: { noHabits: true, withHistory: false } },
    run: async (s) => {
      await s.goto('/', 800);
      await s.expectText(s.t('routine.empty.title'));
      await s.shot('task-empty');
      await s.btn(s.t('routine.empty.cta'));
      await s.expectText(s.t('newtask.title'));
    },
  },
  {
    id: 'F02-E16', name: 'yeni görev ilk 24 saat %50 puan; özel (private) görev partner için maskelenir bayrağı kaydedilir', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/task/new', 600);
      await s.page.getByPlaceholder(s.t('task.namePlaceholder')).fill('Gizli iş');
      await s.page.getByRole('switch').first().click().catch(async () => { await s.tap(s.t('task.private')); });
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(600);
      const h = Object.values((await s.store('core')).habits).find((x) => x.title === 'Gizli iş');
      assert.equal(h.isPrivate, true);
      await card(s, 'Gizli iş').click();
      await s.page.waitForTimeout(400);
      const c = (await completionsOn(s)).find((x) => x.habitId === h.id);
      assert.equal(c.points, 5, 'easy görev ilk 24 saatte 5 puan');
    },
  },
];
