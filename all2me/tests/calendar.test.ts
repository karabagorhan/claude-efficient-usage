/** Takvim olay alanları (saf): npx tsx tests/calendar.test.ts */
import assert from 'node:assert/strict';
import { calKey, COURSE_WEEKS, courseEventSpecs, dueEventSpec, habitEventSpecs, HABIT_DAYS, localDate, nextWeekdayAt, weekdayIndex, ymd } from '../src/lib/calendarSpec';

// Çarşamba 11 Kasım 2026, 10:00 (yerel)
const NOW = new Date(2026, 10, 11, 10, 0, 0, 0);
assert.equal(weekdayIndex(NOW), 2);

// localDate
assert.equal(localDate('2026-02-31'), null);
assert.equal(localDate('x'), null);
assert.equal(localDate('2026-11-20', '25:00'), null);
const d = localDate('2026-11-20', '14:30')!;
assert.equal(ymd(d), '2026-11-20');
assert.equal(d.getHours(), 14);
assert.equal(d.getMinutes(), 30);

// teslim: saatli
let s = dueEventSpec({ title: 'Ödev', due: '2026-11-20', time: '14:30' })!;
assert.equal(s.startDate.getHours(), 14);
assert.equal(s.endDate.getTime() - s.startDate.getTime(), 30 * 60000);
assert.deepEqual(s.alarmOffsets, [-1440, -60]);
assert.equal(s.recurrence, undefined);
// teslim: saatsiz -> 09:00, yalnız 1 gün önce
s = dueEventSpec({ title: 'Sınav', due: '2026-12-01' })!;
assert.equal(s.startDate.getHours(), 9);
assert.deepEqual(s.alarmOffsets, [-1440]);
// geçersiz tarih
assert.equal(dueEventSpec({ title: 'x', due: '2026-13-01' }), null);
// bozuk saat -> saatsiz gibi
assert.equal(dueEventSpec({ title: 'x', due: '2026-12-01', time: '99:99' })!.startDate.getHours(), 9);

// nextWeekdayAt: bugün Çarşamba 10:00; Çarşamba 09:00 geçmiş -> sonraki hafta; 11:00 -> bugün
let n = nextWeekdayAt(2, '09:00', NOW)!;
assert.equal(ymd(n), '2026-11-18');
n = nextWeekdayAt(2, '11:00', NOW)!;
assert.equal(ymd(n), '2026-11-11');
n = nextWeekdayAt(0, '09:00', NOW)!; // Pazartesi
assert.equal(ymd(n), '2026-11-16');
assert.equal(nextWeekdayAt(1, 'bad', NOW), null);

// ders: iki slot, haftalık tekrar, 16 hafta
const cs = courseEventSpecs({ title: 'CS101', slots: [{ day: 0, start: '09:00', end: '11:00' }, { day: 3, start: '13:30', end: '15:00' }] }, NOW);
assert.equal(cs.length, 2);
assert.equal(ymd(cs[0].startDate), '2026-11-16');
assert.equal(cs[0].endDate.getHours(), 11);
assert.equal(cs[0].recurrence!.frequency, 'weekly');
const spanDays = Math.round((cs[0].recurrence!.endDate.getTime() - cs[0].startDate.getTime()) / 86400000);
assert.equal(spanDays, COURSE_WEEKS * 7 - 1);
assert.equal(ymd(cs[1].startDate), '2026-11-12'); // Perşembe
// bitiş <= başlangıç -> 60 dk
const bad = courseEventSpecs({ title: 'x', slots: [{ day: 0, start: '10:00', end: '09:00' }] }, NOW);
assert.equal(bad[0].endDate.getTime() - bad[0].startDate.getTime(), 3600000);
assert.deepEqual(courseEventSpecs({ title: 'x', slots: [] }, NOW), []);

// görev: her gün -> tek günlük; saat geçmişse yarın
let hs = habitEventSpecs({ title: '💧 Su', time: '09:00', days: [] }, NOW);
assert.equal(hs.length, 1);
assert.equal(hs[0].recurrence!.frequency, 'daily');
assert.equal(ymd(hs[0].startDate), '2026-11-12');
hs = habitEventSpecs({ title: 'x', time: '21:00', days: [0, 1, 2, 3, 4, 5, 6] }, NOW);
assert.equal(ymd(hs[0].startDate), '2026-11-11');
assert.equal(Math.round((hs[0].recurrence!.endDate.getTime() - hs[0].startDate.getTime()) / 86400000), HABIT_DAYS);
// haftalık kota -> günlük
assert.equal(habitEventSpecs({ title: 'x', time: '21:00', days: [], weeklyQuota: true }, NOW)[0].recurrence!.frequency, 'daily');
// belirli günler -> gün başına haftalık
hs = habitEventSpecs({ title: 'x', time: '08:00', days: [4, 0, 0] }, NOW);
assert.equal(hs.length, 2);
assert.deepEqual(hs.map((x) => weekdayIndex(x.startDate)), [0, 4]);
assert.ok(hs.every((x) => x.recurrence!.frequency === 'weekly' && x.startDate.getTime() >= NOW.getTime()));
// geçersiz saat
assert.deepEqual(habitEventSpecs({ title: 'x', time: '7:5', days: [] }, NOW), []);

// anahtarlar
assert.equal(calKey.item('a'), 'item:a');
assert.equal(calKey.course('b'), 'course:b');
assert.equal(calKey.habit('c'), 'habit:c');


// esnek tekrar: her 2 haftada bir Pzt+Cum → gün başına haftalık (interval 2) olay; aylık → monthly
{
  const from = new Date(2026, 10, 12, 10, 0);
  const w = habitEventSpecs({ title: 'X', time: '08:00', days: [0, 4], every: { unit: 'week', n: 2, anchor: '2026-11-04' } }, from);
  assert.equal(w.length, 2);
  assert.ok(w.every((e) => e.recurrence?.frequency === 'weekly' && e.recurrence.interval === 2));
  assert.deepEqual(w.map((e) => e.startDate.getDate()).sort((a, b) => a - b), [6, 16], 'Cum 6 (çapa haftası), Pzt 16 (Pzt 2 çapadan önce)');
  const m = habitEventSpecs({ title: 'Y', time: '09:30', days: [], every: { unit: 'month', n: 3, anchor: '2026-01-15' } }, from);
  assert.equal(m.length, 1);
  assert.equal(m[0].recurrence?.frequency, 'monthly');
  assert.equal(m[0].recurrence?.interval, 3);
  assert.equal(m[0].startDate.getHours(), 9);
  assert.ok(habitEventSpecs({ title: 'Z', time: '09:30', days: [], every: { unit: 'day', n: 2, anchor: 'kötü' } }, from).length === 0);
}

console.log('calendar.test.ts OK');
