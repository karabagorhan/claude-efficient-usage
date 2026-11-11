/** F24 Erişilebilirlik (ekran okuyucu etiketleri): etkileşimli öğelerin erişilebilir adı var mı (DOM düzeyinde; gerçek VoiceOver/TalkBack ayrıca manuel, M-11). */
import { assert, nameless } from './lib.mjs';

const SCREENS = [
  ['ana ekran', '/'], ['yeni görev', '/new-task'], ['görev düzenleyici', '/task/s1'], ['ilham şablonu', '/inspire/clean-home-basics'],
  ['su', '/tools/drink'], ['alarm', '/tools/alarm'], ['sigara', '/life/smoke'], ['okul öğesi', '/study/item/new'], ['hedef', '/growth/goal/new'],
  ['ayarlar', '/settings'], ['çark', '/wheel'], ['tez/okul', '/study'],
];

export default [
  {
    id: 'F24-A1', name: 'erişilebilirlik: ana ekranlarda tüm düğme / alan / anahtarın erişilebilir adı var (geri/kapat okları, kalp, +/- düğmeleri, anahtarlar, alanlar)', opts: { lang: 'tr' },
    knownBug: 'BUG-009 adsız ikon düğmeleri / alanlar',
    run: async (s) => {
      const report = [];
      for (const [name, p] of SCREENS) {
        await s.goto(p, 700);
        const bad = [...new Set(await nameless(s))];
        if (bad.length) report.push(`${name} (${p}): ${bad.join('; ')}`);
      }
      assert.deepEqual(report, [], 'erişilebilir adı olmayan öğeler');
    },
  },
];
