import { PLANNER_POOL } from '../../data/plannerPool';
import { blockPlan, budgetOf, generatePlan, toMin, totalMinutes, type PlanAnswers } from './plan';

// Bağımlılıksız mini assert (tsconfig'te node tipleri yok)
const assert = {
  ok(v: unknown, msg = 'beklenen doğru') {
    if (!v) throw new Error(msg);
  },
  equal(a: unknown, b: unknown, msg?: string) {
    if (a !== b) throw new Error(msg ?? `${String(a)} !== ${String(b)}`);
  },
  deepEqual(a: unknown, b: unknown) {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
  },
};

let n = 0;
const ok = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log('  ok', name);
};

ok('havuzda en az 50 görev, iki dilli, id benzersiz', () => {
  assert.ok(PLANNER_POOL.length >= 50);
  assert.equal(new Set(PLANNER_POOL.map((t) => t.id)).size, PLANNER_POOL.length);
  for (const t of PLANNER_POOL) assert.ok(t.title.tr && t.title.en && t.parts.length && t.minutes > 0);
});

const base: PlanAnswers = { wake: '07:00', energy: 'mid', areas: [], minutes: 60 };

ok('süre sınırına uyar, 5-9 görev, tekrar yok (tüm kombinasyonlar x 40 tohum)', () => {
  for (const energy of ['low', 'mid', 'high'] as const)
    for (const minutes of [15, 30, 60, 90] as const)
      for (let seed = 1; seed <= 40; seed++) {
        const plan = generatePlan({ ...base, energy, minutes }, seed);
        assert.ok(totalMinutes(plan) <= budgetOf(minutes), `${energy}/${minutes}/${seed}: ${totalMinutes(plan)}`);
        assert.ok(plan.length >= 5 && plan.length <= 9, `adet ${plan.length} (${energy}/${minutes})`);
        assert.equal(new Set(plan.map((p) => p.id)).size, plan.length);
      }
});

ok('düşük enerjide yalnız kolay görev ve daha az görev', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const low = generatePlan({ ...base, energy: 'low', minutes: 90 }, seed);
    assert.ok(low.every((p) => p.task.effort === 1));
    assert.equal(low.length, 5);
    const high = generatePlan({ ...base, energy: 'high', minutes: 90 }, seed);
    assert.ok(high.length >= 8);
  }
});

ok('odak alanı ağırlığı çalışır', () => {
  const share = (areas: PlanAnswers['areas']) => {
    let hit = 0;
    let all = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const plan = generatePlan({ ...base, areas, minutes: 90 }, seed);
      all += plan.length;
      hit += plan.filter((p) => areas.includes(p.task.area)).length;
    }
    return hit / all;
  };
  const home = share(['home']);
  const none = (() => {
    let hit = 0;
    let all = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const plan = generatePlan({ ...base, areas: [], minutes: 90 }, seed);
      all += plan.length;
      hit += plan.filter((p) => p.task.area === 'home').length;
    }
    return hit / all;
  })();
  assert.ok(home > none + 0.2, `ev payı ${home.toFixed(2)} vs ${none.toFixed(2)}`);
  assert.ok(share(['study', 'wellness']) > 0.6);
});

ok('saatler: kalkıştan sonra, blok içinde artan, sıralı', () => {
  const plan = generatePlan({ ...base, wake: '06:30' }, 7);
  const times = plan.map((p) => toMin(p.time));
  assert.ok(times[0] >= toMin('06:30'));
  assert.deepEqual([...times].sort((a, b) => a - b), times);
  assert.ok(plan.some((p) => p.block === 'morning') && plan.some((p) => p.block === 'evening'));
});

ok('aynı tohum aynı plan; yeniden oluştur (avoid) farklı plan verir', () => {
  const p1 = generatePlan(base, 11);
  assert.deepEqual(generatePlan(base, 11).map((p) => p.id), p1.map((p) => p.id));
  let different = 0;
  for (let seed = 12; seed < 32; seed++) {
    const p2 = generatePlan(base, seed, p1.map((p) => p.id));
    if (p2.map((p) => p.id).join() !== p1.map((p) => p.id).join()) different++;
    const overlap = p2.filter((p) => p1.some((q) => q.id === p.id)).length;
    assert.ok(overlap < p1.length, 'aynı plan');
  }
  assert.equal(different, 20);
});

ok('blockPlan dağılımı', () => {
  for (let k = 5; k <= 9; k++) assert.equal(blockPlan(k).length, k);
  assert.deepEqual(blockPlan(5).filter((b) => b === 'evening').length, 1);
});

console.log(`${n} planner testi geçti`);
