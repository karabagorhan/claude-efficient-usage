/** Okul + gelişim saf hesaplamaları. Çalıştır: npx tsx tests/study.test.ts */
import assert from 'node:assert/strict';
import {
  countdown,
  dailyStudyMinutes,
  dayDiff,
  dueThisWeekCount,
  itemProgress,
  overdueCount,
  reminderTimes,
  studyMinutes,
  upcoming,
  weekLoad,
} from '../src/features/study/calc';
import type { StudyItem } from '../src/features/study/types';
import { applyCarry, avgProgress, carryOverSuggestion, goalPercent, goalProgress, isGoalComplete, top3Done } from '../src/features/growth/calc';
import type { Goal, TopTask } from '../src/features/growth/types';

const TODAY = '2026-11-11'; // Çarşamba; hafta 09-15 Kasım
const it = (id: string, over: Partial<StudyItem> = {}): StudyItem => ({
  id,
  type: 'homework',
  title: id,
  status: 'todo',
  priority: 'med',
  subtasks: [],
  remind: { dayBefore: true, morning: true },
  createdAt: '2026-11-01T10:00:00.000Z',
  ...over,
});

// ---- geri sayım ----
const noon = new Date(2026, 10, 11, 12, 0);
assert.equal(dayDiff('2026-11-11', '2026-11-14'), 3);
assert.equal(dayDiff('2026-12-31', '2027-01-01'), 1);
assert.deepEqual(countdown(undefined, undefined, TODAY, noon), { key: 'study.cd.noDate', tone: 'none', days: null });
assert.equal(countdown('2026-11-14', undefined, TODAY, noon).key, 'study.cd.days');
assert.deepEqual(countdown('2026-11-14', undefined, TODAY, noon).params, { n: 3 });
assert.equal(countdown('2026-11-14', undefined, TODAY, noon).tone, 'soon');
assert.equal(countdown('2026-11-30', undefined, TODAY, noon).tone, 'later');
assert.equal(countdown('2026-11-12', undefined, TODAY, noon).key, 'study.cd.tomorrow');
assert.equal(countdown('2026-11-12', '10:00', TODAY, noon).key, 'study.cd.tomorrowAt');
assert.deepEqual(countdown('2026-11-11', undefined, TODAY, noon).params, { time: '23:59' });
assert.equal(countdown('2026-11-11', undefined, TODAY, noon).tone, 'today');
assert.equal(countdown('2026-11-11', '18:00', TODAY, noon).key, 'study.cd.today');
assert.equal(countdown('2026-11-11', '10:00', TODAY, noon).key, 'study.cd.passed');
assert.equal(countdown('2026-11-11', '10:00', TODAY, noon).tone, 'overdue');
assert.equal(countdown('2026-11-10', undefined, TODAY, noon).key, 'study.cd.overdue1');
assert.deepEqual(countdown('2026-11-09', undefined, TODAY, noon).params, { n: 2 });
assert.equal(countdown('2026-11-09', undefined, TODAY, noon).key, 'study.cd.overdue');

// ---- ilerleme, yük, sayımlar ----
const items: StudyItem[] = [
  it('late', { due: '2026-11-09', estHours: 2 }),
  it('today', { due: '2026-11-11', estHours: 3, subtasks: [{ id: 'a', title: 'a', done: true }, { id: 'b', title: 'b', done: false }] }),
  it('sun', { due: '2026-11-15', estHours: 4, priority: 'high' }),
  it('next', { due: '2026-11-16', estHours: 10 }),
  it('done', { due: '2026-11-12', estHours: 5, status: 'done' }),
  it('nodate', { estHours: 1 }),
  it('paper', { type: 'reading', due: '2026-11-13', estHours: 2, paper: { pagesRead: 5, pagesTotal: 20, pass: 1 } }),
];
assert.equal(itemProgress(items[1]), 0.5);
assert.equal(itemProgress(items[4]), 1);
assert.equal(itemProgress(items[6]), 0.25);
assert.equal(overdueCount(items, TODAY), 1);
assert.equal(dueThisWeekCount(items, TODAY), 3); // today, sun, paper
// yük: late 2 + today 1.5 + sun 4 + paper 1.5 = 9
assert.deepEqual(weekLoad(items, TODAY), { hours: 9, count: 4 });
assert.deepEqual(
  upcoming(items).map((x) => x.id),
  ['late', 'today', 'paper', 'sun', 'next', 'nodate'],
);
assert.deepEqual(upcoming(items, 2).map((x) => x.id), ['late', 'today']);

// ---- çalışma süresi ----
const logs = [
  { id: 'l1', dayKey: '2026-11-10', minutes: 30, tag: 'lesson' as const },
  { id: 'l2', dayKey: '2026-11-01', minutes: 99, tag: 'lesson' as const },
];
assert.equal(studyMinutes({ focus: 50, lesson: 20, homework: 10, article: 5, work: 40 }, logs, '2026-11-09', '2026-11-15'), 65);
assert.deepEqual(
  dailyStudyMinutes(
    [
      { dayKey: '2026-11-09', minutes: 25, tag: 'homework' },
      { dayKey: '2026-11-09', minutes: 25, tag: 'work' },
      { dayKey: '2026-11-11', minutes: 12.4, tag: 'article' },
    ],
    logs,
    ['2026-11-09', '2026-11-10', '2026-11-11'],
  ),
  [25, 30, 12],
);

// ---- hatırlatıcı anları ----
const r1 = reminderTimes(it('r', { due: '2026-11-13' }), new Date(2026, 10, 11, 12));
assert.equal(r1.length, 2);
assert.equal(r1[0].date.getDate(), 12);
assert.equal(r1[0].date.getHours(), 9);
assert.equal(r1[1].date.getDate(), 13);
// geçmiş tetikleyici kurulmaz
assert.equal(reminderTimes(it('r', { due: '2026-11-12' }), new Date(2026, 10, 12, 10)).length, 0);
assert.equal(reminderTimes(it('r', { due: '2026-11-13', status: 'submitted' }), noon).length, 0);
assert.equal(reminderTimes(it('r', { due: '2026-11-13', remind: { dayBefore: false, morning: false } }), noon).length, 0);
const r2 = reminderTimes(it('r', { due: '2026-11-13', time: '14:00' }), noon);
assert.equal(r2[0].date.getHours(), 14); // 24 saat önce

// ---- hedef ilerlemesi ----
const goal = (over: Partial<Goal>): Goal => ({
  id: 'g',
  title: 'g',
  area: 'career',
  measure: 'number',
  milestones: [],
  checkins: [],
  createdAt: '',
  ...over,
});
assert.equal(goalPercent(goal({ startValue: 0, targetValue: 12, current: 3 })), 25);
assert.equal(goalPercent(goal({ startValue: 80, targetValue: 70, current: 75 })), 50); // azaltma hedefi
assert.equal(goalProgress(goal({ startValue: 0, targetValue: 10, current: 15 })), 1);
assert.equal(isGoalComplete(goal({ startValue: 0, targetValue: 10, current: 10 })), true);
assert.equal(isGoalComplete(goal({ startValue: 0, targetValue: 0, current: 0 })), false);
const ms = goal({ measure: 'milestones', milestones: [{ id: '1', title: 'a', done: true }, { id: '2', title: 'b', done: false }, { id: '3', title: 'c', done: false }, { id: '4', title: 'd', done: true }] });
assert.equal(goalPercent(ms), 50);
assert.equal(isGoalComplete(ms), false);
assert.equal(avgProgress([goal({ startValue: 0, targetValue: 4, current: 1 }), ms]), 0.375);
assert.equal(avgProgress([]), 0);

// ---- 3 önemli iş ve taşıma ----
const T = (id: string, title: string, done = false): TopTask => ({ id, title, done });
assert.deepEqual(top3Done([T('1', 'a', true), T('2', 'b', true)]), { done: 2, total: 2, all: false }); // üç iş gerekli
assert.deepEqual(top3Done([T('1', 'a', true), T('2', 'b', true), T('3', 'c', true)]), { done: 3, total: 3, all: true });
assert.deepEqual(top3Done(undefined), { done: 0, total: 0, all: false });
const tops: Record<string, TopTask[]> = {
  '2026-11-08': [T('o', 'eski', false)],
  '2026-11-10': [T('a', 'Rapor', true), T('b', 'Sunum', false), T('c', 'E-posta', false)],
  [TODAY]: [T('d', 'sunum ', false)],
};
const sugg = carryOverSuggestion(tops, TODAY);
assert.ok(sugg);
assert.equal(sugg!.from, '2026-11-10');
assert.deepEqual(sugg!.items.map((x) => x.title), ['E-posta']); // "Sunum" bugün zaten var
let n = 0;
const after = applyCarry(tops, TODAY, sugg!, () => `n${++n}`);
assert.deepEqual(after[TODAY].map((x) => [x.title, x.from ?? null]), [['sunum ', null], ['E-posta', '2026-11-10']]);
assert.equal(after['2026-11-10'].length, 3); // kaynak bozulmaz
// bugün dolu → öneri yok; en yakın gün temiz kapanmışsa → öneri yok
assert.equal(carryOverSuggestion({ ...tops, [TODAY]: [T('1', 'x'), T('2', 'y'), T('3', 'z')] }, TODAY), null);
assert.equal(carryOverSuggestion({ '2026-11-10': [T('a', 'a', true)], '2026-11-08': [T('o', 'o')] }, TODAY), null);
// en çok boş yer kadar
assert.equal(carryOverSuggestion({ '2026-11-10': [T('a', '1'), T('b', '2'), T('c', '3')], [TODAY]: [T('x', 'x')] }, TODAY)!.items.length, 2);

console.log('study.test.ts: tüm testler geçti ✓');
