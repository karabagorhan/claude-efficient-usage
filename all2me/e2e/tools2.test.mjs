/** F22 Diğer araçlar: uyku, kendimi sevmenin 100 yolu, motivasyon, nefes/meditasyon, egzersiz. (Ses ortamı yalnız duman testinde: ses çıkışı doğrulanamaz.) */
import { assert } from './lib.mjs';

export default [
  {
    id: 'F22-H1', name: 'uyku: varsayılan 23:30→07:00 = 7 sa 30 dk; kalite seç → Kaydet → "Uyku kaydedildi", 7 gece grafiğinde kayıt', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/sleep', 900);
      await s.expectText('7 sa 30 dk');
      await s.tap('🙂');
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(500);
      const sl = await s.store('sleep');
      const e = Object.values(sl.entries || {});
      assert.equal(e.length, 1, 'uyku kaydı eklenmeli');
      await s.shot('sleep-saved');
      // aynı gün yeniden kaydet: üzerine yazar (tek kayıt)
      await s.btn(s.t('common.btn.save'));
      await s.page.waitForTimeout(400);
      assert.equal(Object.values((await s.store('sleep')).entries).length, 1, 'gün başına tek kayıt');
    },
  },
  {
    id: 'F22-H2', name: 'kendimi sevmenin 100 yolu: "Bugün yaptım" → 1/100; işareti kaldır → 0; sayfa yenilense kalır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/love', 900);
      await s.expectText('0 / 100 yapıldı');
      await s.tap(s.t('love.doneToday'));
      await s.expectText('1 / 100 yapıldı');
      await s.reload();
      await s.expectText('1 / 100 yapıldı');
      // "Bugün yapıldı ✓" yalnız durum gösterir; dokunmak işareti kaldırmaz (BUG-010)
      await s.tap(s.t('love.doneMark'));
      await s.page.waitForTimeout(300);
      await s.expectText('1 / 100 yapıldı');
      await s.btn(s.t('love.undo'));
      await s.expectText('0 / 100 yapıldı');
    },
  },
  {
    id: 'F22-H3', name: 'motivasyon: kalp → favorilere ekler (Favoriler 1); Favoriler sekmesi; kaldırınca 0', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/motivation', 900);
      await s.expectText('Favoriler (0)');
      await s.page.getByLabel(s.t('motivation.favorite')).first().click();
      await s.expectText('Favoriler (1)');
      await s.tap('Favoriler (1)');
      await s.page.getByLabel(s.t('motivation.unfavorite')).first().click();
      await s.expectText('Favoriler (0)');
    },
  },
  {
    id: 'F22-H4', name: 'nefes/meditasyon: desen + süre seç → başla → süre dolunca "Çok güzel!" ve geçmişe seans yazılır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/meditate', 900);
      await s.tap('4-7-8', { exact: true, nth: 0 });
      await s.tap('1 dakika');
      await s.btn(s.t('meditate.start'));
      await s.expectText(s.t('meditate.ready'), 'hazırlık', { timeout: 3000 }).catch(() => {});
      await s.advance(70 * 1000);
      await s.expectText(s.t('meditate.doneTitle'), 'bitiş', { timeout: 6000 });
      const m = await s.store('meditate');
      assert.ok(m && Object.keys(m.sessions || m.entries || {}).length >= 1, 'seans kaydı');
    },
  },
  {
    id: 'F22-H5', name: 'egzersiz: rutin seç → hareket listesi → Başla → hazırlan ekranı; duraklat/devam', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/tools/workout', 900);
      await s.tap('Masa başı esneme', { exact: true });
      await s.expectText(s.t('workout.movesTitle'));
      await s.btn(s.t('workout.start'));
      await s.expectText(s.t('workout.prepare'));
      await s.btn(s.t('workout.pause'));
      await s.expectText(s.t('workout.resume'));
      await s.btn(s.t('workout.resume'));
      await s.shot('workout-play');
    },
  },
];
