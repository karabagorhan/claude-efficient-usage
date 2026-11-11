/** F15 Ev işleri (SPEC 6.4): liste/durumlar, yap, ertele, ekle/düzenle/sil, alan filtresi, çamaşır & bulaşık akışı, özet. */
import { assert, completionsOn, events } from './lib.mjs';

const choreHabit = [{ id: 'ch1', title: 'Bir ev işi yap', icon: '🧺', extra: { link: 'chore' } }];
const groupCount = (body, label) => {
  const m = body.match(new RegExp(`${label} · (\\d+)`));
  return m ? Number(m[1]) : 0;
};
const doneBtns = (s) => s.page.getByRole('button', { name: s.t('common.btn.done'), exact: true }).filter({ visible: true });

export default [
  {
    id: 'F15-H1', name: 'ev işleri: en az 18 varsayılan iş; Bugün/Yakında grupları; haftalık hedef görünür', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      const b = await s.body();
      const total = ['Gecikmiş', 'Bugün', 'Yakında', 'Daha sonra'].reduce((a, l) => a + groupCount(b, l), 0);
      assert.ok(total >= 18, `en az 18 varsayılan iş (${total})`);
      await s.expectText(s.t('life.chores.week.title'));
      await s.shot('chores-list');
    },
  },
  {
    id: 'F15-H2', name: 'iş yap: kart "Bugün"den çıkar, son yapılma güncellenir, +2 bonus, bağlı görev tamamlanır, haftalık sayı 1', opts: { lang: 'tr', seedOpts: { habits: choreHabit } },
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      const before = groupCount(await s.body(), 'Bugün');
      await doneBtns(s).first().click();
      await s.page.waitForTimeout(500);
      const after = groupCount(await s.body(), 'Bugün');
      assert.equal(after, before - 1, `bugün grubu bir azalmalı (${before} → ${after})`);
      const bonus = (await events(s)).filter((e) => e.type === 'bonus' && e.group === 'chore');
      assert.equal(bonus.length, 1);
      assert.equal(bonus[0].points, 2);
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 'ch1'), 'bağlı görev tamamlanmalı');
      await s.expectText('Bu hafta 1 iş yapıldı', 'haftalık ilerleme', { exact: false });
    },
  },
  {
    id: 'F15-E1', name: 'aynı işi aynı gün iki kez "yaptım" işaretlemek ikinci kayıt/puan oluşturmaz', opts: { lang: 'tr', seedOpts: { habits: choreHabit } },
    knownBug: 'BUG-004 aynı gün çift iş kaydı',
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      const name = (await s.page.getByText('Bulaşıkları yıka', { exact: true }).count()) ? 'Bulaşıkları yıka' : null;
      assert.ok(name, 'ön koşul: Bulaşıkları yıka listede');
      // aynı kart için iki kez: önce yap, sonra (yeni durumda) tekrar yap
      await s.page.getByText('Bulaşıkları yıka', { exact: true }).locator('xpath=ancestor::div[.//*[@aria-label="Tamamlandı"]][1]').getByRole('button', { name: 'Tamamlandı' }).first().click();
      await s.page.waitForTimeout(400);
      await s.page.getByText('Bulaşıkları yıka', { exact: true }).locator('xpath=ancestor::div[.//*[@aria-label="Tamamlandı"]][1]').getByRole('button', { name: 'Tamamlandı' }).first().click();
      await s.page.waitForTimeout(400);
      const c = await s.store('chores');
      const bonus = (await events(s)).filter((e) => e.type === 'bonus' && e.group === 'chore');
      assert.equal(bonus.length, 1, 'aynı gün aynı iş için tek bonus');
      assert.equal(Object.keys(c.history).length, 1, `aynı gün aynı işin yinelenen yapılma kaydı oluştu (${Object.keys(c.history).length} kayıt; haftalık puan şişer)`);
    },
  },
  {
    id: 'F15-H3', name: 'ertele: "Yarına ertele" işi Yakında\'ya taşır; Özet\'te "en çok ertelenenler"de görünür', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      const before = groupCount(await s.body(), 'Bugün');
      await s.page.getByRole('button', { name: s.t('life.chores.postpone') }).first().click();
      await s.page.waitForTimeout(400);
      assert.equal(groupCount(await s.body(), 'Bugün'), before - 1);
      await s.tap(s.t('life.chores.tab.stats'));
      await s.expectText(s.t('life.chores.stats.postponed'));
      assert.ok(!(await s.seen(s.t('life.chores.stats.postponedEmpty'), { timeout: 500 })), 'ertelenen iş listelenmeli');
    },
  },
  {
    id: 'F15-H4', name: 'iş ekle / düzenle / sil: yeni iş listede, adı ve aralığı değişir, silinince kalkar', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      await s.btn(s.t('life.chores.addChore'));
      await s.expectText(s.t('life.chores.edit.newTitle'));
      const save = s.page.getByRole('button', { name: s.t('common.btn.save') });
      assert.equal((await save.getAttribute('aria-disabled')) === 'true' || (await save.isDisabled()), true, 'adsız iş kaydedilemez');
      await s.page.getByPlaceholder(s.t('life.chores.edit.namePh')).fill('Balkonu süpür çğş');
      await s.tap(s.t('life.chores.area.living'), { nth: 1 });
      await save.click();
      await s.page.waitForTimeout(500);
      await s.expectText('Balkonu süpür çğş');
      const added = Object.values((await s.store('chores')).chores).find((c) => c.name === 'Balkonu süpür çğş');
      assert.ok(added && added.every === 7, 'varsayılan aralık 7 gün');
      // düzenle
      await s.tap('Balkonu süpür çğş');
      await s.expectText(s.t('life.chores.edit.title'));
      await s.page.getByPlaceholder(s.t('life.chores.edit.namePh')).fill('Balkonu paspasla');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(400);
      await s.expectText('Balkonu paspasla');
      // sil
      await s.tap('Balkonu paspasla');
      await s.btn(s.t('common.btn.delete'));
      await s.page.waitForTimeout(400);
      assert.ok(!(await s.seen('Balkonu paspasla', { timeout: 500 })), 'silinen iş kalkmalı');
    },
  },
  {
    id: 'F15-H5', name: 'alan filtresi: Banyo seçilince yalnız banyo işleri; "Hepsi" geri getirir', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      await s.tap(s.t('life.chores.area.bath'), { exact: true });
      await s.expectText('Banyoyu temizle');
      assert.ok(!(await s.seen('Bulaşıkları yıka', { exact: true, timeout: 400 })), 'mutfak işleri gizlenmeli');
      await s.tap(s.t('life.chores.area.all'), { exact: true });
      await s.expectText('Bulaşıkları yıka', '', { exact: true });
    },
  },
  {
    id: 'F15-H6', name: 'çamaşır döngüsü: başlat → makine sayacı → süre dolar → 4 adımı bitir → tamamlandı bildirimi; her adım bir işi yapar', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      await s.tap(s.t('life.chores.tab.flows'));
      await s.btn(s.t('life.chores.flow.laundry.start'));
      await s.expectText(s.t('life.chores.flow.startMachine'));
      await s.btn(s.t('life.chores.flow.startMachine'));
      await s.expectText(s.t('life.chores.flow.running'));
      await s.shot('chores-flow-running');
      await s.advance(61 * 60 * 1000);
      await s.expectText(s.t('life.chores.flow.finishedMachine'), 'makine bitti', { timeout: 4000 });
      for (let i = 0; i < 3; i++) await s.btn(s.t('life.chores.flow.nextStep'), { nth: 0 });
      await s.btn(s.t('life.chores.flow.finish'));
      await s.expectText(s.t('life.chores.flow.laundry.finished'), 'bitiş toast', { timeout: 3000 });
      const flows = (await s.store('chores')).flows;
      assert.equal(flows.laundry.step, -1, 'akış boşa dönmeli');
      const hist = Object.keys((await s.store('chores')).history).length;
      assert.ok(hist >= 4, `her adım bir iş kaydı bırakır (${hist})`);
    },
  },
  {
    id: 'F15-E2', name: 'bulaşık makinesi akışı: sayacı iptal et, akışı sıfırla; sayfa yenilenince adım korunur', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/life/chores', 1000);
      await s.tap(s.t('life.chores.tab.flows'));
      await s.btn(s.t('life.chores.flow.dish.start'));
      await s.btn(s.t('life.chores.flow.startMachine'));
      await s.btn(s.t('life.chores.flow.cancelTimer'));
      await s.expectText(s.t('life.chores.flow.startMachine'));
      await s.btn(s.t('life.chores.flow.nextStep'));
      await s.reload();
      await s.tap(s.t('life.chores.tab.flows'));
      await s.expectText(s.t('life.chores.flow.finish'), 'ikinci adımda kalmalı');
      await s.btn(s.t('life.chores.flow.reset'));
      await s.expectText(s.t('life.chores.flow.dish.start'));
    },
  },
];
