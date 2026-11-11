/** Haftalık rapor saf hesaplamaları. Çalıştır: npx tsx tests/report.test.ts */
import assert from 'node:assert/strict';
import { addDays, dayKeyOf } from '../src/engine/dates';
import type { Completion, Habit } from '../src/engine/types';
import {
  buildDayFacts,
  compare,
  firstDataDay,
  isEmptyData,
  num,
  shiftWeek,
  weekComparison,
  weekDaysOf,
  weekEndOf,
  weekStartOf,
  weekStats,
  type ReportData,
} from '../src/features/report/calc';
import {
  insightsFromFacts,
  interestScore,
  MAX_INSIGHTS,
  MIN_DAYS,
  splitCompare,
  suggestions,
  windowDays,
} from '../src/features/report/insights';

const TODAY = '2026-11-11'; // Çarşamba; hafta 09-15 Kasım
const ME = 'me';

const habit = (id: string, slot: Habit['slot'], over: Partial<Habit> = {}): Habit => ({
  id, ownerId: ME, title: id, icon: '✅', slot, pastel: 'blue', difficulty: 'easy', kind: 'check',
  schedule: { days: [] }, isPrivate: false, together: false, createdAt: '2026-01-01T00:00:00.000Z', archived: false, ...over,
});
const comp = (h: string, day: string, userId = ME, pts = 10): Completion => ({
  id: `c:${h}:${day}`, habitId: h, userId, dayKey: day, completedAt: `${day}T10:00:00.000Z`, points: pts, base: pts, multiplier: 1, earlyBonus: 0,
});
const ev = (c: Completion) => ({ id: `ev:${c.id}`, userId: c.userId, dayKey: c.dayKey, type: 'completion' as const, points: c.points, refId: c.id, createdAt: c.completedAt });

function base(over: Partial<ReportData> = {}): ReportData {
  return {
    meId: ME, partnerId: null, today: TODAY, habits: [], completions: [], events: [], mood: [], sleep: [], sleepGoalH: 8,
    drink: [], drinkGoalMl: 2000, smokeLogs: [], smokePlan: null, smokePricing: null, smokeClosed: {}, meals: [],
    mealsGoal: { fastMax: 2, homeMin: 10 }, choreLogs: [], studyItems: [], studyLogs: [], studyGoalH: 10, timerSessions: [], tops: {},
    ...over,
  };
}
const withComps = (data: ReportData, cs: Completion[]): ReportData => ({ ...data, completions: [...data.completions, ...cs], events: [...data.events, ...cs.map(ev)] });
const dayAt = (i: number) => addDays('2026-10-01', i); // 1 Ekim'den i gün sonrası
const mood = (day: string, level: number, tags: string[] = []) => ({ dayKey: day, level, tags, note: '', at: `${day}T20:00:00.000Z` });
const sleep = (day: string, hours: number) => ({ dayKey: day, bed: '23:00', wake: '07:00', minutes: Math.round(hours * 60), quality: 0 });

// ---- hafta sınırları
assert.equal(weekStartOf('2026-11-11'), '2026-11-09');
assert.equal(weekStartOf('2026-11-15'), '2026-11-09', 'Pazar o haftanın Pazartesi başlangıçlı haftasında');
assert.equal(weekStartOf('2026-11-16'), '2026-11-16');
assert.equal(weekEndOf('2026-11-09'), '2026-11-15');
assert.deepEqual(weekDaysOf('2026-11-09'), ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
assert.equal(shiftWeek('2026-11-09', -1), '2026-11-02');
assert.equal(shiftWeek('2026-11-11', 1), '2026-11-16');
assert.equal(shiftWeek('2026-12-28', 1), '2027-01-04', 'yıl sınırı');
// gün sınırı 03:00: Pazartesi 02:30 hâlâ Pazar (önceki hafta)
assert.equal(weekStartOf(dayKeyOf(new Date(2026, 10, 16, 2, 30))), '2026-11-09');
assert.equal(weekStartOf(dayKeyOf(new Date(2026, 10, 16, 3, 0))), '2026-11-16');

// ---- karşılaştırma yüzdeleri
assert.deepEqual(compare(150, 100), { cur: 150, prev: 100, delta: 50, pct: 50, dir: 'up' });
assert.equal(compare(50, 100).pct, -50);
assert.equal(compare(50, 100).dir, 'down');
assert.equal(compare(10, 0).pct, null, 'önceki 0 → yüzde yok');
assert.equal(compare(0, 0).dir, 'same');
assert.equal(compare(2, 3).pct, -33);
assert.equal(compare(7, 3).pct, 133);

// ---- biçim
assert.equal(num(1.25, 'tr'), '1,3');
assert.equal(num(1.25, 'en'), '1.3');
assert.equal(num(7, 'tr'), '7');
assert.equal(num(7.04, 'en'), '7');

// ---- boş veri
assert.equal(isEmptyData(base()), true);
assert.equal(firstDataDay(base()), null);
assert.equal(weekStats(base(), TODAY).hasData, false);

// ---- hafta istatistikleri
{
  const habits = [habit('m1', 'morning'), habit('m2', 'morning'), habit('e1', 'evening')];
  let d = base({ habits });
  // Pzt: hepsi (3/3), Sal: yalnız m1 (1/3), Çar (bugün): yok
  d = withComps(d, [comp('m1', '2026-11-09'), comp('m2', '2026-11-09'), comp('e1', '2026-11-09'), comp('m1', '2026-11-10')]);
  // partner kaydı sayılmaz, geri alınan sayılmaz
  d = withComps(d, [comp('m2', '2026-11-10', 'other')]);
  d = { ...d, completions: [...d.completions, { ...comp('e1', '2026-11-10'), undone: true }] }; // geri alınmış: olayı da yok
  const s = weekStats(d, TODAY);
  assert.equal(s.start, '2026-11-09');
  assert.equal(s.end, '2026-11-15');
  assert.deepEqual(s.days, ['2026-11-09', '2026-11-10', '2026-11-11'], 'gelecek günler sayılmaz');
  assert.equal(s.ended, false);
  assert.equal(s.planned, 9);
  assert.equal(s.done, 4);
  assert.ok(Math.abs((s.rate as number) - 4 / 9) < 1e-9);
  assert.equal(s.activeDays, 2);
  assert.equal(s.longestRun, 2);
  assert.equal(s.points, 40, 'partner puanı sayılmaz');
  assert.equal(s.bestDay?.day, '2026-11-09');
  assert.equal(s.bestDay?.points, 30);
  const morning = s.slots.find((x) => x.slot === 'morning')!;
  assert.equal(morning.planned, 6);
  assert.equal(morning.done, 3);
  assert.equal(s.slots.find((x) => x.slot === 'afternoon')!.rate, null);
  assert.equal(s.perDay.length, 7);
  assert.equal(s.perDay[6].points, null, 'gelecek gün grafikte null');
  assert.equal(s.hasData, true);
  // geçmiş hafta tam 7 gün
  const lw = weekStats(d, '2026-11-02');
  assert.equal(lw.days.length, 7);
  assert.equal(lw.ended, true);
  assert.equal(lw.hasData, false);
}

// ---- karşılaştırma: devam eden hafta, geçen haftanın aynı günleri
{
  const habits = [habit('a', 'anytime')];
  let d = base({ habits });
  // geçen hafta: Pzt, Sal, Çar (aynı günler) + Cuma, Cmt
  d = withComps(d, ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06', '2026-11-07'].map((x) => comp('a', x)));
  // bu hafta: Pzt, Sal
  d = withComps(d, ['2026-11-09', '2026-11-10'].map((x) => comp('a', x)));
  const cur = weekStats(d, TODAY);
  const cmp = weekComparison(d, cur);
  assert.equal(cmp.partial, true);
  assert.equal(cmp.prevHasData, true);
  assert.equal(cmp.points.prev, 30, 'geçen haftanın yalnız ilk 3 günü');
  assert.equal(cmp.points.cur, 20);
  assert.equal(cmp.points.pct, -33);
  assert.equal(cmp.points.dir, 'down');
  assert.equal(cmp.tasks.prev, 3);
  assert.equal(cmp.rate?.dir, 'down'); // 67% → 100%? (bugün planlı ama yapılmadı → 2/3 vs 3/3)
  // geçmiş tam hafta: tam kıyas
  const full = weekStats(d, '2026-11-02');
  const c2 = weekComparison(d, full);
  assert.equal(c2.partial, false);
  assert.equal(c2.prevHasData, false);
  assert.equal(c2.points.pct, null);
}

// ---- yarış (partner)
{
  const habits = [habit('a', 'anytime'), habit('b', 'anytime', { ownerId: 'p' })];
  let d = base({ habits, partnerId: 'p' });
  const mine = ['2026-11-09', '2026-11-10', '2026-11-11'].map((x) => comp('a', x, ME, 60));
  const theirs = ['2026-11-09'].map((x) => comp('b', x, 'p', 10));
  d = withComps(d, [...mine, ...theirs]);
  const s = weekStats(d, TODAY);
  assert.ok(s.race);
  assert.equal(s.race!.mePoints, 180);
  assert.equal(s.race!.partnerPoints, 10);
  assert.equal(s.race!.result, 'win');
  assert.equal(weekStats(base({ habits }), TODAY).race, null, 'partner yoksa yarış yok');
}

// ---- splitCompare / eşikler
{
  const mk = (day: string, sleepH: number | null, m: number | null) =>
    buildDayFacts(base({ sleep: sleepH === null ? [] : [sleep(day, sleepH)], mood: m === null ? [] : [mood(day, m)] }), [day])[0];
  // 3 gün → yetersiz
  const three = [mk('2026-10-01', 8, 5), mk('2026-10-02', 6, 3), mk('2026-10-03', 8, 5)];
  assert.equal(MIN_DAYS, 4);
  assert.equal(splitCompare(three, (f) => (f.sleepH === null ? null : f.sleepH >= 7), (f) => f.mood), null, 'N<4 → null');
  assert.deepEqual(insightsFromFacts(three), []);
  // 4 gün ama grup 3+1 → yetersiz
  const unbalanced = [mk('2026-10-01', 8, 5), mk('2026-10-02', 8, 5), mk('2026-10-03', 8, 4), mk('2026-10-04', 6, 3)];
  assert.equal(splitCompare(unbalanced, (f) => (f.sleepH === null ? null : f.sleepH >= 7), (f) => f.mood), null, 'grup 1 gün → null');
  // 4 gün 2+2 → var
  const ok = [mk('2026-10-01', 8, 5), mk('2026-10-02', 8, 4), mk('2026-10-03', 6, 3), mk('2026-10-04', 5, 2)];
  const g = splitCompare(ok, (f) => (f.sleepH === null ? null : f.sleepH >= 7), (f) => f.mood)!;
  assert.equal(g.n, 4);
  assert.equal(g.nA, 2);
  assert.ok(Math.abs(g.diff - 2) < 1e-9);
  const ins = insightsFromFacts(ok);
  assert.equal(ins.length, 1);
  assert.equal(ins[0].id, 'sleepMood');
  assert.equal(ins[0].dir, 'higher');
  assert.equal(ins[0].n, 4);
  // ölçüsü eksik gün dışlanır (ruh hali yok)
  const missing = [mk('2026-10-01', 8, 5), mk('2026-10-02', 8, null), mk('2026-10-03', 6, 3), mk('2026-10-04', 5, null)];
  assert.deepEqual(insightsFromFacts(missing), [], 'ruh hali olan yalnız 2 gün');
  // etki eşiğin altı: fark 0.1 < 0.3
  const tiny = [mk('2026-10-01', 8, 4), mk('2026-10-02', 8, 4), mk('2026-10-03', 6, 4), mk('2026-10-04', 6, 4)];
  assert.deepEqual(insightsFromFacts(tiny), [], 'fark yok → içgörü yok');
  // ters yön: 7+ saat uyunan günde ruh hali daha düşük
  const rev = [mk('2026-10-01', 8, 2), mk('2026-10-02', 8, 2), mk('2026-10-03', 6, 4), mk('2026-10-04', 6, 5)];
  assert.equal(insightsFromFacts(rev)[0].dir, 'lower');
}

// ---- sabah → diğer görevler, fast food → su, stres → sigara
{
  const habits = [habit('m', 'morning'), habit('x', 'afternoon'), habit('y', 'evening')];
  let d = base({ habits });
  const days = Array.from({ length: 8 }, (_, i) => dayAt(i));
  const cs: Completion[] = [];
  days.forEach((day, i) => {
    if (i % 2 === 0) {
      cs.push(comp('m', day), comp('x', day), comp('y', day)); // sabah tamam → diğerleri 2/2
    } else {
      cs.push(comp('x', day)); // sabah yok → diğerleri 1/2
    }
  });
  d = withComps(d, cs);
  const facts = buildDayFacts(d, days);
  const ins = insightsFromFacts(facts);
  const m = ins.find((x) => x.id === 'morningRate')!;
  assert.ok(m, 'sabah içgörüsü');
  assert.equal(m.n, 8);
  assert.ok(Math.abs(m.a - 1) < 1e-9 && Math.abs(m.b - 0.5) < 1e-9);
  assert.equal(m.dir, 'higher');
}
{
  // fast food günleri su hedefini daha az tutuyor
  const days = Array.from({ length: 8 }, (_, i) => dayAt(i));
  const meals = days.map((day, i) => ({ id: `m${i}`, dayKey: day, slot: 'dinner' as const, kind: (i % 2 === 0 ? 'fast' : 'home') as 'fast' | 'home', at: `${day}T19:00:00.000Z` }));
  const drink = days.map((day, i) => ({ id: `d${i}`, dayKey: day, ml: i % 2 === 0 ? 800 : 2400, at: `${day}T12:00:00.000Z` }));
  const facts = buildDayFacts(base({ meals, drink }), days);
  const fw = insightsFromFacts(facts).find((x) => x.id === 'fastWater')!;
  assert.ok(fw);
  assert.equal(fw.dir, 'lower');
  assert.equal(fw.a, 0);
  assert.equal(fw.b, 1);
}
{
  // stresli günlerde daha çok sigara; bugün (kapanmamış) dışlanır
  const plan = { startPerDay: 10, goalPerDay: 0, everyDays: 7, startDay: '2026-09-01' };
  const days = Array.from({ length: 8 }, (_, i) => dayAt(i));
  const logs: Array<{ dayKey: string }> = [];
  const moods = days.map((day, i) => mood(day, 3, i % 2 === 0 ? ['stressed'] : ['calm']));
  days.forEach((day, i) => {
    const n = i % 2 === 0 ? 8 : 3;
    for (let k = 0; k < n; k++) logs.push({ dayKey: day });
  });
  const d = base({ mood: moods, smokeLogs: logs, smokePlan: plan });
  const ss = insightsFromFacts(buildDayFacts(d, days)).find((x) => x.id === 'smokeStress')!;
  assert.ok(ss);
  assert.equal(ss.dir, 'higher');
  assert.equal(ss.a, 8);
  assert.equal(ss.b, 3);
  // son gün "bugün" ise (açık) sayılmaz → n 7
  const d2 = base({ mood: moods, smokeLogs: logs, smokePlan: plan, today: days[7] });
  const ss2 = insightsFromFacts(buildDayFacts(d2, days)).find((x) => x.id === 'smokeStress')!;
  assert.equal(ss2.n, 7);
}

// ---- en fazla 5, ilgi puanına göre sıralı
{
  assert.ok(interestScore(1.5, 1.5, 14) > interestScore(0.3, 1.5, 14));
  assert.ok(interestScore(1, 1.5, 28) > interestScore(1, 1.5, 4), 'daha çok gün → daha yüksek puan');
  assert.ok(interestScore(10, 1, 100) <= 1);
  // 7 olası içgörüyü de üretecek veri
  const habits = [habit('m', 'morning'), habit('x', 'afternoon')];
  const days = Array.from({ length: 16 }, (_, i) => dayAt(i));
  const good = (i: number) => i % 2 === 0;
  const cs: Completion[] = [];
  days.forEach((day, i) => {
    if (good(i)) cs.push(comp('m', day), comp('x', day));
  });
  const d = withComps(base({
    habits,
    sleep: days.map((x, i) => sleep(x, good(i) ? 8 : 5)),
    mood: days.map((x, i) => mood(x, good(i) ? 5 : 2, good(i) ? [] : ['stressed'])),
    drink: days.map((x, i) => ({ id: `d${i}`, dayKey: x, ml: good(i) ? 2500 : 500, at: `${x}T12:00:00.000Z` })),
    meals: days.map((x, i) => ({ id: `m${i}`, dayKey: x, slot: 'dinner' as const, kind: (good(i) ? 'home' : 'fast') as 'home' | 'fast', at: `${x}T19:00:00.000Z` })),
    smokePlan: { startPerDay: 10, goalPerDay: 0, everyDays: 7, startDay: '2026-09-01' },
    smokeLogs: days.flatMap((x, i) => Array.from({ length: good(i) ? 2 : 9 }, () => ({ dayKey: x }))),
  }), cs);
  const all = insightsFromFacts(buildDayFacts(d, days), 99);
  assert.ok(all.length >= 6, `çok içgörü (${all.map((x) => x.id)})`);
  const top = insightsFromFacts(buildDayFacts(d, days));
  assert.equal(top.length, MAX_INSIGHTS);
  for (let i = 1; i < top.length; i++) assert.ok(top[i - 1].score >= top[i].score, 'puana göre sıralı');
  for (const x of top) assert.ok(x.n >= MIN_DAYS, 'her içgörü ≥4 güne dayanır');
}

// ---- pencere
{
  const w = windowDays('2026-11-15', TODAY);
  assert.equal(w.length, 28);
  assert.equal(w[w.length - 1], TODAY, 'gelecek günler dışlanır');
  const w2 = windowDays('2026-11-08', TODAY);
  assert.equal(w2[w2.length - 1], '2026-11-08');
}

// ---- sigara: kapanmamış bugün sayılmaz, kapatılırsa sayılır; para
{
  const plan = { startPerDay: 10, goalPerDay: 0, everyDays: 100, startDay: '2026-11-01' };
  const pricing = { packPrice: 100, packSize: 20, currency: 'TRY' as const };
  const logs = [
    { dayKey: '2026-11-09' }, { dayKey: '2026-11-09' }, // limit 10 → içinde
    ...Array.from({ length: 12 }, () => ({ dayKey: '2026-11-10' })), // limit aşıldı
    { dayKey: TODAY },
  ];
  const d = base({ smokePlan: plan, smokePricing: pricing, smokeLogs: logs });
  const s = weekStats(d, TODAY);
  assert.equal(s.smoke!.tracked, 2, 'bugün kapanmadı');
  assert.equal(s.smoke!.limitDays, 1);
  assert.equal(s.smoke!.overDays, 1);
  assert.equal(s.smoke!.total, 14);
  assert.equal(s.smoke!.saved, 40, '(10-2)+(0) = 8 sigara × 5₺');
  const s2 = weekStats({ ...d, smokeClosed: { [TODAY]: true } }, TODAY);
  assert.equal(s2.smoke!.tracked, 3);
}

// ---- öğün, su, uyku, çalışma, gelişim, ev işi
{
  const d = base({
    sleep: [sleep('2026-11-09', 7), sleep('2026-11-10', 8)],
    mood: [mood('2026-11-09', 4), mood('2026-11-10', 3)],
    drink: [
      { id: '1', dayKey: '2026-11-09', ml: 2100, at: '' },
      { id: '2', dayKey: '2026-11-10', ml: 900, at: '' },
    ],
    meals: [
      { id: 'a', dayKey: '2026-11-09', slot: 'lunch', kind: 'home', at: '' },
      { id: 'b', dayKey: '2026-11-10', slot: 'lunch', kind: 'fast', at: '' },
      { id: 'c', dayKey: TODAY, slot: 'lunch', kind: 'home', at: '' },
    ],
    choreLogs: [{ id: 'x', choreId: 'c', dayKey: '2026-11-10', at: '' }, { id: 'y', choreId: 'c', dayKey: '2026-11-02', at: '' }],
    studyLogs: [{ id: 's', dayKey: '2026-11-10', minutes: 90, tag: 'homework' as const }],
    timerSessions: [{ dayKey: '2026-11-10', minutes: 30, tag: 'lesson' }, { dayKey: '2026-11-10', minutes: 25, tag: 'work' }],
    studyItems: [{ id: 'i', type: 'homework' as const, title: 'x', status: 'done' as const, priority: 'med' as const, subtasks: [], remind: { dayBefore: true, morning: true }, createdAt: '', doneDay: '2026-11-10' }],
    tops: {
      '2026-11-09': [{ id: '1', title: 'a', done: true }, { id: '2', title: 'b', done: true }, { id: '3', title: 'c', done: true }],
      '2026-11-10': [{ id: '1', title: 'a', done: true }, { id: '2', title: 'b', done: false }],
    },
  });
  const s = weekStats(d, TODAY);
  assert.ok(Math.abs(s.sleep!.avgH - 7.5) < 1e-9);
  assert.equal(s.sleep!.n, 2);
  assert.equal(s.mood!.avg, 3.5);
  assert.equal(s.water!.goalDays, 1);
  assert.equal(s.water!.days, 3);
  assert.equal(s.meals!.fastFreeDays, 1, 'bugün hariç; 09 temiz, 10 fast');
  assert.equal(s.meals!.fast, 1);
  assert.equal(s.meals!.home, 2);
  assert.equal(s.chores!.done, 1, 'hafta dışı iş sayılmaz');
  assert.equal(s.study!.minutes, 120, 'zamanlayıcı work etiketi sayılmaz');
  assert.equal(s.study!.closed, 1);
  assert.equal(s.growth!.topDays, 1);
  assert.equal(s.growth!.plannedDays, 2);
  assert.equal(s.smoke, null);
}

// ---- öneriler: her zaman 3, veriden türeyenler önde
{
  const empty = weekStats(base({ habits: [habit('a', 'anytime')] }), TODAY);
  const s0 = suggestions(empty, []);
  assert.equal(s0.length, 3);
  assert.deepEqual(new Set(s0.map((x) => x.id)).size, 3, 'tekrar yok');
  // zayıf sabah + düşük uyku + sigara aşımı
  const habits = [habit('m1', 'morning'), habit('m2', 'morning'), habit('e', 'evening')];
  const plan = { startPerDay: 10, goalPerDay: 0, everyDays: 100, startDay: '2026-11-01' };
  let d = base({
    habits,
    sleep: [sleep('2026-11-09', 5), sleep('2026-11-10', 5.5)],
    smokePlan: plan,
    smokePricing: { packPrice: 100, packSize: 20, currency: 'TRY' },
    smokeLogs: Array.from({ length: 12 }, () => ({ dayKey: '2026-11-10' })),
  });
  d = withComps(d, [comp('e', '2026-11-09'), comp('e', '2026-11-10')]);
  const st = weekStats(d, TODAY);
  const ids = suggestions(st, []).map((x) => x.id);
  assert.equal(ids.length, 3);
  assert.ok(ids.includes('smoke'));
  assert.ok(ids.includes('sleep'));
  assert.ok(ids.includes('slot'), `zayıf dilim önerisi: ${ids}`);
  const slot = suggestions(st, []).find((x) => x.id === 'slot')!;
  assert.equal(slot.slot, 'morning');
  assert.equal(slot.params.pct, 0);
}

console.log('report.test.ts: tamam');

// ---- ortak dosya bağlantıları (bildirim grubu, yeniden kurma, sıfırlama) kaynakta var mı
import fs from 'node:fs';
const src = (f: string) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
assert.ok(/NOTIF_GROUPS[^\n]*'report'/.test(src('src/lib/notifications.ts')), "NOTIF_GROUPS 'report' içermeli");
assert.ok(src('src/lib/reminders.ts').includes('syncReportNotifs'), 'resyncAllReminders raporu kurmalı');
assert.ok(src('src/store/resetAll.ts').includes('useReportPrefs'), 'resetAll rapor dilimini sıfırlamalı');
assert.ok(/kind: 'weekly', weekday: REPORT_WEEKDAY, hour: REPORT_HOUR/.test(src('src/features/report/notify.ts')) && /REPORT_WEEKDAY = 6/.test(src('src/features/report/notify.ts')) && /REPORT_HOUR = 19/.test(src('src/features/report/notify.ts')), 'Pazar 19:00');
console.log('report.test.ts: ortak bağlantılar tamam');
