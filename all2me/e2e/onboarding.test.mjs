/** F01 Onboarding (SPEC 3.1): dil -> profil -> sorular -> sonuç -> öneriler -> partner -> kutlama -> ana ekran. */
import { assert } from './lib.mjs';

async function runOnboarding(s, { name }) {
  await s.goto('/', 1200);
  // Korumalı rota: onboarding'e yönlenir.
  assert.match(s.path(), /onboarding/, 'onboarded olmayan kullanıcı onboarding\'e yönlenmeli');
  await s.expectText(s.t('onboarding.lang.title'), 'dil ekranı');
  await s.shot(`onb-${s.lang}-1-lang`);
  await s.btn(s.t('common.btn.next'));
  await s.expectText(s.t('onboarding.profile.title'));
  // Ad boşken Sonraki devre dışı
  const next = s.page.getByRole('button', { name: s.t('common.btn.next') });
  assert.equal(await next.isDisabled().catch(() => null) ?? (await next.getAttribute('aria-disabled')) === 'true', true, 'ad boşken ileri devre dışı olmalı');
  await s.page.getByPlaceholder(s.t('onboarding.profile.namePlaceholder')).fill(name);
  await s.tap('🦊');
  await s.btn(s.t('common.btn.next'));
  // 5-7 soru: hepsine Evet
  for (let i = 0; i < 7; i++) {
    const yes = s.page.getByRole('button', { name: s.t('onboarding.yes') });
    if (!(await yes.count())) break;
    if (i === 1) await s.btn(s.t('onboarding.no')); else await s.btn(s.t('onboarding.yes'));
    await s.page.waitForTimeout(150);
  }
  await s.expectText(s.t('onboarding.result.title'), 'sonuç ekranı');
  for (const lv of ['low', 'mid', 'high']) void lv;
  assert.ok((await s.body()).match(new RegExp(`${s.t('onboarding.result.level.low')}|${s.t('onboarding.result.level.mid')}|${s.t('onboarding.result.level.high')}`)), 'seviye etiketi');
  await s.shot(`onb-${s.lang}-2-result`);
  await s.btn(s.t('common.btn.next'));
  await s.expectText(s.t('onboarding.tasks.title'));
  // "N görevi ekle" düğmesi (görev satırları da artık rol=button; adı rakam içerebildiği için düğme adı sözlükten kurulur)
  const addN = s.t('onboarding.tasks.addN', { n: '@@' }).split('@@').map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\d+');
  await s.btn(new RegExp(`^${addN}`));
  await s.expectText(s.t('onboarding.pair.title'), 'partner ekranı');
  await s.shot(`onb-${s.lang}-3-pair`);
  await s.btn(s.t('settings.pairing.localContinue'));
  await s.expectText(s.t('onboarding.done.title'), 'kutlama');
  await s.btn(s.t('onboarding.done.cta'));
  await s.page.waitForTimeout(800);
  assert.equal(s.path().split('?')[0], '/', `ana ekrana geçmeli (şimdi ${s.path()})`);
  await s.expectText(name, 'selamda ad');
  const core = await s.store('core');
  assert.equal(core.me.name, name);
  assert.equal(core.me.emoji, '🦊');
  assert.ok(Object.keys(core.habits).length >= 1, 'başlangıç görevleri eklenmeli');
  const st = await s.store('settings');
  assert.equal(st.onboarded, true);
  assert.equal(st.lang, s.lang);
  await s.shot(`onb-${s.lang}-4-home`);
}

export default [
  { id: 'F01-H1-tr', name: 'onboarding tam akış (TR)', opts: { lang: 'tr', seed: false }, run: (s) => runOnboarding(s, { name: 'Ayşe' }) },
  { id: 'F01-H1-en', name: 'onboarding tam akış (EN)', opts: { lang: 'en', seed: false }, run: (s) => runOnboarding(s, { name: 'Sam' }) },
  {
    id: 'F01-E1', name: 'onboarding: dil değişince metin hemen değişir, geri tuşu çalışır', opts: { lang: 'tr', seed: false },
    run: async (s, env) => {
      await s.goto('/', 1000);
      const en = (await import('./lib.mjs')).translator(env.dict, 'en');
      await s.tap('English');
      await s.expectText(en('onboarding.lang.title'));
      await s.btn(en('common.btn.next'));
      await s.expectText(en('onboarding.profile.title'));
      await s.btn(en('common.btn.back'));
      await s.expectText(en('onboarding.lang.title'));
    },
  },
  {
    id: 'F01-E2', name: 'onboarding: ad yalnız boşluksa devam edilemez; çok uzun ad kısıtlanır (maxLength 24)', opts: { lang: 'tr', seed: false },
    run: async (s) => {
      await s.goto('/', 800);
      await s.btn(s.t('common.btn.next'));
      const f = s.page.getByPlaceholder(s.t('onboarding.profile.namePlaceholder'));
      await f.fill('     ');
      const next = s.page.getByRole('button', { name: s.t('common.btn.next') });
      assert.equal((await next.getAttribute('aria-disabled')) === 'true' || (await next.isDisabled()), true, 'boşluk adı kabul edilmemeli');
      await f.fill('Çok Uzun Bir İsim '.repeat(5));
      const v = await f.inputValue();
      assert.ok(v.length <= 24, `ad uzunluğu ${v.length}`);
    },
  },
];
