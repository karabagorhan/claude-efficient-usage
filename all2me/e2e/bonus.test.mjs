/** F03-F05 Harekete Geç, Çark, Şanslı görev, günlük bonus tavanı (SPEC 3.5, 3.6, CONFIG.bonus). */
import { assert, completionsOn, events } from './lib.mjs';

const bonusEvents = async (s, group) => (await events(s)).filter((e) => e.type === 'bonus' && (!group || e.group === group));
const actionUrl = (id, group = 'wheel', extra = '') => `/action?bonusId=${group}:${id}&title=${encodeURIComponent('Test iş ' + id)}&emoji=%F0%9F%8E%AF&points=10&group=${group}&pastel=pink&source=${group}${extra}`;

async function doBonus(s, id, group) {
  await s.goto(actionUrl(id, group), 500);
  await s.btn(s.t('common.btn.done'));
  await s.page.waitForTimeout(300);
}

export default [
  {
    id: 'F03-H1', name: 'Harekete Geç (görev): Tamamlandı → görev tamamlanır, "+N puan kazandın", ekran kendiliğinden kapanır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 700);
      await s.goto('/action?habitId=s5&source=routine', 600);
      await s.expectText(s.t('routine.action.title'));
      await s.expectText('Masayı topla');
      await s.shot('action-habit');
      await s.btn(s.t('common.btn.done'));
      await s.expectText(s.t('routine.action.wellDone'));
      await s.expectText('puan kazandın', 'kazanılan puan');
      const c = (await completionsOn(s)).find((x) => x.habitId === 's5');
      assert.ok(c && c.points > 0, 'görev tamamlanmış olmalı');
      await s.page.waitForTimeout(2200);
      assert.equal(s.path().split('?')[0], '/', `ekran kapanıp ana ekrana dönmeli (şimdi ${s.path()})`);
    },
  },
  {
    id: 'F03-H2', name: 'Harekete Geç (görev): "Sonra yap" hiçbir şey kaydetmez', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/action?habitId=s5', 600);
      await s.btn(s.t('common.btn.later'));
      await s.page.waitForTimeout(500);
      assert.equal((await completionsOn(s)).filter((x) => x.habitId === 's5').length, 0);
    },
  },
  {
    id: 'F03-E1', name: 'Harekete Geç: zaten tamamlanmış görev → Tamamlandı devre dışı + "zaten tamamladın" notu', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/action?habitId=s1', 600); // s1 bugün tamamlı
      await s.expectText(s.t('routine.action.alreadyDone'));
      const b = s.page.getByRole('button', { name: s.t('common.btn.done') });
      assert.equal((await b.getAttribute('aria-disabled')) === 'true' || (await b.isDisabled()), true);
    },
  },
  {
    id: 'F03-E2', name: 'Harekete Geç: arşivlenmiş / olmayan görev ve eksik parametre → "bulunamadı" mesajı, çökme yok', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/action?habitId=yok-boyle-bir-id', 600);
      await s.expectText(s.t('routine.action.missing'));
      await s.goto('/action', 600);
      await s.expectText(s.t('routine.action.missing'));
    },
  },
  {
    id: 'F03-E3', name: 'bonus Harekete Geç: aynı bonusId ikinci kez puan vermez', opts: { lang: 'tr' },
    run: async (s) => {
      await doBonus(s, 'dup1', 'wheel');
      await s.page.waitForTimeout(1800);
      assert.equal((await bonusEvents(s, 'wheel')).length, 1);
      await s.goto(actionUrl('dup1', 'wheel'), 500);
      await s.btn(s.t('common.btn.done'));
      await s.expectText(s.t('routine.action.alreadyDone'));
      assert.equal((await bonusEvents(s, 'wheel')).length, 1, 'ikinci kez puanlanmamalı');
    },
  },
  {
    id: 'F04-H1', name: 'çark çevir: dön → sonuç şeridi → Harekete Geç (bonus) → Tamamlandı → +10 puan', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/wheel', 900);
      await s.expectText(s.t('wheel.title.chores'));
      await s.expectText(s.t('wheel.today', { n: 0, max: 5 }));
      await s.shot('wheel-initial');
      await s.btn(s.t('wheel.spin'));
      await s.expectText(s.t('wheel.spinning'), 'dönerken etiket');
      await s.page.waitForURL(/\/action/, { timeout: 12000 });
      await s.expectText(s.t('routine.action.title'));
      await s.expectText(s.t('routine.action.bonusLabel'));
      await s.shot('wheel-action');
      const before = await s.points();
      await s.btn(s.t('common.btn.done'));
      await s.expectText(s.t('routine.action.wellDone'));
      const evs = await bonusEvents(s, 'wheel');
      assert.equal(evs.length, 1);
      assert.equal(evs[0].points, 10);
      assert.equal((await s.points()) - before, 10);
      await s.page.waitForTimeout(2200);
      assert.match(s.path(), /\/wheel/, `çark sekmesine dönmeli (şimdi ${s.path()})`);
      await s.expectText(s.t('wheel.today', { n: 1, max: 5 }), 'sayaç 1/5');
    },
  },
  {
    id: 'F04-H2', name: 'çark: sonuç şeridi, durduğu dilimle Harekete Geç başlığı aynı', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/wheel', 900);
      await s.btn(s.t('wheel.spin'));
      await s.page.waitForURL(/\/action/, { timeout: 12000 });
      const url = new URL(s.page.url());
      const title = url.searchParams.get('title');
      assert.ok(title && title.length > 0, 'başlık parametresi');
      await s.expectText(title, 'Harekete Geç ekranı çark sonucunu göstermeli', { exact: true });
      const w = JSON.parse((await s.page.evaluate(() => localStorage.getItem('all2me-wheel-v1'))) || '{}').state;
      assert.ok(w.last && w.last.sliceId, 'son sonuç saklanmalı');
      await s.btn(s.t('common.btn.later'));
      await s.page.waitForTimeout(600);
      await s.expectText(title, 'sonuç şeridinde son sonuç görünmeli', { exact: true });
    },
  },
  {
    id: 'F04-E1', name: 'çark bonusu günlük tavan: 5 çark görevi puanlanır, 6.sı "bonus sınırı" uyarısı verir ve puan vermez', opts: { lang: 'tr' },
    run: async (s) => {
      for (let i = 1; i <= 5; i++) await doBonus(s, `cap${i}`, 'wheel');
      await s.page.waitForTimeout(1800);
      assert.equal((await bonusEvents(s, 'wheel')).length, 5);
      const pts = await s.points();
      await s.goto(actionUrl('cap6', 'wheel'), 500);
      await s.btn(s.t('common.btn.done'));
      await s.page.waitForTimeout(500);
      assert.equal((await bonusEvents(s, 'wheel')).length, 5, '6. bonus puanlanmamalı');
      assert.equal(await s.points(), pts);
      await s.expectText(s.t('toast.bonusCap', { n: 5 }), 'tavan uyarısı (toast)');
      await s.shot('bonus-cap-toast');
    },
  },
  {
    id: 'F04-E2', name: 'çark + şanslı görev tavanları ayrı sayılır (wheel 5, lucky 3)', opts: { lang: 'en' },
    run: async (s) => {
      for (let i = 1; i <= 3; i++) await doBonus(s, `l${i}`, 'lucky');
      await s.page.waitForTimeout(1800);
      await doBonus(s, 'l4', 'lucky');
      await s.page.waitForTimeout(500);
      assert.equal((await bonusEvents(s, 'lucky')).length, 3, 'şanslı görev günde 3 ile sınırlı');
      await doBonus(s, 'w1', 'wheel');
      await s.page.waitForTimeout(500);
      assert.equal((await bonusEvents(s, 'wheel')).length, 1, 'çark tavanı lucky\'den bağımsız');
    },
  },
  {
    id: 'F04-E3', name: 'bonus tavanı gün sınırında sıfırlanır (ertesi gün tekrar puan verir)', opts: { lang: 'tr' },
    run: async (s) => {
      for (let i = 1; i <= 5; i++) await doBonus(s, `d${i}`, 'wheel');
      await s.page.waitForTimeout(1800);
      await s.advance(24 * 3600 * 1000);
      await s.nav(actionUrl('d6', 'wheel'));
      await s.btn(s.t('common.btn.done'));
      await s.page.waitForTimeout(500);
      assert.equal((await bonusEvents(s, 'wheel')).length, 6, 'ertesi gün yeni tavan');
    },
  },
  {
    id: 'F04-E4', name: 'çark sekmeleri (Ev işleri / Kendine bakım / Hareket): başlık ve dilimler değişir', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/wheel', 800);
      for (const id of ['selfcare', 'move', 'chores']) {
        await s.tap(s.t(`wheel.name.${id}`), { exact: true });
        await s.expectText(s.t(`wheel.title.${id}`));
      }
    },
  },
  {
    id: 'F04-E5', name: 'çark düzenle: dilim ekle, yeniden adlandır, sil; en az 4 dilim; varsayılana dön', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/wheel', 800);
      await s.btn(s.t('wheel.edit'));
      await s.expectText(s.t('wheel.editor.title'));
      const countRe = /(\d+) dilim/;
      const n0 = Number((await s.body()).match(countRe)[1]);
      await s.btn(s.t('wheel.editor.add'));
      await s.page.waitForTimeout(300);
      assert.equal(Number((await s.body()).match(countRe)[1]), n0 + 1);
      // yeni dilimi yeniden adlandır
      const inputs = s.page.getByPlaceholder(s.t('wheel.editor.namePlaceholder'));
      const last = inputs.last();
      await last.fill('Çiçekleri sula çğüş');
      await last.blur();
      const w = JSON.parse(await s.page.evaluate(() => localStorage.getItem('all2me-wheel-v1'))).state;
      const sl = w.custom.chores;
      assert.ok(sl.some((x) => x.label === 'Çiçekleri sula çğüş'), 'yeni ad saklanmalı');
      // kalıcılık
      await s.reload();
      await s.goto('/wheel-edit', 600);
      assert.ok(await s.seen('Çiçekleri sula çğüş', { exact: false }) || (await s.page.locator('input').evaluateAll((els) => els.some((e) => e.value.includes('Çiçekleri')))), 'yenilemeden sonra da durmalı');
      // en az 4'e kadar sil
      for (let i = 0; i < 12; i++) {
        const btns = s.page.getByRole('button', { name: s.t('wheel.editor.remove') });
        if (!(await btns.count())) break;
        await btns.first().click();
        await s.page.waitForTimeout(120);
      }
      const n = Number((await s.body()).match(countRe)[1]);
      assert.equal(n, 4, `en az 4 dilim kalmalı (şimdi ${n})`);
      await s.expectText(s.t('wheel.editor.minReached', { min: 4 }));
      await s.btn(s.t('wheel.editor.restore'));
      await s.btn(s.t('common.btn.reset'), { nth: 0 });
      await s.page.waitForTimeout(400);
      assert.ok(Number((await s.body()).match(countRe)[1]) >= 8, 'varsayılana dönünce dilim sayısı geri gelmeli');
    },
  },
  {
    id: 'F04-E6', name: 'çark sıfırla düğmesi (sağ üst): onay kutusu açılır, vazgeç kapatır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/wheel', 800);
      await s.btn(s.t('wheel.reset'));
      await s.expectText(s.t('wheel.resetTitle'));
      await s.btn(s.t('common.btn.cancel'));
      await s.expectGone(s.t('wheel.resetTitle'));
    },
  },
  {
    id: 'F05-H1', name: 'şanslı görev: kartlar karışır → bir görev çıkar → Bunu yap → Tamamlandı → +10', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 700);
      await s.btn(s.t('routine.addTask'));
      await s.tap(s.t('newtask.luckyCard.title'));
      await s.expectText(s.t('newtask.lucky.title'));
      await s.expectText(s.t('newtask.lucky.spinning'));
      await s.expectText(s.t('newtask.lucky.subtitle'), 'sonuç açılmalı', { timeout: 5000 });
      await s.shot('lucky-revealed');
      await s.btn(s.t('newtask.lucky.doIt'));
      await s.page.waitForURL(/\/action/);
      await s.btn(s.t('common.btn.done'));
      await s.expectText(s.t('routine.action.wellDone'));
      const evs = await bonusEvents(s, 'lucky');
      assert.equal(evs.length, 1);
      assert.equal(evs[0].points, 10);
    },
  },
  {
    id: 'F05-E1', name: 'şanslı görev: "Yeniden çevir" yeni bir kart verir (aynı kart art arda gelmez)', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/lucky', 500);
      await s.expectText(s.t('newtask.lucky.subtitle'), 'ilk sonuç', { timeout: 5000 });
      const read = async () => (await s.body()).split('\n').filter((l) => l.trim());
      const first = await read();
      await s.btn(s.t('newtask.lucky.again'));
      await s.expectText(s.t('newtask.lucky.spinning'));
      await s.expectText(s.t('newtask.lucky.subtitle'), 'ikinci sonuç', { timeout: 5000 });
      const second = await read();
      assert.notDeepEqual(first, second, 'yeni sonuç farklı olmalı');
    },
  },
];
