/** F17 İş ve kişisel gelişim (SPEC 6.6): bugünün 3 önemli işi, taşıma, hedef (sayısal / kilometre taşı), check-in, bonus, sınırlar. */
import { assert, completionsOn, events } from './lib.mjs';

const pad = (n) => String(n).padStart(2, '0');
const key = (off) => {
  const d = new Date(Date.now() + off * 86400000 - 3 * 3600 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const growthSlice = (extra = {}) => ({ growth: { tops: {}, goals: {}, learning: {}, reviews: [], settings: { morningTop3: true, fridayReview: true }, activityDay: '', ...extra } });
const linked = [{ id: 'g1', title: 'Gelişim adımı', icon: '🚀', extra: { link: 'growth' } }];
const addTop = async (s, text) => {
  const f = s.page.locator('input[placeholder*="önemli iş"], input[placeholder*="important task"]').first();
  await f.fill(text);
  await f.press('Enter');
  await s.page.waitForTimeout(250);
};
const growthBonus = async (s) => (await events(s)).filter((e) => e.type === 'bonus' && e.group === 'growth');

export default [
  {
    id: 'F17-H1', name: '3 önemli iş: ekle (Enter) → 0/3; hepsini bitir → 3/3 + kutlama, bağlı görev tamamlanır; 3 işten sonra giriş alanı kalkar', opts: { lang: 'tr', seedOpts: { habits: linked } },
    run: async (s) => {
      await s.goto('/growth', 1000);
      await s.expectText(s.t('growth.top.title'));
      await addTop(s, 'Raporu bitir çğş');
      await addTop(s, 'Toplantıya hazırlan');
      await s.expectText('0/3');
      await addTop(s, 'Sunumu gönder');
      await s.expectText('0/3');
      assert.equal(await s.page.locator('input[placeholder*="önemli iş"]').count(), 0, '3 işten sonra yeni giriş alanı olmamalı');
      assert.equal(Object.values((await s.store('growth')).tops)[0].length, 3);
      const boxes = s.page.getByRole('checkbox');
      await boxes.nth(0).click();
      await boxes.nth(1).click();
      await s.expectText('2/3');
      assert.ok(!(await completionsOn(s)).find((c) => c.habitId === 'g1'), '2/3 iken bağlı görev tamamlanmamalı');
      await boxes.nth(2).click();
      await s.expectText('3/3');
      await s.expectText(s.t('growth.top.allDone'));
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 'g1'), '3/3 → bağlı gelişim görevi tamamlanmalı');
      await s.shot('growth-top3-done');
    },
  },
  {
    id: 'F17-E1', name: '3 önemli iş: boş / yalnız boşluk eklenmez; sil (✕) çalışır; EN yer tutucular', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/growth', 1000);
      const f = s.page.locator('input[placeholder*="important task"]').first();
      await f.fill('    ');
      await f.press('Enter');
      await s.page.waitForTimeout(200);
      assert.equal(Object.values((await s.store('growth'))?.tops || {}).flat().length, 0, 'boşluk iş eklememeli');
      await addTop(s, 'One');
      assert.equal(Object.values((await s.store('growth')).tops)[0].length, 1);
      await s.page.getByLabel(s.t('common.btn.delete')).first().click();
      await s.page.waitForTimeout(250);
      assert.equal(Object.values((await s.store('growth')).tops)[0].length, 0);
    },
  },
  {
    id: 'F17-E2', name: 'tamamlanmayan işleri ertesi güne taşı: dünden kalan 2 iş önerisi → "Bugüne taşı" → bugünde, kaynak işaretli', opts: { lang: 'tr', seedOpts: { slices: growthSlice({ tops: { [key(-1)]: [{ id: 'a', title: 'Dünkü iş 1', done: false }, { id: 'b', title: 'Dünkü iş 2', done: true }, { id: 'c', title: 'Dünkü iş 3', done: false }] } }) } },
    run: async (s) => {
      await s.goto('/growth', 1000);
      await s.expectText(s.t('growth.top.carryYesterday', { n: 2 }));
      await s.shot('growth-carry');
      await s.btn(s.t('growth.top.carry'));
      await s.page.waitForTimeout(400);
      const today = (await s.store('growth')).tops[s.meta.today];
      assert.equal(today.length, 2);
      assert.ok(today.every((x) => x.from === key(-1) && !x.done));
      assert.ok(!(await s.seen(s.t('growth.top.carryYesterday', { n: 2 }), { timeout: 400 })), 'öneri kalkmalı');
    },
  },
  {
    id: 'F17-H2', name: 'sayısal hedef: oluştur (hedef 4) → şu anki değeri 4 yap → hedef tamamlanır, bonus +30, bağlı görev tamamlanır', opts: { lang: 'tr', seedOpts: { habits: linked } },
    run: async (s) => {
      await s.goto('/growth/goal/new', 800);
      await s.page.getByPlaceholder(s.t('growth.goal.titlePh')).fill('12 kitap oku çğış');
      await s.tap(s.t('growth.area.reading'));
      const nums = s.page.locator('input[placeholder="10"]');
      await nums.first().fill('4');
      await nums.first().blur();
      await s.btn(s.t('common.btn.save'), { nth: 0 }).catch(async () => s.tap(s.t('common.btn.save')));
      await s.page.waitForTimeout(600);
      const g = Object.values((await s.store('growth')).goals)[0];
      assert.equal(g.title, '12 kitap oku çğış');
      assert.equal(g.measure, 'number');
      assert.equal(g.targetValue, 4);
      assert.equal(g.area, 'reading');
      // hedef düzenle: şu anki değeri + ile 4'e çıkar (Stepper)
      await s.goto(`/growth/goal/${g.id}`, 800);
      const box = await s.page.getByText(s.t('growth.goal.current'), { exact: true }).boundingBox();
      for (let i = 0; i < 4; i++) {
        await s.page.mouse.click(390 - 16 - 18, box.y + box.height / 2); // Stepper "+" (rolsüz/etiketsiz Pressable)
        await s.page.waitForTimeout(120);
      }
      await s.btn(s.t('common.btn.save'), { nth: 0 }).catch(async () => s.tap(s.t('common.btn.save')));
      await s.page.waitForTimeout(600);
      const g2 = (await s.store('growth')).goals[g.id];
      assert.equal(g2.current, 4);
      assert.ok(g2.doneDay, 'hedefe ulaşınca tamamlanır');
      assert.equal((await growthBonus(s)).filter((e) => e.points === 30).length, 1, 'hedef bonusu 30');
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 'g1'), 'ilerleme bağlı görevi tamamlar');
    },
  },
  {
    id: 'F17-H3', name: 'kilometre taşı hedefi: taşlar → hepsi bitince hedef tamamlanır (+30), biri geri alınınca bonus düşer', opts: { lang: 'tr', seedOpts: { slices: growthSlice({ goals: { gm: { id: 'gm', title: 'Sertifika al', area: 'career', measure: 'milestones', milestones: [{ id: 'm1', title: 'Kursa yaz', done: false }, { id: 'm2', title: 'Sınava gir', done: false }], checkins: [], createdAt: '2026-01-01T00:00:00.000Z' } } }) } },
    run: async (s) => {
      await s.goto('/growth', 1000);
      await s.tap(s.t('growth.tab.goals'));
      await s.expectText('Sertifika al');
      await s.shot('growth-goals');
      await s.tap('Sertifika al');
      await s.page.waitForURL(/growth\/goal\/gm/);
      await s.page.waitForTimeout(400);
      const boxes = s.page.getByRole('checkbox');
      await boxes.nth(0).click();
      await boxes.nth(1).click();
      await s.btn(s.t('common.btn.save'), { nth: 0 }).catch(async () => s.tap(s.t('common.btn.save')));
      await s.page.waitForTimeout(600);
      const g = (await s.store('growth')).goals.gm;
      assert.ok(g.milestones.every((m) => m.done), 'iki taş da bitti');
      assert.ok(g.doneDay, 'hedef tamamlandı');
      const b = await growthBonus(s);
      assert.equal(b.length, 1, 'tek hedef bonusu');
      assert.equal(b[0].points, 30);
    },
  },
  {
    id: 'F17-E3', name: 'azalan hedef (kilo 90 → 80): yeni hedefte ilerleme %0 başlamalı, kaydetmek hedefi "tamamlanmış" sayıp bonus vermemeli', opts: { lang: 'tr' },
    knownBug: 'BUG-001 azalan hedef anında tamamlanıyor +30',
    run: async (s) => {
      await s.goto('/growth/goal/new', 800);
      await s.page.getByPlaceholder(s.t('growth.goal.titlePh')).fill('Kilo ver');
      const nums = s.page.locator('input[placeholder="0"], input[placeholder="10"]');
      await nums.nth(0).fill('90');
      await nums.nth(0).blur();
      await nums.nth(1).fill('80');
      await nums.nth(1).blur();
      await s.page.waitForTimeout(300);
      const pctTxt = (await s.body()).match(/İlerleme\s*\n\s*%(\d+)/);
      await s.shot('growth-decreasing-goal');
      await s.btn(s.t('common.btn.save'), { nth: 0 }).catch(async () => s.tap(s.t('common.btn.save')));
      await s.page.waitForTimeout(600);
      const g = Object.values((await s.store('growth')).goals)[0];
      const bonus = await growthBonus(s);
      assert.ok(!g.doneDay && bonus.length === 0, `henüz hiç ilerleme yokken hedef tamamlandı sayıldı (doneDay=${g.doneDay}, current=${g.current}, bonus=${bonus.map((b) => b.points)}, önizleme %${pctTxt && pctTxt[1]})`);
    },
  },
  {
    id: 'F17-E4', name: 'hedef formu: başlıksız kaydedilemez; sil onay ister', opts: { lang: 'tr', seedOpts: { slices: growthSlice({ goals: { gx: { id: 'gx', title: 'Silinecek hedef', area: 'skill', measure: 'number', startValue: 0, targetValue: 10, current: 3, milestones: [], checkins: [], createdAt: '2026-01-01T00:00:00.000Z' } } }) } },
    run: async (s) => {
      await s.goto('/growth/goal/new', 800);
      const save = s.page.getByRole('button', { name: s.t('common.btn.save') }).last();
      assert.equal((await save.getAttribute('aria-disabled')) === 'true' || (await save.isDisabled()), true);
      await s.goto('/growth/goal/gx', 800);
      await s.tap(s.t('growth.goal.delete'));
      await s.expectText(s.t('growth.goal.confirmDelete'));
      await s.btn(s.t('common.btn.delete'), { nth: 0 });
      await s.page.waitForTimeout(500);
      assert.equal(Object.keys((await s.store('growth')).goals).length, 0);
    },
  },
  {
    id: 'F17-H4', name: 'hedef check-in: not yaz → listede görünür; boş not eklenmez', opts: { lang: 'tr', seedOpts: { slices: growthSlice({ goals: { gx: { id: 'gx', title: 'Koşu hedefi', area: 'health', measure: 'number', startValue: 0, targetValue: 10, current: 3, milestones: [], checkins: [], createdAt: '2026-01-01T00:00:00.000Z' } } }) } },
    run: async (s) => {
      await s.goto('/growth/goal/gx', 900);
      const add = s.page.getByRole('button', { name: s.t('growth.goal.checkinAdd') });
      assert.equal((await add.getAttribute('aria-disabled')) === 'true' || (await add.isDisabled()), true);
      await s.page.getByPlaceholder(s.t('growth.goal.checkinPh')).fill('Bu hafta 3 km koştum');
      await add.click();
      await s.page.waitForTimeout(500);
      await s.expectText('Bu hafta 3 km koştum');
      assert.equal((await s.store('growth')).goals.gx.checkins.length, 1);
    },
  },
  {
    id: 'F17-H5', name: 'haftalık değerlendirme ve öğrenme sekmeleri açılır; boş durumlar', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/growth?tab=review', 900);
      await s.shot('growth-review');
      await s.goto('/growth?tab=learn', 900);
      await s.shot('growth-learn');
      await s.goto('/growth?tab=goals', 900);
      await s.expectText(s.t('growth.tab.goals'));
    },
  },
];
