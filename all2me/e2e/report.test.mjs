/** F19 Haftalık rapor ve içgörüler: zengin veriyle ekran, hafta gezinme, boş durum, giriş noktaları, Pazartesi bandı; TR ve EN. */
import { addDays, assert } from './lib.mjs';

// Sabit "bugün": Çarşamba 2026-11-11 12:00 (hafta 09-15 Kasım, geçen hafta 02-08 Kasım). Veri 19 Ekim'den başlar.
const AT = '2026-11-11T12:00';
const TODAY = '2026-11-11';
const FIRST = '2026-10-19';
const MONDAY_AT = '2026-11-09T12:00';

/** Gün gün örüntü: çift günler "iyi" (uzun uyku, iyi ruh, su hedefi, ev yemeği, az sigara, sabah görevleri), tekler "zayıf". */
function richSeed(now = TODAY) {
  const days = [];
  for (let d = FIRST; d <= now; d = addDays(d, 1)) days.push(d);
  const good = (i) => i % 2 === 0;
  const completions = {};
  const events = {};
  const done = (h, day, pts = 10) => {
    const id = `c:${h}:${day}`;
    const at = new Date(`${day}T09:00:00`).toISOString();
    completions[id] = { id, habitId: h, userId: 'seed-me', dayKey: day, completedAt: at, points: pts, base: pts, multiplier: 1, earlyBonus: 0, _u: 1 };
    events[`ev:${id}`] = { id: `ev:${id}`, userId: 'seed-me', dayKey: day, type: 'completion', points: pts, refId: id, createdAt: at, label: h, _u: 1 };
  };
  const mood = {};
  const sleep = {};
  const drink = {};
  const meals = {};
  const logs = {};
  const history = {};
  const tops = {};
  days.forEach((day, i) => {
    if (good(i)) for (const h of ['s1', 's2', 's4', 's5']) done(h, day);
    else done('s5', day);
    mood[day] = { dayKey: day, level: good(i) ? 5 : 2, tags: good(i) ? ['calm'] : ['stressed'], note: '', at: `${day}T20:00:00.000Z` };
    sleep[day] = { dayKey: day, bed: '23:00', wake: good(i) ? '07:00' : '04:30', minutes: good(i) ? 480 : 330, quality: 0 };
    drink[`d${i}`] = { id: `d${i}`, dayKey: day, ml: good(i) ? 2400 : 600, at: `${day}T12:00:00.000Z` };
    meals[`m${i}`] = { id: `m${i}`, dayKey: day, slot: 'dinner', kind: good(i) ? 'home' : 'fast', at: `${day}T19:00:00.000Z` };
    for (let k = 0; k < (good(i) ? 2 : 9); k++) logs[`l${i}-${k}`] = { id: `l${i}-${k}`, dayKey: day, at: `${day}T10:0${k}:00.000Z` };
    if (good(i)) history[`h${i}`] = { id: `h${i}`, choreId: 'x', dayKey: day, at: `${day}T18:00:00.000Z` };
    if (good(i)) tops[day] = [1, 2, 3].map((n) => ({ id: `t${n}`, title: `t${n}`, done: true }));
  });
  return {
    opts: {
      at: `${now}T12:00`,
      seedOpts: {
        withHistory: false,
        core: { completions, events },
        slices: {
          mood: { entries: mood },
          sleep: { entries: sleep, goalHours: 8, bedReminder: null },
          drink: { entries: drink, goalMl: 2000, reminder: 0, activityDay: '' },
          meals: { entries: meals },
          smoke: { plan: { startPerDay: 10, goalPerDay: 0, everyDays: 100, startDay: FIRST }, pricing: { packPrice: 100, packSize: 20, currency: 'TRY' }, startedAt: `${FIRST}T08:00:00.000Z`, logs, resists: {}, closed: {}, craving: null, activityDay: '' },
          chores: { seeded: true, chores: {}, history },
          growth: { tops },
          timer: { sessions: [{ id: 't1', dayKey: '2026-11-10', minutes: 90, mode: 'focus', tag: 'lesson', at: '2026-11-10T10:00:00.000Z' }] },
        },
      },
    },
  };
}

const rawReportKeys = (text) => [...new Set(text.match(/(?<![\w./@-])report\.[a-z][A-Za-z0-9.]*/g) || [])];
const insightCount = (body, s) => (body.match(new RegExp(s.t('report.insight.basedOn', { n: '' }).replace(/\s*$/, '').replace(/[.*+?^$()|[\]\\]/g, '\\$&'), 'g')) || []).length;
const prevBtn = (s) => s.page.getByRole('button', { name: s.t('report.week.prev'), exact: true });
const nextBtn = (s) => s.page.getByRole('button', { name: s.t('report.week.next'), exact: true });

export default [
  ...['tr', 'en'].map((lang) => ({
    id: `F19-H1-${lang}`,
    name: `zengin veri (${lang}): özet kartları, zaman dilimi, takipçiler, ≤5 içgörü (güne dayanan), tam 3 öneri; ham anahtar / taşma yok`,
    opts: { lang, ...richSeed().opts },
    run: async (s) => {
      await s.goto('/report', 1200);
      await s.expectText(s.t('report.title'), 'başlık');
      await s.expectText(s.t('report.week.current'), 'hafta etiketi', { exact: true });
      for (const k of ['report.summary.points', 'report.summary.rate', 'report.summary.streak', 'report.summary.active', 'report.slots.title', 'report.trk.title', 'report.insights.title', 'report.sugg.title']) {
        await s.expectText(s.t(k), k, { exact: true });
      }
      const b = await s.body();
      assert.ok(b.includes(s.t('report.week.inProgress', { n: 3 })), 'devam eden hafta notu (3/7 gün)');
      // takipçi kartları
      for (const k of ['report.trk.sleep', 'report.trk.mood', 'report.trk.water', 'report.trk.smoke', 'report.trk.meals', 'report.trk.chores', 'report.trk.study', 'report.trk.growth']) {
        assert.ok(b.includes(s.t(k)), `takipçi: ${k}`);
      }
      // içgörüler: en az 3, en fazla 5; hepsi "kaç güne dayandığını" yazar; nedensellik dili yok
      const n = insightCount(b, s);
      assert.ok(n >= 3 && n <= 5, `3..5 içgörü bekleniyor (${n})`);
      assert.ok(!/(neden oluyor|yüzünden|causes|because of)/i.test(b), 'nedensellik iddiası yok');
      // 3 öneri: numaralı rozetler 1,2,3
      const suggIdx = b.indexOf(s.t('report.sugg.title'));
      const tail = b.slice(suggIdx);
      for (const k of ['1', '2', '3']) assert.ok(new RegExp(`(^|\\n)${k}(\\n|$)`).test(tail), `öneri ${k}`);
      assert.ok(!new RegExp(`(^|\\n)4(\\n|$)`).test(tail), 'en fazla 3 öneri');
      assert.deepEqual(rawReportKeys(b), [], 'ham anahtar görünmesin');
      assert.deepEqual(await s.overflowOffenders(), [], 'yatay taşma yok');
      await s.expectText(s.t('report.share.btn'), 'paylaş düğmesi', { exact: true });
      await s.shot(`report-rich-${lang}`);
    },
  })),
  {
    id: 'F19-H2', name: 'hafta gezinme: ‹ geçen hafta → tarih aralığı → alt sınırda pasif; › bu haftada pasif; devam etmeyen haftada not yok', opts: { lang: 'tr', ...richSeed().opts },
    run: async (s) => {
      await s.goto('/report', 1200);
      assert.equal(await nextBtn(s).getAttribute('aria-disabled'), 'true', 'bu haftada › pasif');
      await prevBtn(s).click();
      await s.page.waitForTimeout(400);
      await s.expectText(s.t('report.week.last'), 'geçen hafta etiketi', { exact: true });
      let b = await s.body();
      assert.ok(!b.includes(s.t('report.week.inProgress', { n: 3 })), 'geçmiş haftada "hafta sürüyor" notu yok');
      assert.ok(b.includes(s.t('report.week.vsFull')), 'tam hafta karşılaştırması');
      assert.ok(/[↑↓→]/.test(b), 'karşılaştırma oku');
      assert.notEqual(await nextBtn(s).getAttribute('aria-disabled'), 'true', 'geçen haftada › aktif');
      await s.shot('report-last-week');
      await prevBtn(s).click(); // 26 Eki
      await s.page.waitForTimeout(300);
      await s.expectText('26 Eki – 1 Kas', 'tarih aralığı etiketi', { exact: true });
      await prevBtn(s).click(); // 19 Eki (ilk veri haftası)
      await s.page.waitForTimeout(300);
      assert.equal(await prevBtn(s).getAttribute('aria-disabled'), 'true', 'ilk veri haftasında ‹ pasif');
      for (let i = 0; i < 3; i++) {
        await nextBtn(s).click();
        await s.page.waitForTimeout(200);
      }
      await s.expectText(s.t('report.week.current'), 'bu haftaya dönüş', { exact: true });
    },
  },
  {
    id: 'F19-H3', name: 'week parametresi: /report?week=2026-11-02 → geçen hafta; bozuk parametre → bu hafta', opts: { lang: 'tr', ...richSeed().opts },
    run: async (s) => {
      await s.goto('/report?week=2026-11-04', 1200); // haftanın ortası da Pazartesi'ye oturur
      await s.expectText(s.t('report.week.last'), 'geçen hafta', { exact: true });
      await s.goto('/report?week=bozuk', 1000);
      await s.expectText(s.t('report.week.current'), 'bu hafta', { exact: true });
    },
  },
  ...['tr', 'en'].map((lang) => ({
    id: `F19-E1-${lang}`,
    name: `boş durum (${lang}): yeni kullanıcıda maskotlu mesaj; içgörü / sahte sayı yok`,
    opts: { lang, at: AT, seedOpts: { noHabits: true, withHistory: false } },
    run: async (s) => {
      await s.goto('/report', 1000);
      await s.expectText(s.t('report.empty.title'), 'boş başlık', { exact: true });
      await s.expectText(s.t('report.empty.body'), 'boş gövde');
      const b = await s.body();
      assert.ok(!b.includes(s.t('report.insights.title')), 'veri yokken içgörü bölümü yok');
      assert.ok(!b.includes(s.t('report.summary.points')), 'veri yokken özet kartı yok');
      await s.btn(s.t('report.empty.cta'));
      await s.page.waitForTimeout(600);
      assert.equal(s.path(), '/', 'CTA rutine döner');
      await s.shot(`report-empty-${lang}`);
    },
  })),
  {
    id: 'F19-E2', name: 'az veri: yalnız 3 gün kayıt → içgörü yok (en az 4 gün kuralı mesajı), özet ve 3 öneri var', opts: { lang: 'tr', at: AT, seedOpts: { withHistory: false, core: (() => {
      const completions = {};
      const events = {};
      for (const day of ['2026-11-09', '2026-11-10', '2026-11-11']) {
        const id = `c:s1:${day}`;
        completions[id] = { id, habitId: 's1', userId: 'seed-me', dayKey: day, completedAt: `${day}T09:00:00.000Z`, points: 10, base: 10, multiplier: 1, earlyBonus: 0, _u: 1 };
        events[`ev:${id}`] = { id: `ev:${id}`, userId: 'seed-me', dayKey: day, type: 'completion', points: 10, refId: id, createdAt: `${day}T09:00:00.000Z`, label: 'x', _u: 1 };
      }
      return { completions, events };
    })(), slices: { mood: { entries: { '2026-11-09': { dayKey: '2026-11-09', level: 4, tags: [], note: '', at: '' }, '2026-11-10': { dayKey: '2026-11-10', level: 2, tags: [], note: '', at: '' } } }, sleep: { entries: { '2026-11-09': { dayKey: '2026-11-09', bed: '23:00', wake: '07:00', minutes: 480, quality: 0 }, '2026-11-10': { dayKey: '2026-11-10', bed: '01:00', wake: '07:00', minutes: 360, quality: 0 } }, goalHours: 8, bedReminder: null } } } },
    run: async (s) => {
      await s.goto('/report', 1200);
      await s.expectText(s.t('report.insights.none'), 'yetersiz veri mesajı');
      const b = await s.body();
      assert.equal(insightCount(b, s), 0, 'içgörü kartı yok');
      await s.expectText(s.t('report.sugg.title'), 'öneriler yine var', { exact: true });
      await s.shot('report-sparse');
    },
  },
  {
    id: 'F19-H4', name: 'giriş noktaları: Profil "Haftalık rapor" kartı ve Yaşam merkezi bağlantısı /report açar', opts: { lang: 'tr', at: AT },
    run: async (s) => {
      await s.goto('/profile', 900);
      await s.page.getByRole('button', { name: s.t('report.card.title'), exact: true }).click();
      await s.page.waitForTimeout(700);
      assert.ok(s.path().startsWith('/report'), `profil → rapor (${s.path()})`);
      await s.expectText(s.t('report.title'), 'rapor ekranı');
      await s.goto('/life', 900);
      await s.expectText(s.t('report.link'), 'yaşam merkezi bağlantısı', { exact: true });
      await s.tap(s.t('report.link'), { exact: true });
      await s.page.waitForTimeout(700);
      assert.ok(s.path().startsWith('/report'), `yaşam → rapor (${s.path()})`);
    },
  },
  {
    id: 'F19-H5', name: 'Pazartesi bandı: Pazartesi görünür → dokun: geçen hafta; kapat: gün boyu gelmez; Çarşamba görünmez', opts: { lang: 'tr', at: MONDAY_AT },
    run: async (s) => {
      await s.goto('/', 1200);
      await s.expectText(s.t('report.band.title'), 'band', { exact: true });
      await s.page.getByRole('button', { name: s.t('report.band.close'), exact: true }).click();
      await s.page.waitForTimeout(400);
      await s.expectGone(s.t('report.band.title'), 'kapatılınca band yok', { exact: true });
      const st = await s.store('report');
      assert.equal(st.bannerDismissedDay, '2026-11-09');
      await s.reload(1000);
      await s.expectGone(s.t('report.band.title'), 'yenilemede de kapalı', { exact: true });
    },
  },
  {
    id: 'F19-H6', name: 'Pazartesi bandına dokunmak geçen haftanın raporunu açar', opts: { lang: 'en', at: MONDAY_AT },
    run: async (s) => {
      await s.goto('/', 1200);
      await s.page.getByRole('button', { name: s.t('report.band.title'), exact: true }).click();
      await s.page.waitForTimeout(800);
      assert.ok(s.path().includes('/report?week=2026-11-02'), `geçen hafta (${s.path()})`);
    },
  },
  {
    id: 'F19-E3', name: 'Çarşamba günü band görünmez', opts: { lang: 'tr', at: AT },
    run: async (s) => {
      await s.goto('/', 1200);
      await s.expectGone(s.t('report.band.title'), 'hafta ortasında band yok', { exact: true });
    },
  },
  {
    id: 'F19-E4', name: 'Pazar günü band görünür ve bu haftanın raporunu açar', opts: { lang: 'tr', at: '2026-11-15T12:00' },
    run: async (s) => {
      await s.goto('/', 1200);
      await s.expectText(s.t('report.band.bodySun'), 'Pazar bandı', { exact: true });
      await s.page.getByRole('button', { name: s.t('report.band.title'), exact: true }).click();
      await s.page.waitForTimeout(800);
      assert.ok(s.path().includes('/report?week=2026-11-09'), `bu hafta (${s.path()})`);
    },
  },
  {
    id: 'F19-H7', name: 'koyu tema: rapor ekranı okunur (düşük kontrast yok), taşma yok', opts: { lang: 'tr', theme: 'dark', ...richSeed().opts },
    run: async (s) => {
      await s.goto('/report', 1200);
      await s.expectText(s.t('report.insights.title'), 'içgörüler', { exact: true });
      assert.deepEqual(await s.overflowOffenders(), []);
      const low = await s.lowContrast(3.0);
      assert.deepEqual(low, [], `düşük kontrast: ${low.join(' | ')}`);
      await s.shot('report-rich-dark');
    },
  },
];
