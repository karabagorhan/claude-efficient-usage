/** F19-F21 Seri takvimi, ayarlar (dil, tema, birim, sıfırla), profil / istatistik / rozetler, koyu tema, 390px taşma. */
import { assert, makeSeed, dayKeyOf, addDays } from './lib.mjs';

/** Gün kaydırmalı tamamlama tohumu: offsets = [0, -1, -2] (bugüne göre) */
function histCore(offsets, now = Date.now()) {
  const sd = makeSeed({ now, withHistory: false });
  const completions = {};
  const events = {};
  const today = sd.today;
  for (const off of offsets) {
    const day = addDays(today, off);
    const id = `c:s1:${day}`;
    const at = new Date(`${day}T09:00:00`).toISOString();
    completions[id] = { id, habitId: 's1', userId: 'seed-me', dayKey: day, completedAt: at, points: 10, base: 10, multiplier: 1, earlyBonus: 0, _u: now };
    events[`ev:${id}`] = { id: `ev:${id}`, userId: 'seed-me', dayKey: day, type: 'completion', points: 10, refId: id, createdAt: at, label: 'Yatağı topla', _u: now };
  }
  return { completions, events, progress: {} };
}
const withHist = (offsets, extra = {}) => ({ lang: 'tr', seedOpts: { withHistory: false, core: histCore(offsets) }, ...extra });

export default [
  {
    id: 'F19-H1', name: 'seri ekranı: 3 gün üst üste → "3 günlük seri", En uzun 3, toplam 3; takvim bugünün ayını gösterir', opts: withHist([0, -1, -2]),
    run: async (s) => {
      await s.goto('/streak', 900);
      await s.expectText('3', '', { exact: true });
      await s.expectText(s.t('streak.unit'));
      await s.expectText(s.t('streak.days', { n: 3 }), 'en uzun/toplam', { exact: false });
      await s.expectText('Kasım 2026');
      await s.shot('streak');
    },
  },
  {
    id: 'F19-E1', name: 'seri: bugün henüz görev yok ama dün ve önceki gün var → seri 2 (bozulmaz); ana ekran rozeti de 2', opts: withHist([-1, -2]),
    run: async (s) => {
      await s.goto('/', 800);
      const lab = await s.page.getByLabel(s.t('routine.streakLabel', { n: 2 })).count();
      assert.equal(lab, 1, 'ana ekran seri rozeti 2 olmalı');
      await s.goto('/streak', 800);
      await s.expectText(s.t('streak.unit'));
      assert.match(await s.body(), /\n2\n/);
    },
  },
  {
    id: 'F19-E2', name: 'seri: dün boş (2 gün önce var) → seri 0; ilk görev tamamlanınca 1\'e çıkar', opts: withHist([-2, -3]),
    run: async (s) => {
      await s.goto('/', 800);
      assert.equal(await s.page.getByLabel(s.t('routine.streakLabel', { n: 0 })).count(), 1, 'kopuk seri 0');
      await s.tap('Yatağı topla', { exact: true });
      await s.page.waitForTimeout(400);
      assert.equal(await s.page.getByLabel(s.t('routine.streakLabel', { n: 1 })).count(), 1, 'ilk görev seriyi 1 yapmalı');
      await s.goto('/streak', 800);
      await s.expectText(s.t('streak.banner.low'), 'teşvik afişi');
    },
  },
  {
    id: 'F19-E3', name: 'seri takvimi: önceki aya git (Ekim 2026), sonraki ay güncel ayda kapalı', opts: withHist([0, -1]),
    run: async (s) => {
      await s.goto('/streak', 900);
      await s.page.getByLabel(s.t('streak.prev')).click();
      await s.expectText('Ekim 2026');
      await s.page.getByLabel(s.t('streak.next')).click();
      await s.expectText('Kasım 2026');
      const nx = s.page.getByLabel(s.t('streak.next'));
      assert.equal((await nx.getAttribute('aria-disabled')) === 'true' || (await nx.isDisabled().catch(() => false)), true, 'gelecek aya geçilmemeli');
    },
  },
  {
    id: 'F19-E4', name: 'seri sıfırken afiş "bugün tek görev tamamla" gösterir', opts: withHist([]),
    run: async (s) => {
      await s.goto('/streak', 900);
      await s.expectText(s.t('streak.banner.zero'));
    },
  },
  {
    id: 'F20-H1', name: 'ayarlar: dil English → arayüz anında İngilizce, sekme çubuğu ve ana ekran İngilizce; yenilemede kalıcı; Türkçe\'ye dön', opts: { lang: 'tr' },
    run: async (s, env) => {
      const en = (await import('./lib.mjs')).translator(env.dict, 'en');
      await s.goto('/settings', 800);
      await s.tap('English', { exact: true });
      await s.expectText(en('settings.title'), 'başlık İngilizce olmalı');
      await s.shot('settings-en');
      await s.reload();
      await s.expectText(en('settings.title'));
      assert.equal((await s.store('settings')).lang, 'en');
      await s.goto('/', 800);
      await s.expectText('Make the bed', 'kullanıcı içeriği çevrilmez ama arayüz çevrilir', { exact: false }).catch(() => {});
      await s.expectText(en('task.slot.morning'), 'zaman dilimi başlığı İngilizce');
      await s.goto('/settings', 600);
      await s.tap('Türkçe', { exact: true });
      await s.expectText(s.t('settings.title'));
    },
  },
  {
    id: 'F20-H2', name: 'ayarlar: tema Koyu → arka plan koyu, Açık → açık, Sistem → cihaz teması; yenilemede kalıcı', opts: { lang: 'tr', theme: 'light' },
    run: async (s) => {
      const bg = async () => s.page.evaluate(() => {
        // ekranın altındaki ilk opak arka plan (sayfa zemini)
        for (let n = document.elementFromPoint(195, 60); n; n = n.parentElement) {
          const c = getComputedStyle(n).backgroundColor;
          const m = c.match(/rgba?\(([^)]+)\)/);
          if (m) {
            const p = m[1].split(',').map(parseFloat);
            if ((p[3] ?? 1) > 0.95) return c;
          }
        }
        return 'rgb(255, 255, 255)';
      });
      const lumOf = (c) => { const m = c.match(/\d+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
      await s.goto('/settings', 800);
      await s.tap(s.t('settings.theme.dark'), { exact: true });
      await s.page.waitForTimeout(500);
      assert.ok(lumOf(await bg()) < 0.2, `koyu temada arka plan koyu olmalı (${await bg()})`);
      await s.shot('settings-dark');
      await s.reload();
      assert.ok(lumOf(await bg()) < 0.2, 'yenilemeden sonra da koyu');
      await s.tap(s.t('settings.theme.light'), { exact: true });
      await s.page.waitForTimeout(500);
      assert.ok(lumOf(await bg()) > 0.8, 'açık temada arka plan açık olmalı');
      await s.tap(s.t('settings.theme.system'), { exact: true });
      await s.page.waitForTimeout(500);
      assert.ok(lumOf(await bg()) > 0.8, 'sistem (açık cihaz) → açık');
      assert.equal((await s.store('settings')).theme, 'system');
    },
  },
  {
    id: 'F20-H3', name: 'ayarlar: koyu tema — ana ekran, araçlar, ilham, ayarlar, yaşam, çark sayfalarında düşük kontrastlı metin yok', opts: { lang: 'tr', theme: 'dark' },
    run: async (s) => {
      const bad = [];
      for (const p of ['/', '/tools', '/inspire', '/settings', '/life', '/profile', '/new-task', '/study', '/duel']) {
        await s.goto(p, 700);
        const lc = await s.lowContrast(2.0);
        if (lc.length) bad.push(`${p}: ${lc.join(' ; ')}`);
        if (p === '/') await s.shot('dark-home');
      }
      assert.deepEqual(bad, [], 'koyu temada okunaksız metin');
    },
  },
  {
    id: 'F20-H4', name: 'ayarlar: birim oz → su sayfası oz gösterir; ml\'ye dönünce ml', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/settings', 800);
      await s.tap('oz', { exact: true });
      await s.goto('/tools/drink', 700);
      await s.expectText('oz');
      await s.goto('/settings', 700);
      await s.tap('ml', { exact: true });
      await s.goto('/tools/drink', 700);
      assert.ok((await s.body()).includes('ml'));
    },
  },
  {
    id: 'F20-H5', name: 'verileri sıfırla: vazgeç → veri kalır; onayla → çekirdek + dilimler + ayarlar silinir, onboarding\'e döner', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/drink', 700);
      await s.tap(s.t('drink.glass'));
      await s.goto('/settings', 800);
      await s.tap(s.t('settings.data.reset'));
      await s.expectText(s.t('settings.data.warn'));
      await s.btn(s.t('common.btn.cancel'));
      await s.expectGone(s.t('settings.data.warn'));
      assert.ok((await s.store('core')).me, 'vazgeçince veri durmalı');
      await s.tap(s.t('settings.data.reset'));
      await s.btn(s.t('settings.data.confirm'));
      await s.page.waitForTimeout(1500);
      assert.match(s.path(), /onboarding/, `sıfırlayınca onboarding\'e dönmeli (${s.path()})`);
      const keys = await s.page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('all2me-')));
      const core = await s.store('core');
      assert.ok(!core || !core.me, 'profil silinmeli');
      const drink = await s.store('drink');
      assert.ok(!drink || Object.keys(drink.entries || {}).length === 0, `su kayıtları silinmeli (${keys.join(',')})`);
      await s.shot('reset-onboarding');
    },
  },
  {
    id: 'F21-H1', name: 'profil: ad, seviye, XP çubuğu, toplam puan, seri/yarış/rozet/istatistik kartları; rozetler ve istatistik sayfaları açılır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/profile', 900);
      await s.expectText('Deniz');
      await s.expectText('Seviye 1');
      await s.expectText('2 / 40 kazanıldı');
      await s.shot('profile');
      await s.goto('/stats', 900);
      await s.shot('stats');
      await s.goto('/badges', 900);
      await s.expectText('40', '', { exact: false });
      await s.shot('badges');
    },
  },
  {
    id: 'F21-E1', name: 'profil EN ve koyu tema 390px: taşma yok', opts: { lang: 'en', theme: 'dark' },
    run: async (s) => {
      for (const p of ['/profile', '/stats', '/badges', '/settings']) {
        await s.goto(p, 600);
        const off = await s.overflowOffenders();
        assert.deepEqual(off, [], `taşma ${p}`);
      }
    },
  },
];
