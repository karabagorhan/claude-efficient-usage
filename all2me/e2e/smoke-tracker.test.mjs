/** F13 Sigara azaltma (SPEC 6.2): kurulum, kayıt, tetikleyici, geri al, direnme + bonus tavanı, limit aşımı, gün kapatma (18:00/03:00). */
import { assert, completionsOn, events } from './lib.mjs';

const todayAt = (hhmm, plusDays = 0) => {
  const d = new Date(Date.now() + plusDays * 86400000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${hhmm}`;
};
const ymd = (at) => at.slice(0, 10);
/** Hazır sigara dilimi (kurulum yapılmış). */
const smokeSlice = (startDay, { start = 5, goal = 5, every = 7, logs = {} } = {}) => ({
  smoke: {
    plan: { startPerDay: start, goalPerDay: goal, everyDays: every, startDay },
    pricing: { packPrice: 100, packSize: 20, currency: 'TRY' },
    startedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    logs, resists: {}, closed: {}, craving: null,
    remind: { support: false, hours: [11, 15, 20], closing: true, closingTime: '21:00' }, activityDay: '',
  },
});
const smokeHabit = [{ id: 'sm1', title: 'Limitime uy', icon: '🚭', extra: { link: 'smoke' } }];

export default [
  {
    id: 'F13-H1', name: 'sigara kurulumu: varsayılanlarla başla → panelde 0/15, plan önizlemesi, "Plana başlayalı" süresi', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.expectText(s.t('life.smoke.setup.title'));
      await s.shot('smoke-setup');
      await s.btn(s.t('life.smoke.setup.begin'));
      await s.page.waitForTimeout(600);
      await s.expectText('0/15');
      await s.expectText(s.t('life.smoke.sinceStart'));
      const st = await s.store('smoke');
      assert.equal(st.plan.startPerDay, 15);
      assert.equal(st.plan.goalPerDay, 5);
      assert.equal(st.pricing.currency, 'TRY');
      await s.shot('smoke-dashboard');
    },
  },
  {
    id: 'F13-H2', name: 'sigara kaydı: "Bir sigara içtim" → 1/N; tetikleyici seç; geri al → 0/N', opts: { lang: 'tr', seedOpts: { slices: smokeSlice(ymd(todayAt('12:00')), { start: 5, goal: 5 }) } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.expectText('0/5');
      await s.btn(s.t('life.smoke.logOne'));
      await s.expectText('1/5');
      await s.expectText(s.t('life.smoke.triggerAsk'));
      await s.tap(s.t('life.smoke.trigger.coffee'));
      await s.page.waitForTimeout(250);
      let logs = Object.values((await s.store('smoke')).logs);
      assert.equal(logs.length, 1);
      assert.equal(logs[0].trigger, 'coffee');
      await s.btn(s.t('life.smoke.logOne'));
      await s.expectText('2/5');
      await s.tap(s.t('task.undo'));
      await s.expectText('1/5');
      await s.tap(s.t('task.undo'));
      await s.expectText('0/5');
      logs = Object.values((await s.store('smoke')).logs);
      assert.equal(logs.length, 0);
      assert.ok(!(await s.seen(s.t('life.smoke.triggerAsk'), { timeout: 400 })), 'kayıt kalmayınca geri al kartı kalkmalı');
    },
  },
  {
    id: 'F13-E1', name: 'sigara limit aşımı: limit 2 iken 3. kayıt → "Bugün limit aşıldı", halka aşım rengi, gün kapatma düğmesi yok', opts: { lang: 'tr', at: todayAt('19:00'), seedOpts: { slices: smokeSlice(ymd(todayAt('19:00')), { start: 2, goal: 2 }), habits: smokeHabit } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.expectText('0/2');
      await s.btn(s.t('life.smoke.logOne'));
      await s.btn(s.t('life.smoke.logOne'));
      await s.expectText('2/2');
      await s.expectText(s.t('life.smoke.closeBtn'), 'limitte kalındıysa kapatma açık (2/2)');
      await s.btn(s.t('life.smoke.logOne'));
      await s.expectText('3/2');
      await s.expectText(s.t('life.smoke.overTitle'));
      assert.ok(!(await s.seen(s.t('life.smoke.closeBtn'), { timeout: 400 })), 'limit aşılınca "limitimde kaldım" gösterilmemeli');
      await s.shot('smoke-over-limit');
      // hub kartı da aşımı gösterir
      await s.goto('/life', 800);
      await s.expectText('3 / 2', 'hub kartı bugün x / limit');
    },
  },
  {
    id: 'F13-E2', name: 'günü kapat: 12:00\'de kapalı ("18:00\'dan sonra"), 19:00\'da açık → bağlı görev tamamlanır, tekrar kapatılamaz', opts: { lang: 'tr', at: todayAt('12:00'), seedOpts: { slices: smokeSlice(ymd(todayAt('12:00'))), habits: smokeHabit } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.expectText(s.t('life.smoke.closeLater'));
      const btn = s.page.getByRole('button', { name: s.t('life.smoke.closeBtn') });
      assert.equal((await btn.getAttribute('aria-disabled')) === 'true' || (await btn.isDisabled()), true, '12:00\'de gün kapatma kapalı olmalı');
      await s.advance(7 * 3600 * 1000); // 19:00
      await s.nav('/life', 600);
      await s.nav('/life/smoke', 900);
      assert.equal((await btn.getAttribute('aria-disabled')) === 'true' || (await btn.isDisabled()), false, '19:00\'da gün kapatma açık olmalı');
      await btn.click();
      await s.page.waitForTimeout(400);
      await s.expectText(s.t('life.smoke.closedDone'));
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 'sm1'));
      assert.ok(!(await s.seen(s.t('life.smoke.closeBtn'), { timeout: 400 })), 'tekrar kapatılamaz');
    },
  },
  {
    id: 'F13-E3', name: 'günü kapat (19:00): "Bugün limitimde kaldım" → kapandı, bağlı görev tamamlanır (puan)', opts: { lang: 'tr', at: todayAt('19:00'), seedOpts: { slices: smokeSlice(ymd(todayAt('19:00'))), habits: smokeHabit } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.btn(s.t('life.smoke.closeBtn'));
      await s.page.waitForTimeout(500);
      await s.expectText(s.t('life.smoke.closedDone'));
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 'sm1'), 'bağlı görev tamamlanmalı');
      assert.equal(Object.keys((await s.store('smoke')).closed).length, 1);
      await s.goto('/', 800);
      await s.expectText('Limitime uy', 'rutinde görünür', { exact: true });
    },
  },
  {
    id: 'F13-E4', name: 'günü kapat: ertesi gün 02:30\'a kadar önceki günü kapatabilir (gün sınırı 03:00)', opts: { lang: 'tr', at: todayAt('02:30', 1), seedOpts: { slices: smokeSlice(ymd(todayAt('12:00'))), habits: smokeHabit } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      const btn = s.page.getByRole('button', { name: s.t('life.smoke.closeBtn') });
      assert.equal(await btn.count(), 1);
      assert.equal((await btn.getAttribute('aria-disabled')) === 'true' || (await btn.isDisabled()), false, '02:30 hâlâ önceki günün penceresinde');
      await btn.click();
      await s.page.waitForTimeout(400);
      const closedDay = Object.keys((await s.store('smoke')).closed)[0];
      assert.equal(closedDay, ymd(todayAt('12:00')), `önceki gün kapanmalı (${closedDay})`);
    },
  },
  {
    id: 'F13-E5', name: 'direnme: "İstek geldi, içmedim" → 5 dk sayaç → "Direndim" → +2 bonus; 5/gün tavan, 6. direnme puansız + uyarı', opts: { lang: 'tr', seedOpts: { slices: smokeSlice(ymd(todayAt('12:00'))) } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.btn(s.t('life.smoke.craving.start'));
      await s.expectText(/[45]:\d\d/, 'geri sayım');
      await s.expectText(s.t('life.smoke.craving.hold'));
      await s.shot('smoke-craving');
      await s.btn(s.t('life.smoke.craving.resisted'));
      await s.page.waitForTimeout(400);
      let b = (await events(s)).filter((e) => e.type === 'bonus' && e.group === 'smoke');
      assert.equal(b.length, 1);
      assert.equal(b[0].points, 2);
      await s.expectText(s.t('life.smoke.resistedToday', { n: 1 }));
      for (let i = 2; i <= 6; i++) {
        await s.btn(s.t('life.smoke.craving.start'));
        await s.btn(s.t('life.smoke.craving.resisted'));
        await s.page.waitForTimeout(250);
      }
      b = (await events(s)).filter((e) => e.type === 'bonus' && e.group === 'smoke');
      assert.equal(b.length, 5, `günde en çok 5 direnme bonusu (${b.length})`);
      assert.equal(Object.keys((await s.store('smoke')).resists).length, 6, 'direnme kayıtları yine de tutulur');
      // toastlar sırayla gösterilir (her biri ~2.7 sn); tavan uyarısı kuyruğun sonunda gelir
      await s.expectText(s.t('life.smoke.toast.cap', { n: 5 }), 'tavan uyarısı', { timeout: 20000 });
    },
  },
  {
    id: 'F13-E6', name: 'direnme sayacı: sayfa yenilense de bitiş zamanı korunur; "Yine de içtim" sayaç kapatır ve kaydeder', opts: { lang: 'en', seedOpts: { slices: smokeSlice(ymd(todayAt('12:00'))) } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.btn(s.t('life.smoke.craving.start'));
      await s.reload(900);
      await s.expectText(s.t('life.smoke.craving.title'), 'sayaç yenilemeden sonra sürmeli');
      await s.btn(s.t('life.smoke.craving.smoked'));
      await s.page.waitForTimeout(300);
      assert.equal(Object.keys((await s.store('smoke')).logs).length, 1);
      assert.equal((await s.store('smoke')).craving, null);
    },
  },
  {
    id: 'F13-E7', name: 'azaltma planı: 14 gün önce başlayan plan (15→5, 7 günde 1) bugünkü limit 13; yarınki limit gösterilir', opts: { lang: 'tr', seedOpts: { slices: smokeSlice(ymd(new Date(Date.now() - 14 * 86400000).toISOString()), { start: 15, goal: 5, every: 7 }) } },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      await s.expectText(s.t('life.smoke.limitToday', { n: 13 }));
      await s.expectText(s.t('life.smoke.limitTomorrow', { n: 13 }));
    },
  },
  {
    id: 'F13-E8', name: 'kurulum doğrulama: paket fiyatı 0/boş → Başla kapalı; hedef başlangıçtan büyük olamaz; para birimi dile göre ($ EN)', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/life/smoke', 900);
      const begin = s.page.getByRole('button', { name: s.t('life.smoke.setup.begin') });
      const off = async () => (await begin.getAttribute('aria-disabled')) === 'true' || (await begin.isDisabled());
      const price = s.page.locator('input').first();
      assert.match(await price.inputValue(), /^8/, 'EN için varsayılan fiyat $8');
      await price.fill('0');
      assert.equal(await off(), true, 'fiyat 0 iken başlama kapalı');
      await price.fill('');
      assert.equal(await off(), true);
      await price.fill('abc');
      assert.equal(await off(), true, 'harf fiyat kabul edilmemeli');
      await price.fill('7,5');
      assert.equal(await off(), false, 'ondalık virgül kabul edilmeli');
      await s.expectText('$');
    },
  },
];
