/**
 * Her rota için duman testi: sayfa açılıyor, pageerror yok, "Maximum update depth"/"getSnapshot" yok,
 * görünür metinde ham i18n anahtarı (ns.key) yok, yatay taşma yok (scrollWidth <= 390).
 * Hem TR hem EN çalışır; koyu tema ayrıca üç ana sekmede denenir.
 */
import { assert, rawKeys } from './lib.mjs';

const ROUTES = [
  ['home', '/'], ['inspire', '/inspire'], ['wheel', '/wheel'], ['tools', '/tools'], ['profile', '/profile'],
  ['new-task', '/new-task'], ['task-new', '/task/new'], ['task-edit', '/task/s1'], ['action-habit', '/action?habitId=s1'],
  ['action-bonus', '/action?bonusId=wheel:smoke1&title=Test&emoji=%F0%9F%8E%AF&points=10&group=wheel&pastel=pink&source=wheel'],
  ['lucky', '/lucky'], ['planner', '/planner'], ['streak', '/streak'], ['duel', '/duel'], ['duel-week', '/duel?period=week'], ['duel-month', '/duel?period=month'],
  ['pairing', '/pairing'], ['stats', '/stats'], ['badges', '/badges'], ['settings', '/settings'], ['wheel-edit', '/wheel-edit'],
  ['inspire-detail', '/inspire/clean-home-basics'], ['inspire-category', '/inspire/category/cleaning'], ['inspire-fav', '/inspire/favorites'],
  ['inspire-search', '/inspire/search'], ['inspire-quiz', '/inspire/quiz/morning-person'],
  ['timer', '/tools/timer'], ['drink', '/tools/drink'], ['sleep', '/tools/sleep'], ['reflection', '/tools/reflection'],
  ['meditate', '/tools/meditate'], ['workout', '/tools/workout'], ['motivation', '/tools/motivation'], ['soundscape', '/tools/soundscape'],
  ['alarm', '/tools/alarm'], ['love', '/tools/love'], ['reflection-write', '/tools/reflection-write'], ['mood', '/tools/mood'],
  ['life', '/life'], ['smoke', '/life/smoke'], ['meals', '/life/meals'], ['chores', '/life/chores'],
  ['study', '/study'], ['study-item-new', '/study/item/new'], ['growth', '/growth'], ['growth-goal-new', '/growth/goal/new'],
];

const mk = (id, name, path, opts) => ({
  id, name, opts, run: async (s) => {
    await s.goto(path, 900);
    const body = await s.body();
    assert.ok(body.trim().length > 5, `boş sayfa: ${path}`);
    assert.deepEqual(rawKeys(body), [], `ham i18n anahtarı görünür (${path})`);
    const w = await s.scrollWidth();
    assert.ok(w <= 390, `yatay taşma: scrollWidth=${w} (${path})`);
    const off = await s.overflowOffenders();
    assert.deepEqual(off, [], `taşan öğe(ler) (${path})`);
    s.assertClean();
  },
});

export default [
  ...ROUTES.flatMap(([n, p], i) => [
    mk(`SMK-${String(i + 1).padStart(2, '0')}-tr`, `duman TR ${p}`, p, { lang: 'tr' }),
    mk(`SMK-${String(i + 1).padStart(2, '0')}-en`, `duman EN ${p}`, p, { lang: 'en' }),
  ]),
  ...['/', '/inspire', '/tools', '/settings', '/life', '/study'].map((p, i) => mk(`SMK-D${i + 1}`, `duman koyu tema ${p}`, p, { lang: 'tr', theme: 'dark' })),
  mk('SMK-ONB', 'duman onboarding (ilk açılış)', '/onboarding', { lang: 'tr', seed: false }),
];
