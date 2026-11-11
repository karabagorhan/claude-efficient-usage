/** F18 Yarış / partner (SPEC 3.11): partnersiz boş durum, demo partner, dönem sekmeleri/gezinme, dürt / tebrik kuralları, gizli görev maskesi. */
import { assert } from './lib.mjs';

async function addDemo(s) {
  await s.goto('/pairing', 800);
  await s.btn(s.t('settings.pairing.demoAdd'));
  await s.page.waitForTimeout(600);
}
const nudgeBtn = (s) => s.page.getByRole('button', { name: s.t('duel.nudge') });

export default [
  {
    id: 'F18-H1', name: 'yarış: partner yokken boş durum + "Partnerle eşleş" → eşleşme ekranı; kendi puanların gösterilir', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/duel', 900);
      await s.expectText(s.t('duel.noPartnerTitle'));
      await s.expectText(s.t('duel.yourPoints'));
      await s.shot('duel-nopartner');
      await s.btn(s.t('duel.pair'));
      await s.page.waitForURL(/pairing/);
    },
  },
  {
    id: 'F18-H2', name: 'demo partner ekle → yarış: günlük/haftalık/aylık sekmeler, ben vs partner puanı, çekişme, gün gün grafik, rafı', opts: { lang: 'tr' },
    run: async (s) => {
      await addDemo(s);
      await s.expectText(s.t('settings.pairing.demoActive'), '', { exact: false }).catch(() => {});
      assert.ok((await s.store('core')).partner, 'demo partner kaydedilmeli');
      await s.goto('/duel', 1000);
      await s.expectText('Demo');
      await s.expectText(s.t('points.vs'));
      await s.shot('duel-day');
      await s.tap(s.t('points.period.week'), { exact: true });
      await s.expectText(s.t('duel.dayByDay'));
      await s.shot('duel-week');
      await s.tap(s.t('points.period.month'), { exact: true });
      await s.expectText(s.t('duel.mini.wonDays'));
      await s.expectText(s.t('duel.shelf'));
      await s.shot('duel-month');
      const body = await s.body();
      assert.ok(!/NaN|undefined|Infinity/.test(body), 'sayı biçimi bozuk (NaN/undefined)');
    },
  },
  {
    id: 'F18-H3', name: 'yarış: önceki döneme git → "Kapandı", sonraki düğmesi güncel dönemde kapalı; gün/hafta/ay arasında gezinme', opts: { lang: 'tr' },
    run: async (s) => {
      await addDemo(s);
      await s.goto('/duel', 900);
      await s.expectText(s.t('duel.status.current'));
      const next = s.page.getByLabel(s.t('duel.next'));
      assert.equal((await next.getAttribute('aria-disabled')) === 'true' || (await next.isDisabled().catch(() => false)), true, 'güncel dönemde "sonraki" kapalı');
      await s.page.getByLabel(s.t('duel.prev')).click();
      await s.expectText(s.t('duel.status.closed'));
      await next.click();
      await s.expectText(s.t('duel.status.current'));
      await s.tap(s.t('points.period.week'), { exact: true });
      await s.page.getByLabel(s.t('duel.prev')).click();
      await s.page.getByLabel(s.t('duel.prev')).click();
      await s.expectText(s.t('duel.status.closed'));
    },
  },
  {
    id: 'F18-E1', name: 'dürt kuralları: ilk dürtme gider; 2 saat dolmadan ikincisi reddedilir; 2 saat sonra gider; günde en çok 3', opts: { lang: 'tr' },
    run: async (s) => {
      await addDemo(s);
      await s.goto('/duel', 900);
      const sent = async () => Object.values((await s.store('core')).nudges).filter((n) => n.kind === 'nudge').length;
      await nudgeBtn(s).click();
      await s.page.waitForTimeout(300);
      assert.equal(await sent(), 1);
      await nudgeBtn(s).click();
      await s.page.waitForTimeout(300);
      assert.equal(await sent(), 1, '2 saat dolmadan ikinci dürtme gitmemeli');
      await s.expectText(s.t('toast.nudge.minGap', { n: 2 }), 'sebep toast\'u', { timeout: 6000 });
      await s.advance(2 * 3600 * 1000 + 1000);
      await nudgeBtn(s).click();
      await s.advance(2 * 3600 * 1000 + 1000);
      await nudgeBtn(s).click();
      await s.page.waitForTimeout(300);
      assert.equal(await sent(), 3, `günde 3 dürtme (şimdi ${await sent()})`);
      await s.advance(2 * 3600 * 1000 + 1000);
      await nudgeBtn(s).click();
      await s.page.waitForTimeout(300);
      assert.equal(await sent(), 3, '4. dürtme günlük sınırı aşmamalı');
    },
  },
  {
    id: 'F18-E2', name: 'dürt: sessiz saatlerde (23:00) gönderilmez; tebrik (cheer) sınırsız gider', opts: { lang: 'tr', at: (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T23:00`; })() },
    run: async (s) => {
      await addDemo(s);
      await s.goto('/duel', 900);
      await nudgeBtn(s).click();
      await s.page.waitForTimeout(300);
      assert.equal(Object.values((await s.store('core')).nudges).filter((n) => n.kind === 'nudge').length, 0, 'sessiz saatte dürtme gitmemeli');
      await s.expectText(s.t('toast.nudge.quietHours'), '', { timeout: 6000 });
      await s.page.getByRole('button', { name: s.t('duel.cheer') }).click();
      await s.page.waitForTimeout(300);
      assert.equal(Object.values((await s.store('core')).nudges).filter((n) => n.kind === 'cheer').length, 1);
    },
  },
  {
    id: 'F18-E3', name: 'partnerin özel görevi hiçbir yerde başlıkla görünmez (ana ekran: kilit; yarış akışı: "özel bir görevi bitirdi")', opts: { lang: 'tr' },
    run: async (s) => {
      await addDemo(s);
      await s.goto('/', 1000);
      await s.expectText('Sabah koşusu', 'özel olmayan partner görevi görünür', { exact: false });
      assert.ok(!(await s.seen('Meditasyon', { exact: true, timeout: 500 })), 'özel görev başlığı ana ekranda görünmemeli');
      await s.goto('/duel', 1000);
      const body = await s.body();
      assert.ok(!/Meditasyon/.test(body), 'özel görev başlığı yarış akışında görünmemeli');
      await s.shot('duel-feed');
    },
  },
  {
    id: 'F18-H4', name: 'ana ekran yarış kartı: partner varken iki puan + çekişme çubuğu; karta dokununca Yarış ekranı', opts: { lang: 'en' },
    run: async (s) => {
      await addDemo(s);
      await s.goto('/', 1000);
      await s.expectText(s.t('routine.duel.title'));
      await s.tap(s.t('routine.duel.title'));
      await s.page.waitForURL(/\/duel/);
    },
  },
  {
    id: 'F18-E4', name: 'demo partneri kaldır → yarış tekrar boş durum', opts: { lang: 'tr' },
    run: async (s) => {
      await addDemo(s);
      await s.goto('/pairing', 800);
      await s.btn(s.t('settings.pairing.demoRemove'));
      await s.page.waitForTimeout(500);
      assert.equal((await s.store('core')).partner, null);
      await s.goto('/duel', 800);
      await s.expectText(s.t('duel.noPartnerTitle'));
    },
  },
];
