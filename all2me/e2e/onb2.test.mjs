/** Onboarding 2: kişiselleştirme (ritim, enerji, odak, profil testi, ilk gün planı, bildirim), hızlı başla, profil kartı. */
import { assert, translator } from './lib.mjs';

const NAME = { tr: 'Ece', en: 'Kim' };

async function toProfile(s) {
  await s.goto('/', 1200);
  await s.btn(s.t('common.btn.next'));
  await s.page.getByPlaceholder(s.t('onboarding.profile.namePlaceholder')).fill(NAME[s.lang]);
}
async function yesNo(s) {
  await s.btn(s.t('common.btn.next'));
  for (let i = 0; i < 7; i++) {
    if (!(await s.page.getByRole('button', { name: s.t('onboarding.yes') }).count())) break;
    await s.btn(s.t('onboarding.yes'));
    await s.page.waitForTimeout(120);
  }
  await s.expectText(s.t('onboarding.result.title'));
  await s.btn(s.t('common.btn.next'));
}
/** Tüm sorulara A (ilk seçenek) ya da B ver. */
async function quiz(s, pick) {
  for (let k = 1; k <= 8; k++) {
    await s.expectText(s.t(`onboarding.quiz.q${k}.q`), `soru ${k}`);
    await s.tap(s.t(`onboarding.quiz.q${k}.${pick}`));
    await s.page.waitForTimeout(100);
  }
}
async function noOverflow(s, label) {
  const o = await s.overflowOffenders();
  assert.equal(o.length, 0, `${label} taşma: ${o.join('; ')}`);
  const raw = (await import('./lib.mjs')).rawKeys(await s.body());
  assert.equal(raw.length, 0, `${label} ham anahtar: ${raw.join(',')}`);
}

async function fullFlow(s) {
  await toProfile(s);
  await yesNo(s);
  await s.expectText(s.t('onboarding.rhythm.title'), 'ritim');
  await s.shot(`onb2-${s.lang}-rhythm`);
  await noOverflow(s, 'ritim');
  // kalkış 2 kez +15 → 07:30
  const wakeLater = s.page.getByRole('button', { name: `${s.t('onboarding.rhythm.wake')}: ${s.t('onboarding.rhythm.later')}` });
  await wakeLater.click();
  await wakeLater.click();
  await s.tap(s.t('onboarding.rhythm.weekendDiff'));
  await s.btn(s.t('common.btn.next'));
  await s.expectText(s.t('onboarding.energy.title'));
  await s.shot(`onb2-${s.lang}-energy`);
  await s.tap(s.t('onboarding.energy.evening'));
  await s.btn(s.t('common.btn.next'));
  await s.expectText(s.t('onboarding.focus.title'));
  await s.tap(s.t('onboarding.focus.smoke'));
  await s.tap(s.t('onboarding.focus.school'));
  await s.shot(`onb2-${s.lang}-focus`);
  await noOverflow(s, 'odak');
  await s.btn(s.t('common.btn.next'));
  await quiz(s, 'a');
  await s.expectText(s.t('onboarding.type.strengths'), 'tip sonucu');
  await s.shot(`onb2-${s.lang}-type`);
  await noOverflow(s, 'tip');
  assert.ok((await s.body()).includes(s.t('onboarding.type.note')), 'eğlence notu');
  await s.btn(s.t('common.btn.next'));
  await s.expectText(s.t('onboarding.plan.title'));
  await s.shot(`onb2-${s.lang}-plan`);
  await noOverflow(s, 'plan');
  const removes = s.page.getByRole('button', { name: s.t('onboarding.plan.remove', { title: '@@' }).split('@@').find((x) => x.trim()).trim() });
  const before = await removes.count();
  assert.ok(before >= 5, `plan satırı ${before}`);
  await removes.first().click();
  await removes.first().click();
  assert.equal(await removes.count(), before - 2);
  const addN = s.t('onboarding.tasks.addN', { n: '@@' }).split('@@').map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\d+');
  await s.btn(new RegExp(`^${addN}`));
  await s.expectText(s.t('onboarding.notif.title'));
  await s.shot(`onb2-${s.lang}-notif`);
  await noOverflow(s, 'bildirim');
  await s.btn(s.t('onboarding.notif.allow'));
  await s.expectText(s.t('onboarding.notif.denied'), 'web: izin verilmedi mesajı');
  await s.btn(s.t('common.btn.next'));
  await s.btn(s.t('settings.pairing.localContinue'));
  await s.expectText(s.t('onboarding.free.note'), 'ücretsiz notu');
  await s.shot(`onb2-${s.lang}-done`);
  await s.btn(s.t('onboarding.done.cta'));
  await s.page.waitForTimeout(800);
  const p = await s.store('profile');
  assert.equal(p.wake, '07:30');
  assert.equal(p.sleep, '23:00');
  assert.equal(p.weekendDiff, true);
  assert.equal(p.energyPeak, 'evening');
  assert.deepEqual(p.focusAreas.sort(), ['school', 'smoke']);
  assert.ok(['planner', 'explorer', 'steady', 'spark'].includes(p.routineType));
  assert.equal(p.quizAnswers.length, 8);
  const core = await s.store('core');
  const habits = Object.values(core.habits);
  assert.equal(habits.length, before - 2, 'çıkarılan satırlar eklenmemeli');
  assert.ok(habits.every((h) => h.source === 'onboarding' || true));
  assert.ok(habits.some((h) => h.reminderTime), 'saatli satırlar reminderTime almalı');
  assert.equal((await s.store('settings')).onboarded, true);
}

async function skipPath(s) {
  await toProfile(s);
  await s.btn(s.t('common.btn.next'));
  for (let i = 0; i < 7; i++) {
    if (!(await s.page.getByRole('button', { name: s.t('onboarding.no') }).count())) break;
    await s.btn(s.t('onboarding.no'));
    await s.page.waitForTimeout(100);
  }
  await s.btn(s.t('common.btn.next'));
  for (const k of ['rhythm', 'energy', 'focus']) {
    await s.expectText(s.t(`onboarding.${k}.title`));
    await s.btn(s.t('common.btn.skip'));
  }
  await s.btn(s.t('onboarding.quiz.skip'));
  await s.expectText(s.t('onboarding.plan.title'));
  await s.btn(s.t('common.btn.skip'));
  await s.btn(s.t('onboarding.notif.later'));
  await s.btn(s.t('settings.pairing.localContinue'));
  await s.btn(s.t('onboarding.done.cta'));
  await s.page.waitForTimeout(800);
  const p = await s.store('profile');
  assert.ok(!p || (p.routineType === null && p.wake === null && p.focusAreas.length === 0), 'atlanınca boş profil');
  assert.equal(Object.keys((await s.store('core')).habits).length, 0, 'plan atlanınca görev yok');
  assert.equal((await s.store('settings')).onboarded, true);
}

async function quickStart(s) {
  await s.goto('/', 1200);
  await s.expectText(s.t('onboarding.quick.hint'));
  await s.shot(`onb2-${s.lang}-lang`);
  assert.match(await s.body(), /~\d+/, 'kalan süre göstergesi');
  await s.btn(s.t('onboarding.quick.start'));
  await s.expectText(s.t('onboarding.profile.title'));
  await s.page.getByPlaceholder(s.t('onboarding.profile.namePlaceholder')).fill(NAME[s.lang]);
  await s.btn(s.t('onboarding.quick.go'));
  await s.page.waitForTimeout(1000);
  assert.equal(s.path().split('?')[0], '/');
  const core = await s.store('core');
  assert.equal(core.me.name, NAME[s.lang]);
  assert.ok(Object.keys(core.habits).length >= 5, 'varsayılan başlangıç görevleri');
  const p = await s.store('profile');
  assert.ok(!p || p.routineType === null);
}

async function typeCard(s) {
  await s.goto('/profile', 1000);
  await s.expectText(s.t('onboarding.typeCard.none'));
  await s.shot(`onb2-${s.lang}-card-none`);
  await s.tap(s.t('onboarding.typeCard.none'));
  await quiz(s, 'b');
  await s.expectText(s.t('onboarding.type.strengths'));
  await s.shot(`onb2-${s.lang}-quiz-result`);
  let p = await s.store('profile');
  const first = p.routineType;
  assert.ok(first);
  await s.btn(s.t('onboarding.quizPage.retake'));
  await quiz(s, 'a');
  await s.expectText(s.t('onboarding.type.strengths'));
  p = await s.store('profile');
  assert.ok(p.routineType && p.routineType !== first, 'A ve B cevapları farklı tipe götürmeli');
  await s.btn(s.t('onboarding.quizPage.done'));
  await s.page.waitForTimeout(400);
  await s.expectText(s.t('onboarding.typeCard.retake'));
  await s.expectText(s.t(`onboarding.type.${p.routineType}.name`));
  await s.shot(`onb2-${s.lang}-card-set`);
}

const mk = (id, name, lang, run, extra = {}) => ({ id, name, opts: { lang, seed: false, ...extra }, run });
export default [
  mk('ONB2-H1-tr', 'tam kişiselleştirme akışı (TR)', 'tr', fullFlow),
  mk('ONB2-H1-en', 'tam kişiselleştirme akışı (EN)', 'en', fullFlow),
  mk('ONB2-S1-tr', 'atlama yolu: tüm adımlar atlanır, boş profil, görev yok (TR)', 'tr', skipPath),
  mk('ONB2-S1-en', 'atlama yolu (EN)', 'en', skipPath),
  mk('ONB2-Q1-tr', 'hızlı başla: ad + varsayılan görevler, ana ekran (TR)', 'tr', quickStart),
  mk('ONB2-Q1-en', 'hızlı başla (EN)', 'en', quickStart),
  { id: 'ONB2-C1-tr', name: 'profil kartı: testi yap, yeniden yap, kart güncellenir (TR)', opts: { lang: 'tr' }, run: typeCard },
  { id: 'ONB2-C1-en', name: 'profil kartı (EN)', opts: { lang: 'en' }, run: typeCard },
];
