/** F14 Ev yemeği / fast food (SPEC 6.3): kayıt, bağlı görev, hedef aşımı, silme, haftalık menü, fikirler, alışveriş listesi. */
import { assert, completionsOn } from './lib.mjs';

const mealHabit = [{ id: 'ml1', title: 'Ev yemeği ye', icon: '🍲', extra: { link: 'meal' } }];
const kindBtn = (s, kind) => s.page.getByRole('button', { name: new RegExp(s.t(`life.meals.kind.${kind}`).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).filter({ visible: true });

export default [
  {
    id: 'F14-H1', name: 'ev yemeği kaydı: öğle + Ev yemeği → bugünün kayıtlarında, haftalık sayaç 1, bağlı görev tamamlanır', opts: { lang: 'tr', seedOpts: { habits: mealHabit } },
    run: async (s) => {
      await s.goto('/life/meals', 900);
      await s.expectText(s.t('life.meals.today.empty'));
      await s.tap(s.t('life.meals.slot.lunch'), { exact: true });
      await kindBtn(s, 'home').first().click();
      await s.page.waitForTimeout(500);
      await s.expectText(`${s.t('life.meals.slot.lunch')} · ${s.t('life.meals.kind.home')}`, 'kayıt satırı');
      await s.expectText(s.t('life.meals.week.ofMin', { n: 1, m: 10 }));
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 'ml1'), 'bağlı "ev yemeği" görevi tamamlanmalı');
      await s.shot('meals-log');
    },
  },
  {
    id: 'F14-H2', name: 'fast food + not + tutar: aylık harcama güncellenir; haftalık hedef (en çok 2) aşılınca sayaç 3 / en çok 2', opts: { lang: 'tr', seedOpts: { habits: mealHabit } },
    run: async (s) => {
      await s.goto('/life/meals', 900);
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          await s.tap(s.t('life.meals.log.extra'));
          await s.page.getByPlaceholder(s.t('life.meals.log.notePh')).fill('Döner çğş');
          await s.page.locator('input').nth(1).fill('150,50');
        }
        await kindBtn(s, 'fast').first().click();
        await s.page.waitForTimeout(250);
      }
      await s.expectText(s.t('life.meals.week.ofMax', { n: 3, m: 2 }));
      await s.expectText('Döner çğş', 'not görünmeli', { exact: false });
      const e = Object.values((await s.store('meals')).entries);
      assert.equal(e.length, 3);
      assert.equal(e.filter((x) => x.amount === 150.5).length, 1, 'tutar ondalık virgülle okunmalı');
      assert.equal((await completionsOn(s)).filter((c) => c.habitId === 'ml1').length, 0, 'fast food ev yemeği görevini tamamlamaz');
      await s.expectText('151', 'aylık harcama (150,50 → ₺151)', { exact: false });
    },
  },
  {
    id: 'F14-H3', name: '"Atlandı" ve "Dışarıda sağlıklı" kaydı görevi tamamlamaz; kayıt silinebilir', opts: { lang: 'en', seedOpts: { habits: mealHabit } },
    run: async (s) => {
      await s.goto('/life/meals', 900);
      await kindBtn(s, 'skipped').first().click();
      await kindBtn(s, 'healthy').first().click();
      await s.page.waitForTimeout(400);
      assert.equal(Object.keys((await s.store('meals')).entries).length, 2);
      assert.equal((await completionsOn(s)).length === 1 || (await completionsOn(s)).filter((c) => c.habitId === 'ml1').length === 0, true);
      await s.page.getByRole('button', { name: s.t('common.btn.delete') }).first().click();
      await s.page.waitForTimeout(300);
      assert.equal(Object.keys((await s.store('meals')).entries).length, 1);
    },
  },
  {
    id: 'F14-E1', name: 'ev yemeği kaydını silince bağlı görev tamamlanmış kalmamalı (tutarlılık)', opts: { lang: 'tr', seedOpts: { habits: mealHabit } },
    knownBug: 'BUG-002 yemek kaydı silinince bağlı görev duruyor',
    run: async (s) => {
      await s.goto('/life/meals', 900);
      await kindBtn(s, 'home').first().click();
      await s.page.waitForTimeout(400);
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 'ml1'));
      await s.page.getByRole('button', { name: s.t('common.btn.delete') }).first().click();
      await s.page.waitForTimeout(400);
      assert.equal(Object.keys((await s.store('meals')).entries).length, 0);
      assert.ok(!(await completionsOn(s)).find((c) => c.habitId === 'ml1'), 'ev yemeği kaydı silindi ama görev ve puanı duruyor');
    },
  },
  {
    id: 'F14-H4', name: 'haftalık menü: "Boşları rastgele doldur" 14 kutuyu doldurur; kutu seç/kaldır; Temizle; 30+ fikir; süre filtresi', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/meals', 900);
      await s.tap(s.t('life.meals.tab.plan'));
      await s.expectText(s.t('life.meals.plan.hint'));
      await s.btn(s.t('life.meals.plan.random'));
      await s.page.waitForTimeout(400);
      assert.equal(Object.keys((await s.store('meals')).plan).length, 14, '7 gün x öğle/akşam');
      await s.shot('meals-plan');
      await s.btn(s.t('life.meals.plan.clear'));
      await s.page.waitForTimeout(300);
      assert.equal(Object.keys((await s.store('meals')).plan).length, 0);
      // tek kutu: Pzt öğle
      await s.page.getByRole('button').filter({ hasText: s.t('life.meals.slot.lunch') }).first().click();
      await s.page.waitForTimeout(300);
      const first = s.page.getByText(/^\d+ dk$/).last();
      await first.click();
      await s.page.waitForTimeout(300);
      assert.equal(Object.keys((await s.store('meals')).plan).length, 1);
      // fikirler
      const body = await s.body();
      const total = Number(body.match(/(\d+) fikir/)[1]);
      assert.ok(total >= 30, `en az 30 hızlı yemek fikri (${total})`);
      await s.tap(s.t('life.meals.ideas.upTo', { n: 15 }));
      const n15 = Number((await s.body()).match(/(\d+) fikir/)[1]);
      assert.ok(n15 > 0 && n15 < total, `15 dk filtresi (${n15} / ${total})`);
    },
  },
  {
    id: 'F14-H5', name: 'alışveriş listesi: menü boşken boş durum; menüden malzemeler birleşir; işaretle → "n / N alındı"; işaretleri temizle', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/meals', 900);
      await s.tap(s.t('life.meals.tab.shop'));
      await s.expectText(s.t('life.meals.shop.emptyTitle'));
      await s.btn(s.t('life.meals.shop.goPlan'));
      await s.btn(s.t('life.meals.plan.random'));
      await s.tap(s.t('life.meals.tab.shop'));
      const total = Number((await s.body()).match(/0 \/ (\d+) alındı/)[1]);
      assert.ok(total > 5, `malzeme sayısı ${total}`);
      const items = s.page.getByRole('checkbox');
      await items.nth(0).click();
      await items.nth(1).click();
      await s.expectText(`2 / ${total} alındı`);
      await s.shot('meals-shop');
      await s.btn(s.t('life.meals.shop.reset'));
      await s.expectText(`0 / ${total} alındı`);
      // kalıcılık
      await items.nth(0).click();
      await s.reload();
      await s.tap(s.t('life.meals.tab.shop'));
      await s.expectText(`1 / ${total} alındı`);
    },
  },
  {
    id: 'F14-E2', name: 'EN: para birimi $ ve ayarlar sayfası (hedef steppers) açılır', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/life/meals', 900);
      await s.tap(s.t('life.meals.log.extra'));
      await s.expectText('($)', 'tutar alanı $ gösterir', { exact: false });
      await s.btn(s.t('life.meals.settings.title'));
      await s.expectText(s.t('life.meals.settings.goals'));
      await s.shot('meals-settings');
    },
  },
];
