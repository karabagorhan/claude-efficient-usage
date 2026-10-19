import { strict as assert } from 'node:assert';
import { convert, isCurrency, isValidRate, type FxRate } from '../src/fx-math';
import { projectData } from '../src/view';
import type { Data } from '../src/store';

const fx: FxRate = { rate: 40, date: '2026-10-16', fetchedAt: '2026-10-19T03:00:00Z', source: 'ECB / Frankfurter' };
let tests = 0;
function eq(got: unknown, expected: unknown) { assert.deepEqual(got, expected); tests++; }
eq(isCurrency('TRY'), true);
eq(isCurrency('USD'), true);
eq(isCurrency('EURO'), false);
eq(isValidRate(fx), true);
eq(isValidRate({ ...fx, date: '2026-02-30' }), false);
eq(isValidRate({ ...fx, rate: 0 }), false);
eq(isValidRate({ ...fx, rate: Infinity }), false);
eq(isValidRate({ ...fx, rate: 100000 }), false);
eq(convert(100, 'TRY', 'USD', fx), 2.5);
eq(convert(7.25, 'USD', 'TRY', fx), 290);
eq(convert(42, 'TRY', 'TRY', null), 42);
eq(convert(42, 'TRY', 'USD', null), null);
eq(convert(Number.POSITIVE_INFINITY, 'TRY', 'USD', fx), null);
eq(convert(41, 'TRY', 'USD', fx), 1.03);
const data = {
  items: [
    { id: 'a', amount: 100, cat: 'Market', note: 'Local', date: '2026-10-16', ts: 1 }, // legacy, TRY
    { id: 'b', amount: 10, currency: 'USD', cat: 'Fatura', note: 'Cloud', date: '2026-10-16', ts: 2 },
  ],
  subs: [{ id: 'sub1', name: 'Subscription', amount: 12, currency: 'USD', day: 1, freq: 'monthly', month: 0, cat: 'Fatura', skip: '', type: 'diger' }],
  settings: { budget: 1000, currency: 'TRY', budgetCurrency: 'TRY', catBudgets: { Market: 80 }, language: 'en', remind: false, remindHour: 21, subRemind: false, theme: 'noir', name: '' },
} as Data;
const original = JSON.stringify(data);
const projectedTry = projectData(data, 'TRY', fx);
assert.ok(projectedTry);
eq(projectedTry.items.map(x => x.amount), [100, 400]);
eq(projectedTry.subs[0].amount, 480);
eq(projectedTry.settings.budget, 1000);
const projectedUsd = projectData(data, 'USD', fx);
assert.ok(projectedUsd);
eq(projectedUsd.items.map(x => x.amount), [2.5, 10]);
eq(projectedUsd.subs[0].amount, 12);
eq(projectedUsd.settings.budget, 25);
eq(projectedUsd.settings.catBudgets.Market, 2);
eq(projectedUsd.settings.language, 'en'); // currency independent from app language
eq(projectData(data, 'USD', null), null); // do not silently mislabel TL values
eq(JSON.stringify(data), original); // projection must not mutate originals
console.log(`FX and multi-currency projections: ${tests} passed`);
