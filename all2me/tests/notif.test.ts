// Bildirim bütçesi: sessiz saatler + günlük üst sınır (src/lib/notifBudget.ts, saf).
import assert from 'node:assert/strict';
import { applyDailyCap, applyQuietHours, deferPastQuiet, inQuiet, type BudgetItem } from '../src/lib/notifBudget';

const Q = { enabled: true, start: '22:00', end: '07:00' };
const daily = (group: string, hour: number, minute = 0, ref = `${group}@${hour}`): BudgetItem<string> => ({ group, trigger: { kind: 'daily', hour, minute }, ref });

// --- sessiz aralık (gece yarısını aşan) ---
assert.ok(inQuiet(22 * 60, Q));
assert.ok(inQuiet(23 * 60 + 59, Q));
assert.ok(inQuiet(0, Q));
assert.ok(inQuiet(6 * 60 + 59, Q));
assert.ok(!inQuiet(7 * 60, Q), 'bitiş dakikası sessiz değil');
assert.ok(!inQuiet(21 * 60 + 59, Q));
// gün içi aralık
const Day = { enabled: true, start: '13:00', end: '14:30' };
assert.ok(inQuiet(13 * 60 + 15, Day) && !inQuiet(14 * 60 + 30, Day) && !inQuiet(12 * 60, Day));
// kapalı / eşit uçlar
assert.ok(!inQuiet(23 * 60, { ...Q, enabled: false }));
assert.ok(!inQuiet(23 * 60, { enabled: true, start: '08:00', end: '08:00' }));

// tek seferlik erteleme: 23:30 → ertesi gün 07:00; 05:00 → aynı gün 07:00
const d1 = deferPastQuiet(new Date(2026, 10, 12, 23, 30), Q);
assert.deepEqual([d1.getDate(), d1.getHours(), d1.getMinutes()], [13, 7, 0]);
const d2 = deferPastQuiet(new Date(2026, 10, 13, 5, 0), Q);
assert.deepEqual([d2.getDate(), d2.getHours()], [13, 7]);
const d3 = new Date(2026, 10, 13, 9, 0);
assert.equal(deferPastQuiet(d3, Q), d3, 'aralık dışı aynen');

// applyQuietHours: tekrarlayan sessizdeki kurulmaz, tek seferlik ertelenir; alarm/zamanlayıcı muaf
const qi: BudgetItem<string>[] = [
  daily('sleep', 22, 30),
  daily('habit', 8),
  { group: 'habit', trigger: { kind: 'weekly', weekday: 2, hour: 23, minute: 0 }, ref: 'weekly23' },
  { group: 'study', trigger: { kind: 'date', date: new Date(2026, 10, 14, 6, 0) }, ref: 'due6' },
  { group: 'alarm', trigger: { kind: 'daily', hour: 5, minute: 30 }, ref: 'alarm' },
  { group: 'timer', trigger: { kind: 'interval', seconds: 600 }, ref: 'timer' },
];
const qr = applyQuietHours(qi, Q);
assert.deepEqual(qr.skipped.map((x) => x.ref), ['sleep@22', 'weekly23']);
assert.equal(qr.deferred, 1);
const due = qr.kept.find((x) => x.ref === 'due6')!;
assert.equal(due.trigger.kind === 'date' && due.trigger.date.getHours(), 7, 'teslim hatırlatıcısı 07:00\'ye ertelendi');
assert.ok(qr.kept.some((x) => x.ref === 'alarm'), 'alarm sessiz saatte de kurulur');
assert.ok(qr.kept.some((x) => x.ref === 'timer'));
assert.equal(applyQuietHours(qi, { ...Q, enabled: false }).kept.length, qi.length, 'kapalıyken hepsi');

// --- günlük üst sınır ---
const now = new Date(2026, 10, 12, 10, 0); // Perşembe
// su: 09-21 arası 2 saatte bir (7 adet), görevler 6 adet, rapor haftalık (Pazar), alarm 2 adet
const items: BudgetItem<string>[] = [
  ...[9, 11, 13, 15, 17, 19, 21].map((h) => daily('drink', h)),
  ...[7, 8, 12, 18, 20, 21].map((h) => daily('habit', h)),
  { group: 'report', trigger: { kind: 'weekly', weekday: 6, hour: 19, minute: 0 }, ref: 'report' },
  daily('alarm', 6, 30, 'alarm1'),
  daily('alarm', 7, 0, 'alarm2'),
];
const c12 = applyDailyCap(items, 12, now);
// görevler (öncelik 1) hepsi kalır, rapor (3) kalır, su (5) kırpılır; alarm sayılmaz ve kırpılmaz
assert.equal(c12.kept.filter((x) => x.group === 'habit').length, 6);
assert.ok(c12.kept.some((x) => x.ref === 'report'));
assert.equal(c12.kept.filter((x) => x.group === 'alarm').length, 2, 'alarm muaf');
const drinkKept = c12.kept.filter((x) => x.group === 'drink').length;
// Pazar: 6 görev + rapor = 7 → su için 5 yer; diğer günlerde 6 → ama her gün tekrar eden su için sınır en dar gün (Pazar)
assert.equal(drinkKept, 5);
assert.equal(c12.trimmed.length, 2);
assert.ok(c12.trimmed.every((x) => x.group === 'drink'), 'önce düşük öncelikli su kırpılır');
assert.ok(c12.peak <= 12);
// sınırsız (0) → hepsi
assert.equal(applyDailyCap(items, 0, now).kept.length, items.length);
// motivasyon/su eşit öncelikte: girdi sırası korunur (erken saatler önce yerleşir)
const low = applyDailyCap([daily('drink', 9), daily('motivation', 10), daily('drink', 11)], 2, now);
assert.deepEqual(low.kept.map((x) => x.ref), ['drink@9', 'motivation@10']);
// tarihli öğe yalnız kendi gününe yük bindirir
const dated = applyDailyCap(
  [
    ...[8, 9].map((h) => daily('habit', h)),
    { group: 'study', trigger: { kind: 'date', date: new Date(2026, 10, 20, 9, 0) }, ref: 'd20' },
    { group: 'study', trigger: { kind: 'date', date: new Date(2026, 10, 20, 18, 0) }, ref: 'd20b' },
  ],
  3,
  now,
);
assert.deepEqual(dated.trimmed.map((x) => x.ref), ['d20b'], '20 Kasım: 2 günlük + 2 tarihli = 4 > 3');

console.log('✅ bildirim bütçesi testleri geçti');
