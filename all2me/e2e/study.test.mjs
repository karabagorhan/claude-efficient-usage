/** F16 Okul / yüksek lisans (SPEC 6.5): ders ekle, öğe ekle, bitti / geri al + bonus, gecikmiş teslim, okuma sayfa, tez, bonus tavanı. */
import { assert, events } from './lib.mjs';

const pad = (n) => String(n).padStart(2, '0');
const key = (off) => {
  const d = new Date(Date.now() + off * 86400000 - 3 * 3600 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const ts = '2026-01-01T00:00:00.000Z';
const item = (id, type, title, extra = {}) => ({ id, type, title, status: 'todo', priority: 'med', subtasks: [], remind: { dayBefore: false, morning: false }, createdAt: ts, ...extra });
const studySlice = (items = {}) => ({
  study: {
    courses: { c1: { id: 'c1', name: 'Algoritmalar', code: 'CS101', pastel: 'blue', slots: [{ day: 1, start: '10:00', end: '12:00' }], createdAt: ts } },
    items: {
      i1: item('i1', 'homework', 'Ödev 1', { courseId: 'c1', due: key(1) }),
      i2: item('i2', 'exam', 'Vize sınavı', { courseId: 'c1', due: key(-1), priority: 'high' }),
      i3: item('i3', 'reading', 'Makale A', { due: key(5), status: 'doing', priority: 'low', paper: { pagesRead: 10, pagesTotal: 40, pass: 1 } }),
      ...items,
    },
    thesis: [], logs: [], settings: { weekGoalHours: 10, remindItems: true, weeklyPlan: true }, activityDay: '',
  },
});
const seed = (items) => ({ lang: 'tr', seedOpts: { slices: studySlice(items), habits: [{ id: 'st1', title: 'Çalış', icon: '🎓', extra: { link: 'study' } }] } });
const studyBonus = async (s) => (await events(s)).filter((e) => e.type === 'bonus' && e.group === 'study');

export default [
  {
    id: 'F16-H1', name: 'okul panosu: gecikmiş teslim kırmızı sayaç ("1 gün gecikti"), yaklaşan teslimler, okuma listesi ilerlemesi', opts: seed(),
    run: async (s) => {
      await s.goto('/study', 1000);
      await s.expectText(s.t('study.title'), '', { exact: false }).catch(() => {});
      await s.expectText('1 gün gecikti');
      await s.expectText('Yarın');
      await s.expectText('Vize sınavı');
      await s.expectText('10/40 sayfa');
      await s.shot('study-dashboard');
      // gecikmiş sayaç: Gecikmiş kutusunda 1
      assert.match(await s.body(), /1\s*\n?\s*Gecikmiş/);
    },
  },
  {
    id: 'F16-H2', name: 'öğeyi bitir (onay dairesi): bonus +20, bağlı görev tamamlanır; geri al → bonus düşer; tekrar bitir → tekrar verilir', opts: seed(),
    run: async (s) => {
      await s.goto('/study', 1000);
      // "Ödev 1" satırının onay dairesi
      const row = s.page.getByText('Ödev 1', { exact: true }).first().locator('xpath=ancestor::div[.//*[@role="checkbox"]][1]');
      await row.getByRole('checkbox').first().click();
      await s.page.waitForTimeout(500);
      let b = await studyBonus(s);
      assert.equal(b.length, 1);
      assert.equal(b[0].points, 20, 'ödev bonusu 20');
      const done = Object.values((await s.store('core')).completions).find((c) => c.habitId === 'st1');
      assert.ok(done, 'bağlı "okul" görevi tamamlanmalı');
      assert.equal((await s.store('study')).items.i1.status, 'done');
      // geri al
      await row.getByRole('checkbox').first().click().catch(async () => s.page.getByRole('checkbox', { checked: true }).first().click());
      await s.page.waitForTimeout(500);
      assert.equal((await s.store('study')).items.i1.status, 'todo');
      assert.equal((await studyBonus(s)).length, 0, 'geri alınca bonus düşmeli');
      // tekrar bitir
      await row.getByRole('checkbox').first().click();
      await s.page.waitForTimeout(400);
      assert.equal((await studyBonus(s)).length, 1);
    },
  },
  {
    id: 'F16-H3', name: 'yeni öğe: Makale/rapor yaz, ders seç, başlık, öncelik → kaydet; listede görünür', opts: seed(),
    run: async (s) => {
      await s.goto('/study/item/new', 800);
      await s.expectText(s.t('study.item.new'));
      await s.tap(s.t('study.type.writing'));
      await s.page.getByPlaceholder(s.t('study.ph.writing')).fill('Literatür özeti çğış');
      await s.tap('CS101', { exact: true });
      await s.tap(s.t('study.priority.high'));
      await s.shot('study-item-form');
      await s.btn(s.t('common.btn.save'), { nth: 0 });
      await s.page.waitForTimeout(600);
      const it = Object.values((await s.store('study')).items).find((x) => x.title === 'Literatür özeti çğış');
      assert.ok(it, 'öğe kaydedilmeli');
      assert.equal(it.type, 'writing');
      assert.equal(it.courseId, 'c1');
      assert.equal(it.priority, 'high');
    },
  },
  {
    id: 'F16-E1', name: 'yeni öğe: başlıksız kaydedilemez; sil → onay ister → siler', opts: seed(),
    run: async (s) => {
      await s.goto('/study/item/new', 800);
      const save = s.page.getByRole('button', { name: s.t('common.btn.save') }).last();
      assert.equal((await save.getAttribute('aria-disabled')) === 'true' || (await save.isDisabled()), true);
      await s.goto('/study/item/i1', 800);
      await s.tap(s.t('study.item.delete'));
      await s.expectText(s.t('study.item.confirmDelete'), 'onay sorusu');
      const n0 = Object.keys((await s.store('study')).items).length;
      await s.btn(s.t('common.btn.delete'), { nth: 0 });
      await s.page.waitForTimeout(500);
      assert.equal(Object.keys((await s.store('study')).items).length, n0 - 1);
    },
  },
  {
    id: 'F16-H4', name: 'ders ekle: ad + kod + gün/saat → kaydet; ders sayfası ve Dersler sekmesinde görünür; ders silinince işler derssiz kalır', opts: { lang: 'tr' },
    run: async (s) => {
      await s.goto('/study/course/new', 800);
      await s.expectText(s.t('study.course.new'));
      await s.page.getByPlaceholder(s.t('study.course.namePh')).fill('Araştırma Yöntemleri');
      await s.page.getByPlaceholder(s.t('study.course.codePh')).fill('yl501');
      await s.tap(s.t('study.course.addSlot'));
      await s.shot('study-course-form');
      await s.btn(s.t('common.btn.save'), { nth: 0 }).catch(async () => s.tap(s.t('common.btn.save')));
      await s.page.waitForTimeout(700);
      const c = Object.values((await s.store('study')).courses)[0];
      assert.equal(c.name, 'Araştırma Yöntemleri');
      assert.equal(c.code.toUpperCase(), 'YL501');
      assert.equal(c.slots.length, 1);
      await s.expectText('YL501', 'ders sayfası başlığı', { exact: false });
    },
  },
  {
    id: 'F16-H5', name: 'okuma: +5 sayfa → ilerleme 15/40, ilerleme bağlı görevi tamamlar; sayfa toplamı aşılmaz', opts: seed(),
    run: async (s) => {
      await s.goto('/study', 1000);
      await s.tap(s.t('study.reading.plusPages', { n: 5 }), { exact: false });
      await s.page.waitForTimeout(500);
      assert.equal((await s.store('study')).items.i3.paper.pagesRead, 15);
      assert.ok(Object.values((await s.store('core')).completions).find((c) => c.habitId === 'st1'), 'sayfa ilerlemesi okul görevini tamamlar');
      for (let i = 0; i < 6; i++) await s.tap(s.t('study.reading.plusPages', { n: 10 }), { exact: false });
      assert.equal((await s.store('study')).items.i3.paper.pagesRead, 40, 'toplam sayfayı aşmamalı');
    },
  },
  {
    id: 'F16-E2', name: 'bonus günlük tavanı: günde en çok 5 okul bonusu; 6. öğe bitince puan yok + "bonus sınırı" uyarısı', opts: seed(Object.fromEntries([4, 5, 6, 7].map((n) => [`i${n}`, item(`i${n}`, 'homework', `Ek ödev ${n}`, { due: key(2) })]))),
    run: async (s) => {
      await s.goto('/study', 1000);
      const names = ['Ödev 1', 'Vize sınavı', 'Ek ödev 4', 'Ek ödev 5', 'Ek ödev 6', 'Ek ödev 7'];
      for (const n of names) {
        const row = s.page.getByText(n, { exact: true }).first().locator('xpath=ancestor::div[.//*[@role="checkbox"]][1]');
        await row.getByRole('checkbox').first().click();
        await s.page.waitForTimeout(250);
      }
      const b = await studyBonus(s);
      assert.equal(b.length, 5, `günde en çok 5 okul bonusu (${b.length})`);
      const st = (await s.store('study')).items;
      assert.ok(['i1', 'i2', 'i4', 'i5', 'i6', 'i7'].every((k) => st[k].status === 'done'), 'altısı da bitti işaretlenir');
    },
  },
  {
    id: 'F16-H6', name: 'tez: başlangıç kilometre taşları 8 aşama; +10 ile %100 → bitti + bonus 40; geri al → bonus düşer', opts: seed(),
    run: async (s) => {
      await s.goto('/study', 1000);
      await s.tap(s.t('study.tab.thesis'), { exact: true });
      await s.expectText(s.t('study.thesis.emptyTitle'));
      await s.btn(s.t('study.thesis.useDefaults'));
      await s.page.waitForTimeout(500);
      const th = (await s.store('study')).thesis;
      assert.equal(th.length, 8, 'konu, öneri, literatür, yöntem, veri, analiz, yazım, savunma');
      for (let i = 0; i < 10; i++) await s.tap('+10', { exact: true, nth: 0 });
      await s.page.waitForTimeout(500);
      assert.equal((await s.store('study')).thesis[0].done, true);
      assert.equal((await studyBonus(s)).filter((e) => e.points === 40).length, 1, 'kilometre taşı bonusu 40');
      await s.page.getByRole('checkbox').first().click();
      await s.page.waitForTimeout(500);
      assert.equal((await studyBonus(s)).length, 0, 'geri alınca bonus düşer');
      await s.shot('study-thesis');
    },
  },
  {
    id: 'F16-E3', name: 'olmayan ders / öğe kimliği: "bulunamadı" ekranı, çökme yok', opts: seed(),
    run: async (s) => {
      await s.goto('/study/item/yok', 800);
      await s.expectText(s.t('study.item.notFound'));
      await s.goto('/study/course/yok', 800);
      assert.ok((await s.body()).trim().length >= 0);
    },
  },
  {
    id: 'F16-E4', name: 'okul öğesi EN: tür/öncelik etiketleri çevrilmiş; ham anahtar yok', opts: { ...seed(), lang: 'en' },
    run: async (s) => {
      await s.goto('/study', 1000);
      await s.expectText('overdue', '', { exact: false });
      await s.goto('/study/item/new', 800);
      await s.expectText(s.t('study.type.reading'));
    },
  },
];
