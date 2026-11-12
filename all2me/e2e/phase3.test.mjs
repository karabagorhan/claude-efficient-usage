/** Faz 3 (yorum araştırması düzeltmeleri): hatırlatıcı sağlığı, görev sırası, kaydırarak sil + geri al, önceden yap,
 *  esnek tekrar, açılış hata sınırı, bozuk kalıcı durum, destek/geri bildirim/hep ücretsiz. */
import { addDays, assert, completionsOn, dayPts, weekdayOf } from './lib.mjs';

const card = (s, title) => s.page.getByText(title, { exact: true }).filter({ visible: true }).first();
const yOf = async (s, title) => (await card(s, title).boundingBox()).y;
/** Rutin kartına uzun bas (Pressable onLongPress ~500 ms). */
const longPress = async (s, title) => {
  await card(s, title).click({ delay: 900 });
  await s.page.waitForTimeout(300);
};
/** Haftalık şeritte bir sonraki günü seç (Pazar ise sonraki haftaya geç). */
async function selectTomorrow(s) {
  const tomorrow = addDays(s.meta.today, 1);
  if (weekdayOf(s.meta.today) === 6) await s.page.getByRole('button', { name: s.t('routine.nextWeek') }).first().click().catch(async () => s.page.getByLabel(s.t('routine.nextWeek')).first().click());
  const DAYS = { tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
  await s.tap(DAYS[s.lang][weekdayOf(tomorrow)], { exact: true });
  await s.page.waitForTimeout(350);
  return tomorrow;
}

export default [
  // ------------------------------------------------------------------ hatırlatıcı sağlığı
  {
    id: 'P3-H1', name: 'hatırlatıcı sağlığı: Ayarlar\'dan açılır; web durumu açıklanır; sessiz saat ve günlük üst sınır kaydedilir', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/settings', 800);
      await s.tap(`🩺 ${s.t('settings.health.open')}`, { exact: false });
      await s.page.waitForURL(/settings-reminders/, { timeout: 5000 });
      await s.expectText(s.t('settings.health.web'));
      await s.expectText(s.t('settings.health.perm.web'));
      // web'de deneme bildirimi düğmesi devre dışı
      const test = s.page.getByRole('button', { name: s.t('settings.health.test.send') });
      assert.ok((await test.getAttribute('aria-disabled')) === 'true' || (await test.isDisabled()), 'web: test düğmesi kapalı');
      // sessiz saatler: aç → başlangıç 23:00, bitiş 08:00
      await s.page.getByRole('switch', { name: s.t('settings.health.quiet.title') }).click();
      await s.tap('23:00');
      await s.tap('08:00');
      await s.expectText(s.t('settings.health.quiet.range', { start: '23:00', end: '08:00' }));
      // üst sınır 8
      await s.tap('8', { exact: true });
      await s.page.waitForTimeout(400);
      const st = await s.store('settings');
      assert.deepEqual(st.quietHours, { enabled: true, start: '23:00', end: '08:00' });
      assert.equal(st.dailyCap, 8);
      await s.shot('p3-health');
      // yeniden yüklemede korunur
      await s.reload(900);
      await s.expectText(s.t('settings.health.quiet.range', { start: '23:00', end: '08:00' }));
      assert.ok((await s.overflowOffenders()).length === 0, '390px taşma yok');
    },
  },
  {
    id: 'P3-H2', name: 'reminder health (EN): default limit 12, quiet hours off; "No limit" saves 0', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/settings-reminders', 900);
      await s.expectText(s.t('settings.health.cap.title'));
      let st = await s.store('settings');
      // tohum ayarında alan yok → varsayılan (12, kapalı) bellekte; ekranda 12 etkin
      await s.expectText(s.t('settings.health.quiet.range', { start: '10:00 PM', end: '7:00 AM' }));
      await s.tap(s.t('settings.health.cap.off'));
      await s.page.waitForTimeout(400);
      st = await s.store('settings');
      assert.equal(st.dailyCap, 0);
      assert.equal(st.quietHours.enabled, false);
    },
  },

  // ------------------------------------------------------------------ görev sırası
  {
    id: 'P3-O1', name: 'sıra: saate göre otomatik (hatırlatıcılı görev üstte); Ayarlar\'dan "Elle" seçilince oluşturma sırası', opts: { lang: 'tr', seedOpts: { habits: [{ id: 'x1', title: 'Erken esneme', icon: '🤸', slot: 'morning', pastel: 'mint', extra: { reminderTime: '06:30' } }] } },
    run: async (s) => {
      await s.goto('/', 900);
      assert.ok((await yOf(s, 'Erken esneme')) < (await yOf(s, 'Yatağı topla')), 'otomatik: 06:30 hatırlatıcılı görev üstte');
      await s.goto('/settings', 700);
      await s.tap(s.t('settings.order.manual'));
      await s.page.waitForTimeout(300);
      assert.equal((await s.store('settings')).taskOrder, 'manual');
      await s.goto('/', 900);
      assert.ok((await yOf(s, 'Erken esneme')) > (await yOf(s, 'Kahvaltı yap')), 'elle: oluşturma sırası (sonra eklenen sonda)');
    },
  },
  {
    id: 'P3-O2', name: 'sıra: uzun bas → menü → "Yukarı taşı" elle sıraya geçer, order alanı yazılır ve yenilemede korunur', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 900);
      assert.ok((await yOf(s, 'Yatağı topla')) < (await yOf(s, 'Kahvaltı yap')));
      await longPress(s, 'Kahvaltı yap');
      await s.expectText(s.t('routine.menu.edit'));
      await s.expectText(s.t('routine.menu.autoHint'));
      await s.shot('p3-menu');
      await s.btn(s.t('routine.menu.up'));
      await s.page.waitForTimeout(500);
      await s.expectText(s.t('routine.orderManual'));
      assert.equal((await s.store('settings')).taskOrder, 'manual');
      const h = (await s.store('core')).habits;
      assert.ok(typeof h.s2.order === 'number' && h.s2.order < h.s1.order, 'Kahvaltı (s2) order < Yatak (s1) order');
      assert.ok((await yOf(s, 'Kahvaltı yap')) < (await yOf(s, 'Yatağı topla')), 'ekranda da yer değişti');
      await s.reload(900);
      assert.ok((await yOf(s, 'Kahvaltı yap')) < (await yOf(s, 'Yatağı topla')), 'yenilemede korunur');
      // en üstteki için "Yukarı" pasif
      await longPress(s, 'Kahvaltı yap');
      const up = s.page.getByRole('button', { name: s.t('routine.menu.up') });
      assert.ok((await up.getAttribute('aria-disabled')) === 'true' || (await up.isDisabled()), 'en üstte Yukarı kapalı');
      await s.btn(s.t('routine.menu.edit'));
      await s.expectText(s.t('newtask.editor.titleEdit'), 'menüden düzenleyici açılır');
    },
  },

  // ------------------------------------------------------------------ silme + geri al
  {
    id: 'P3-D1', name: 'sil: uzun bas menüsü → Sil → toast "Geri al" → görev geri gelir (arşiv kaldırılır)', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 900);
      await longPress(s, 'Masayı topla');
      await s.btn(s.t('routine.menu.delete'));
      await s.page.waitForTimeout(400);
      await s.expectText(s.t('routine.deleted', { title: 'Masayı topla' }));
      assert.equal((await s.store('core')).habits.s5.archived, true, 'arşivlendi');
      await s.expectGone('Masayı topla', 'listeden kalktı', { exact: true });
      await s.shot('p3-undo-toast');
      await s.btn(s.t('routine.undo'));
      await s.page.waitForTimeout(500);
      assert.equal((await s.store('core')).habits.s5.archived, false, 'geri alındı');
      await s.expectText('Masayı topla');
    },
  },
  {
    id: 'P3-D2', name: 'sil: kartı sola kaydır → arşivlenir + geri al toast\'ı; kısa kaydırma silmez ve dokunuşu tamamlamaz', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/', 900);
      const box = await card(s, 'Tidy the desk').boundingBox();
      const y = box.y + box.height / 2;
      const x0 = 250; // onay dairesinden uzakta
      // kısa kaydırma (eşik altı): geri yaylanır
      await s.page.mouse.move(x0, y);
      await s.page.mouse.down();
      for (let i = 1; i <= 6; i++) await s.page.mouse.move(x0 - i * 8, y);
      await s.page.mouse.up();
      await s.page.waitForTimeout(500);
      let c = await s.store('core');
      assert.equal(c.habits.s5.archived, false, 'kısa kaydırma silmez');
      assert.ok(!(await completionsOn(s)).some((x) => x.habitId === 's5'), 'kaydırma tamamlama sayılmaz');
      // uzun kaydırma
      await s.page.mouse.move(x0, y);
      await s.page.mouse.down();
      for (let i = 1; i <= 14; i++) await s.page.mouse.move(x0 - i * 18, y);
      await s.page.mouse.up();
      await s.page.waitForTimeout(700);
      c = await s.store('core');
      assert.equal(c.habits.s5.archived, true, 'uzun kaydırma arşivler');
      await s.expectText(s.t('routine.deleted', { title: 'Tidy the desk' }));
      await s.btn(s.t('routine.undo'));
      await s.page.waitForTimeout(500);
      assert.equal((await s.store('core')).habits.s5.archived, false);
    },
  },

  // ------------------------------------------------------------------ önceden yap
  {
    id: 'P3-A1', name: 'önceden yap: yarın seçilince bant görünür; işaret puansız (advance), olay yok; ertesi gün tamamlanmış ve puansız görünür', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 900);
      const ptsBefore = await dayPts(s);
      const tomorrow = await selectTomorrow(s);
      await s.expectText(s.t('routine.advance.title'));
      await s.shot('p3-advance');
      await card(s, 'Kahvaltı yap').click();
      await s.page.waitForTimeout(500);
      await s.expectText(s.t('routine.advance.marked'));
      const comp = (await completionsOn(s, tomorrow)).find((x) => x.habitId === 's2');
      assert.ok(comp && comp.advance === true && comp.points === 0, 'advance: true, 0 puan');
      const ev = Object.values((await s.store('core')).events).filter((e) => e.dayKey === tomorrow);
      assert.equal(ev.length, 0, 'ileri gün için puan olayı yok');
      assert.equal(await dayPts(s), ptsBefore, 'bugünkü puan değişmez');
      // ertesi güne geç (saat +24 sa; yenilemeden: tohum saati yenilemede sıfırlanır). Şeritte başka bir güne
      // sonra yine o güne dokununca ekran yeni "bugün"e göre çizilir.
      await s.advance(24 * 3600 * 1000);
      assert.equal(await s.dayKey(), tomorrow);
      const D = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
      await s.tap(D[(weekdayOf(tomorrow) + 1) % 7], { exact: true });
      await s.page.waitForTimeout(250);
      await s.tap(D[weekdayOf(tomorrow)], { exact: true });
      await s.page.waitForTimeout(400);
      await s.expectGone(s.t('routine.advance.title'), 'artık bugün: önceden yap bandı yok', { exact: true });
      await s.expectText(s.t('routine.advance.done'));
      assert.equal(await dayPts(s), 0, 'o gün puan verilmez');
      // tekrar dokunmak puan vermez: geri alır (sonra normal tamamlanabilir)
      await card(s, 'Kahvaltı yap').click();
      await s.page.waitForTimeout(800);
      assert.ok(!(await completionsOn(s, tomorrow)).some((x) => x.habitId === 's2'), 'dokununca önceden işaret geri alınır');
    },
  },
  {
    id: 'P3-A2', name: 'unuttum hakkı bandı metni netleşti (tek görev, %70, 09:00\'a kadar, haftada bir)', opts: { lang: 'en', at: `${new Date().toISOString().slice(0, 10)}T08:00` },
    run: async (s) => {
      await s.goto('/', 900);
      const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const y = s.meta.seed.daysAgo(1);
      if (weekdayOf(s.meta.today) === 0) await s.page.getByLabel(s.t('routine.prevWeek')).first().click();
      await s.tap(DAYS[weekdayOf(y)], { exact: true });
      await s.expectText(s.t('routine.backfill.body'));
      assert.match(s.t('routine.backfill.body'), /ONE task.*70%.*9:00.*once a week/);
    },
  },

  // ------------------------------------------------------------------ esnek tekrar
  {
    id: 'P3-R1', name: 'esnek tekrar: düzenleyicide "Her N gün" + başlangıç günü → schedule.every kaydedilir; planlı olmayan gün Rutin\'de görünmez', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/task/new', 700);
      await s.page.getByPlaceholder(s.t('task.namePlaceholder')).fill('Bitki sula');
      await s.tap(s.t('task.schedule.everyLabel'));
      await s.expectText(s.t('newtask.editor.everyStart'));
      // varsayılan: 2 günde bir, bugünden
      await s.expectText(s.t('task.schedule.everyDay', { n: 2 }));
      // düzenleyici yatay kaymamalı (eski hata: başlık alanı sayfayı 31 px yana kaydırıyordu)
      assert.equal(await s.page.evaluate(() => [...document.querySelectorAll('*')].some((e) => e.scrollLeft > 0)), false, 'yatay kayma yok');
      await s.shot('p3-every-editor');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(700);
      const h = Object.values((await s.store('core')).habits).find((x) => x.title === 'Bitki sula');
      assert.deepEqual(h.schedule.every, { unit: 'day', n: 2, anchor: s.meta.today });
      await s.expectText('Bitki sula', 'bugün planlı');
      await selectTomorrow(s);
      await s.expectGone('Bitki sula', 'yarın planlı değil', { exact: true });
    },
  },
  {
    id: 'P3-R2', name: 'flexible repeat (EN): every 3 weeks on Mon+Fri, from tomorrow; preview shows next dates; reopening keeps it', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/task/new', 700);
      await s.page.getByPlaceholder(s.t('task.namePlaceholder')).fill('Deep clean');
      await s.tap(s.t('task.schedule.everyLabel'));
      await s.tap(s.t('task.schedule.unit.week'), { exact: true });
      // 2 → 3 hafta: stepper "+" (Ionicons add) — etiketin sağındaki düğme
      const label = s.page.getByText(s.t('task.schedule.everyWeek', { n: 2 }), { exact: true }).first();
      const lb = await label.boundingBox();
      const plus = s.page.getByRole('button').filter({ visible: true });
      const n = await plus.count();
      for (let i = 0; i < n; i++) {
        const b = await plus.nth(i).boundingBox();
        if (b && Math.abs(b.y + b.height / 2 - (lb.y + lb.height / 2)) < 12 && b.x > lb.x + lb.width) {
          await plus.nth(i).click();
          break;
        }
      }
      await s.expectText(s.t('task.schedule.everyWeek', { n: 3 }));
      await s.tap('Mon', { exact: true, nth: 0 });
      await s.tap('Fri', { exact: true, nth: 0 });
      await s.tap(s.t('newtask.editor.tomorrow'));
      await s.expectText(s.t('newtask.editor.everyNext', { days: '' }).replace(/\s+$/, ''));
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(700);
      const h = Object.values((await s.store('core')).habits).find((x) => x.title === 'Deep clean');
      assert.deepEqual(h.schedule.every, { unit: 'week', n: 3, anchor: addDays(s.meta.today, 1) });
      assert.deepEqual(h.schedule.days, [0, 4]);
      await s.goto(`/task/${h.id}`, 800);
      await s.expectText(s.t('task.schedule.everyWeek', { n: 3 }), 'düzenlerken esnek tekrar korunur');
    },
  },

  // ------------------------------------------------------------------ hata sınırı + bozuk veri
  {
    id: 'P3-E1', name: 'hata sınırı: çizimde hata → kurtarma ekranı; sıfırla onayı ne silineceğini söyler; "Yeniden dene" düzelince uygulamaya döner', opts: { lang: 'tr', extraInit: { __all2me_crash_test: '1' } },
    allowErrors: true,
    run: async (s) => {
      await s.goto('/', 900);
      await s.expectText(s.t('common.recovery.title'));
      await s.expectText(s.t('common.recovery.retry'));
      await s.btn(s.t('common.recovery.resetBtn'));
      await s.expectText(s.t('common.recovery.resetWarn').slice(0, 40));
      await s.shot('p3-recovery');
      await s.btn(s.t('common.recovery.resetCancel'));
      // hata kalkınca yeniden dene → rutin
      await s.page.evaluate(() => window.localStorage.removeItem('__all2me_crash_test'));
      await s.btn(s.t('common.recovery.retry'));
      await s.page.waitForTimeout(800);
      await s.expectText(s.t('routine.progress.title'));
      assert.ok((await s.store('core')).habits.s1, 'veriler yerinde (sıfırlanmadı)');
    },
  },
  {
    id: 'P3-E2', name: 'hata sınırı EN: "Share error details" panoya kopyalar (sürüm + hata iletisi)', opts: { lang: 'en', extraInit: { __all2me_crash_test: '1' } },
    allowErrors: true,
    run: async (s) => {
      await s.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: s.base });
      await s.goto('/', 900);
      await s.btn(s.t('common.recovery.share'));
      await s.expectText(s.t('common.recovery.copied'));
      const txt = await s.page.evaluate(() => navigator.clipboard.readText());
      assert.match(txt, /Version: \d+\.\d+\.\d+/);
      assert.match(txt, /crash probe/);
      assert.match(txt, /Platform: web/);
    },
  },
  {
    id: 'P3-E3', name: 'bozuk kalıcı JSON (ruh hali dilimi) uygulamayı çökertmez; ham değer yedeklenir, ekran açılır', opts: { lang: 'tr', extraInit: { 'all2me-mood-v1': '{"state": {bozuk', 'all2me-drink-v1': '{"state":{"entries":"metin"},"version":1}' } },
    run: async (s) => {
      await s.goto('/tools/mood', 900);
      await s.expectText(s.t('mood.title'));
      const bak = await s.page.evaluate(() => window.localStorage.getItem('all2me-mood-v1-corrupt'));
      assert.equal(bak, '{"state": {bozuk');
      await s.goto('/tools/drink', 900);
      await s.expectText(s.t('drink.title'), 'tür uyuşmazlığı olan dilim de açılır');
      assert.ok(s.warnings.some((w) => /bozuk kayıt|türü uyuşmadı/.test(w)), 'konsol uyarısı yazıldı');
    },
  },

  // ------------------------------------------------------------------ destek / geri bildirim / ücretsiz
  {
    id: 'P3-S1', name: 'Ayarlar: "Zor bir gün mü?" (numara yok, acil durum notu), "Hep ücretsiz", geri bildirim panoya tanı metni', opts: { lang: 'tr' },
    run: async (s) => {
      await s.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: s.base });
      await s.goto('/settings', 900);
      await s.expectText(s.t('settings.support.title'));
      await s.expectText(s.t('settings.support.emergency').slice(0, 40));
      await s.expectText(s.t('settings.about.free').slice(0, 30));
      const body = await s.body();
      const support = ['intro', 'emergency', 'note', 'tips.talk', 'tips.pro', 'tips.small'].map((k) => s.t(`settings.support.${k}`)).join(' ');
      assert.ok(!/\d{3,}/.test(support), 'destek metninde telefon numarası yok');
      assert.ok(!/@[a-z0-9-]+\./i.test(body), 'e-posta adresi yok');
      await s.page.getByLabel(s.t('settings.feedback.title')).fill('Su hatırlatıcısı gelmedi');
      await s.btn(s.t('settings.feedback.share'));
      await s.expectText(s.t('settings.feedback.copied'));
      const txt = await s.page.evaluate(() => navigator.clipboard.readText());
      assert.match(txt, /Sürüm: \d/);
      assert.match(txt, /Dil: tr/);
      assert.match(txt, /Not: Su hatırlatıcısı gelmedi/);
      assert.ok(!txt.includes('Deniz'), 'kullanıcı adı eklenmez');
      // nefes egzersizi bağlantısı
      await s.btn(s.t('settings.support.tips.breathe'));
      await s.page.waitForURL(/tools\/meditate/, { timeout: 5000 });
    },
  },
  {
    id: 'P3-S2', name: 'Settings (EN): support, always-free and feedback sections render without raw keys or overflow', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/settings', 900);
      await s.expectText(s.t('settings.support.title'));
      await s.expectText(s.t('settings.feedback.title'));
      await s.expectText(s.t('settings.about.free').slice(0, 30));
      const { rawKeys } = await import('./lib.mjs');
      assert.deepEqual(rawKeys(await s.body()), []);
      assert.deepEqual(await s.overflowOffenders(), []);
    },
  },
];
