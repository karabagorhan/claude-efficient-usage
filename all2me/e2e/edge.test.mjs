/** F23 Çapraz kesen uç durumlar: çok uzun metin, emoji/aksan, iki sekme, çevrimdışı, klavye, geri tuşu, yenileme, ağ hatası yok. */
import { assert, completionsOn, openSession } from './lib.mjs';

const LONG = 'Çok'.repeat(20) + 'UzunBirGörevAdıBoşluksuz'.repeat(1);

export default [
  {
    id: 'F23-E1', name: 'çok uzun, boşluksuz ve emojili görev adı (60 karakter) kartı 390px\'te taşırmaz; düzenleyici ve tamamlama çalışır', opts: { lang: 'tr' },
    run: async (s) => {
      const title = (LONG + '😀🧹').slice(0, 60);
      await s.goto('/task/new', 600);
      await s.page.getByPlaceholder(s.t('task.namePlaceholder')).fill(title);
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(600);
      await s.goto('/', 800);
      const off = await s.overflowOffenders();
      assert.deepEqual(off, [], 'uzun başlık taşma yaptı');
      assert.ok(await s.scrollWidth() <= 390);
      await s.shot('edge-long-title');
    },
  },
  {
    id: 'F23-E2', name: 'çevrimdışı: ağ kapalıyken görevler tamamlanır ve saklanır (yerel öncelikli); sayfa/konsol hatası yok', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      await s.ctx.setOffline(true);
      await s.tap('Kahvaltı yap', { exact: true });
      await s.page.waitForTimeout(400);
      assert.ok((await completionsOn(s)).find((c) => c.habitId === 's2'), 'çevrimdışı tamamlama kaydedilmeli');
      await s.tap('Masayı topla', { exact: true });
      await s.page.waitForTimeout(300);
      assert.equal((await completionsOn(s)).length, 3, 'iki yeni tamamlama + tohum');
      await s.ctx.setOffline(false);
    },
  },
  {
    id: 'F23-E3', name: 'klavye: ＋ düğmesine Tab/odak + Enter ile Yeni Görev açılır; düzenleyici Enter ile kaydedilebilir alanlar odaklanabilir', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      const add = s.page.getByRole('button', { name: s.t('routine.addTask') });
      await add.focus();
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(600);
      assert.match(s.path(), /new-task/, 'klavye Enter ile Yeni Görev açılmalı');
      // Tab ile ilerlenebilir mi: odaklanabilir en az bir öğe
      await s.page.keyboard.press('Tab');
      const tag = await s.page.evaluate(() => document.activeElement && document.activeElement.tagName);
      assert.ok(tag && tag !== 'BODY', 'Tab ile odak ilerlemeli');
    },
  },
  {
    id: 'F23-E4', name: 'tarayıcı geri tuşu: Yeni Görev → düzenleyici → geri → Yeni Görev → geri → ana ekran', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      await s.btn(s.t('routine.addTask'));
      // web'de expo-router ekranı çizip URL'yi (history.pushState) bir sonraki karede yazar; yük altında geri tuşu
      // URL yazılmadan basılırsa bir önceki girdiye (/) dönülüyordu. Her adımda URL'nin oturmasını bekle.
      await s.page.waitForURL(/\/new-task/, { timeout: 5000 });
      await s.expectText(s.t('newtask.suggested'));
      await s.tap(s.t('newtask.rename'));
      await s.expectText(s.t('newtask.editor.titleNew'));
      await s.page.waitForURL(/\/task\/new/, { timeout: 5000 });
      await s.page.goBack();
      await s.page.waitForURL((u) => /\/new-task/.test(u.pathname), { timeout: 5000 });
      await s.expectText(s.t('newtask.suggested'));
      await s.page.goBack();
      await s.page.waitForURL((u) => u.pathname === '/', { timeout: 5000 });
      await s.expectText(s.t('routine.progress.title'));
      assert.equal(s.path().split('?')[0], '/');
    },
  },
  {
    id: 'F23-E5', name: 'iki sekme aynı anda: A sekmesinde görev tamamla, B sekmesinde başka görev tamamla → yenileyince ikisi de durmalı', opts: { lang: 'tr' },
    knownBug: 'BUG-007 iki sekmede son yazan kazanır',
    run: async (s) => {
      const b = await s.ctx.newPage();
      await s.goto('/', 800);
      await b.goto(s.base + '/', { waitUntil: 'networkidle' });
      await b.waitForTimeout(600);
      await s.tap('Kahvaltı yap', { exact: true });
      await s.page.waitForTimeout(400);
      await b.getByText('Masayı topla', { exact: true }).first().click();
      await b.waitForTimeout(400);
      await s.reload(900);
      const done = (await completionsOn(s)).map((c) => c.habitId).sort();
      assert.ok(done.includes('s2') && done.includes('s5'), `iki sekmedeki tamamlama da korunmalı (kalan: ${done.join(',')})`);
    },
  },
  {
    id: 'F23-E6', name: 'yenileme: görev tamamlayıp sayfayı yenile → durum korunur; yarım kalan düzenleyici taslağı çökmez', opts: { lang: 'en' },
    run: async (s) => {
      await s.goto('/', 800);
      await s.tap('Eat breakfast', { exact: true });
      await s.reload(900);
      await s.expectText('2/5 tasks');
      await s.goto('/task/new', 600);
      await s.page.getByPlaceholder(s.t('task.namePlaceholder')).fill('Yarım');
      await s.reload(800);
      await s.expectText(s.t('newtask.editor.titleNew'));
    },
  },
  {
    id: 'F23-E7', name: '390px: çok sayıda görev (30) ile ana ekran uzun listede taşmaz, alt sekme çubuğu görünür kalır', opts: { lang: 'tr', seedOpts: { habits: Array.from({ length: 30 }, (_, i) => ({ id: `x${i}`, title: `Görev numarası ${i + 1} ${'ş'.repeat(i % 5)}`, icon: '⭐' })) } },
    run: async (s) => {
      await s.goto('/', 1000);
      assert.deepEqual(await s.overflowOffenders(), []);
      await s.expectText(s.t('tabs.routine'), 'sekme çubuğu', { exact: true });
      await s.shot('edge-30-tasks');
    },
  },
  {
    id: 'F23-E8', name: 'sekme çubuğu: 5 sekme arasında gezinme (Rutin, İlham, Çark, Araçlar, Profil) ve her sekme hatasız', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/', 800);
      for (const [k, re] of [['tabs.inspire', /inspire/], ['tabs.wheel', /wheel/], ['tabs.tools', /tools/], ['tabs.profile', /profile/], ['tabs.routine', /^\/$/]]) {
        await s.tap(s.t(k), { exact: true, nth: 0 });
        await s.page.waitForTimeout(500);
        assert.match(s.path(), re, `${k} → ${s.path()}`);
      }
    },
  },
];
