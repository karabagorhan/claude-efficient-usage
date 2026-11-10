import assert from 'node:assert/strict';
import {
  canCloseDay, choreCounts, choreStatus, dayCounts, daysBetween, elapsedParts, fastFoodFreeStreak, hardestHours, limitStreaks, monthSpend,
  moneySaved, nextMilestone, nextReduction, planEndDay, reductionLimit, reductionSteps, shoppingList, sortChores, triggerCounts,
  unsmokedCount, weekCounts, weekGrid, weeklyChoreScore, MONEY_MILESTONES,
} from '../src/features/life/calc';
import { DEFAULT_CHORES, seedChores } from '../src/data/chores';
import { LIFE_MESSAGES, pickMessage } from '../src/data/lifeMessages';
import { MEAL_IDEAS } from '../src/data/mealIdeas';
import lifeLocale from '../src/i18n/locales/life';
import type { Chore, MealEntry, SmokePlan } from '../src/features/life/types';

// ---- Sigara: azaltma planı
const plan: SmokePlan = { startPerDay: 10, goalPerDay: 5, everyDays: 3, startDay: '2026-11-01' };
assert.equal(reductionLimit(plan, '2026-10-30'), 10); // başlangıçtan önce -> başlangıç limiti
assert.equal(reductionLimit(plan, '2026-11-01'), 10);
assert.equal(reductionLimit(plan, '2026-11-03'), 10);
assert.equal(reductionLimit(plan, '2026-11-04'), 9); // her 3 günde 1
assert.equal(reductionLimit(plan, '2026-11-13'), 6);
assert.equal(reductionLimit(plan, '2026-11-16'), 5);
assert.equal(reductionLimit(plan, '2027-03-01'), 5); // hedefin altına inmez
const steps = reductionSteps(plan);
assert.equal(steps.length, 6); // 10,9,8,7,6,5
assert.deepEqual(steps[0], { limit: 10, from: '2026-11-01', to: '2026-11-03' });
assert.deepEqual(steps[5], { limit: 5, from: '2026-11-16', to: null });
assert.equal(planEndDay(plan), '2026-11-16');
assert.deepEqual(nextReduction(plan, '2026-11-05'), { day: '2026-11-07', limit: 8 });
assert.equal(nextReduction(plan, '2026-11-20'), null);
assert.equal(reductionSteps({ ...plan, goalPerDay: 0, startPerDay: 3, everyDays: 1 }).length, 4); // 3,2,1,0
assert.equal(reductionSteps({ ...plan, startPerDay: 4, goalPerDay: 8 }).length, 1); // hedef >= başlangıç

// ---- Sigara: sayımlar, para, seri
const logs = [
  ...Array(8).fill(0).map(() => ({ dayKey: '2026-11-01' })), // 8 (limit 10) ok
  ...Array(9).fill(0).map(() => ({ dayKey: '2026-11-02' })), // 9 ok
  ...Array(11).fill(0).map(() => ({ dayKey: '2026-11-03' })), // 11 > 10 aşıldı
  ...Array(4).fill(0).map(() => ({ dayKey: '2026-11-04' })), // 4 (limit 9) ok
  ...Array(5).fill(0).map(() => ({ dayKey: '2026-11-05' })), // ok
];
const counts = dayCounts(logs);
assert.equal(counts['2026-11-03'], 11);
// 11-01..11-05: (10-8)+(10-9)+0+(10-4)+(10-5)=2+1+0+6+5
assert.equal(unsmokedCount(plan, counts, '2026-11-05'), 14);
assert.equal(unsmokedCount(plan, counts, '2026-10-20'), 0);
assert.equal(moneySaved(14, 100, 20), 70); // 5 TL / sigara
assert.equal(moneySaved(14, 100, 0), 0);
// Seri: 11-03 aşıldı -> 11-04, 11-05 limitte; bugün 11-06 henüz kapanmadı
assert.deepEqual(limitStreaks(plan, counts, '2026-11-06', false), { current: 2, best: 2 });
// Bugün 11-06 limiti aşarsa seri sıfırlanır
assert.equal(limitStreaks(plan, { ...counts, '2026-11-06': 12 }, '2026-11-06', false).current, 0);
// Bugün kapatılınca sayılır (kayıtsız gün = 0 sigara = limitte)
assert.equal(limitStreaks(plan, counts, '2026-11-06', true).current, 3);
assert.equal(limitStreaks(plan, counts, '2026-11-02', false).best, 1); // yalnız 11-01 tamamlandı
assert.equal(limitStreaks(plan, {}, '2026-11-01', false).current, 0); // başlangıç günü, henüz tamamlanan gün yok

// Tetikleyici ve saatler
assert.deepEqual(
  triggerCounts([{ trigger: 'stress' }, { trigger: 'coffee' }, { trigger: 'stress' }, {}]),
  [{ trigger: 'stress', count: 2 }, { trigger: 'coffee', count: 1 }],
);
const at = (h: number) => new Date(2026, 10, 2, h, 15).toISOString();
const hh = hardestHours([{ at: at(9) }, { at: at(14) }, { at: at(14) }, { at: at(22) }, { at: at(22) }, { at: at(22) }]);
assert.deepEqual(hh.top, [22, 14, 9]);
assert.equal(hh.hist[22], 3);

// Gün kapatma penceresi ve süre
assert.equal(canCloseDay(new Date(2026, 10, 2, 17, 59)), false);
assert.equal(canCloseDay(new Date(2026, 10, 2, 18, 0)), true);
assert.equal(canCloseDay(new Date(2026, 10, 3, 2, 59)), true); // ertesi gün 03:00'a kadar
assert.equal(canCloseDay(new Date(2026, 10, 3, 3, 0)), false);
assert.deepEqual(elapsedParts((2 * 60 + 14) * 60000 + 5000), { d: 0, h: 2, m: 14 });
assert.deepEqual(elapsedParts(26 * 3600 * 1000), { d: 1, h: 2, m: 0 });
assert.deepEqual(elapsedParts(-5), { d: 0, h: 0, m: 0 });
assert.deepEqual(nextMilestone(MONEY_MILESTONES, 120), { reached: [50, 100], next: 250 });

// ---- Yemek
const me = (day: string, slot: MealEntry['slot'], kind: MealEntry['kind'], amount?: number, h = 12): MealEntry => ({
  id: `${day}${slot}${kind}${h}`, dayKey: day, slot, kind, amount, at: new Date(`${day}T${String(h).padStart(2, '0')}:00:00`).toISOString(),
});
const meals: MealEntry[] = [
  me('2026-11-09', 'lunch', 'home'), // Pzt
  me('2026-11-09', 'dinner', 'fast', 250, 19),
  me('2026-11-10', 'lunch', 'healthy'),
  me('2026-11-10', 'dinner', 'home', undefined, 19),
  me('2026-11-11', 'breakfast', 'skipped', undefined, 8),
  me('2026-11-11', 'dinner', 'home', undefined, 19),
  me('2026-11-02', 'dinner', 'fast', 100, 19), // geçen hafta, aynı ay
];
assert.deepEqual(weekCounts(meals, '2026-11-11'), { home: 3, healthy: 1, fast: 1, skipped: 1 });
assert.equal(monthSpend(meals, '2026-11-11'), 350);
assert.equal(monthSpend(meals, '2026-12-01'), 0);
// Fast food'suz seri: 11-11 temiz, 11-10 temiz, 11-09 fast food -> 2
assert.equal(fastFoodFreeStreak(meals, '2026-11-11'), 2);
// Bugün (11-12) henüz kayıt yok: seriyi kesmez
assert.equal(fastFoodFreeStreak(meals, '2026-11-12'), 2);
// Bugün fast food -> 0
assert.equal(fastFoodFreeStreak([...meals, me('2026-11-12', 'lunch', 'fast', 90)], '2026-11-12'), 0);
// Geçmişte kayıtsız gün seriyi keser
assert.equal(fastFoodFreeStreak(meals, '2026-11-14'), 0);
assert.equal(fastFoodFreeStreak([], '2026-11-14'), 0);
const grid = weekGrid(meals, '2026-11-11');
assert.equal(grid.length, 7);
assert.equal(grid[0].day, '2026-11-09');
assert.equal(grid[0].cells.dinner, 'fast');
assert.equal(grid[2].cells.breakfast, 'skipped');

// Alışveriş listesi menüden birleşir
const list = shoppingList({ '0|dinner': 'menemen', '1|dinner': 'omelette', '2|lunch': 'bogus-id' });
const eggs = list.find((x) => x.key === 'Yumurta');
assert.equal(eggs?.count, 2);
assert.ok(!list.some((x) => x.key === 'bogus-id'));

// ---- Ev işleri
const chore = (over: Partial<Chore>): Chore => ({ id: 'x', emoji: '🧹', area: 'living', every: 3, createdDay: '2026-11-01', postponed: 0, doneCount: 0, ...over });
const day = '2026-11-10';
assert.equal(choreStatus(chore({ lastDone: '2026-11-06' }), day).state, 'overdue'); // vade 11-09
assert.equal(choreStatus(chore({ lastDone: '2026-11-06' }), day).diff, -1);
assert.equal(choreStatus(chore({ lastDone: '2026-11-07' }), day).state, 'today'); // vade 11-10
assert.equal(choreStatus(chore({ lastDone: '2026-11-08' }), day).state, 'soon'); // vade 11-11
assert.equal(choreStatus(chore({ lastDone: '2026-11-09' }), day).state, 'soon'); // vade 11-12 (2 gün)
assert.equal(choreStatus(chore({ lastDone: '2026-11-10' }), day).state, 'later'); // vade 11-13
assert.equal(choreStatus(chore({ firstDue: '2026-11-10' }), day).state, 'today'); // hiç yapılmadı: ilk vade
assert.equal(choreStatus(chore({ lastDone: '2026-11-06', snoozeUntil: '2026-11-11' }), day).state, 'soon'); // ertelendi
const sorted = sortChores(
  [chore({ id: 'a', lastDone: '2026-11-10' }), chore({ id: 'b', lastDone: '2026-11-07' }), chore({ id: 'c', lastDone: '2026-11-01' }), chore({ id: 'd', lastDone: '2026-11-08' })],
  day,
);
assert.deepEqual(sorted.map((c) => c.id), ['c', 'b', 'd', 'a']);
assert.deepEqual(choreCounts(sorted, day), { overdue: 1, today: 1, soon: 1, later: 1 });
const ws = weeklyChoreScore(
  [chore({ every: 1 }), chore({ every: 7 })], // beklenen 7 + 1 = 8
  [{ id: '1', choreId: 'x', dayKey: '2026-11-09', at: '' }, { id: '2', choreId: 'x', dayKey: '2026-11-10', at: '' }, { id: '3', choreId: 'x', dayKey: '2026-11-08', at: '' }],
  day,
);
assert.deepEqual(ws, { done: 2, expected: 8, score: 25 }); // 11-08 geçen hafta (Pazar)
assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2);

// ---- Veri bütünlüğü
assert.ok(MEAL_IDEAS.length >= 30, 'en az 30 yemek fikri');
assert.ok(MEAL_IDEAS.every((m) => m.mins > 0 && m.meals.length > 0 && m.items.length >= 2 && m.name.tr && m.name.en));
assert.equal(new Set(MEAL_IDEAS.map((m) => m.id)).size, MEAL_IDEAS.length);
assert.ok(DEFAULT_CHORES.length >= 18, 'en az 18 varsayılan iş');
assert.ok(DEFAULT_CHORES.every((c) => c.every >= 1 && c.name.tr && c.name.en));
assert.equal(Object.keys(seedChores('2026-11-10')).length, DEFAULT_CHORES.length);
for (const k of ['smoke', 'meals', 'chores'] as const) {
  assert.ok(LIFE_MESSAGES[k].length >= 10, `${k}: en az 10 mesaj`);
  for (const tone of ['low', 'mid', 'high'] as const) assert.ok(LIFE_MESSAGES[k].some((m) => m.tone === tone), `${k}/${tone}`);
}
assert.deepEqual(pickMessage('smoke', 'mid', '2026-11-10'), pickMessage('smoke', 'mid', '2026-11-10')); // deterministik

// i18n: tr ve en anahtarları birebir aynı
const keys = (o: any, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
assert.deepEqual(keys(lifeLocale.tr).sort(), keys(lifeLocale.en).sort());
assert.ok(keys(lifeLocale.tr).length > 100);

console.log('✅ yaşam takibi testleri geçti');
