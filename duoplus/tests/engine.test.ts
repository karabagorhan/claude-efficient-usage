import assert from 'node:assert/strict';
import { addDays, dayKeyOf, weekStartKey, weekdayOf, periodRange } from '../src/engine/dates';
import { levelFromXp, xpForLevel } from '../src/engine/levels';
import { currentStreak, scoreCompletion, deriveBonusEvents, multiplierForStreak } from '../src/engine/points';
import { standings } from '../src/engine/leaderboard';
import type { Completion, Habit, PointEvent } from '../src/engine/types';

const mk = (id: string, over: Partial<Habit> = {}): Habit => ({
  id, ownerId: 'A', title: id, icon: '✅', color: '#000', category: 'Sabah', difficulty: 'easy', kind: 'check',
  schedule: { days: [] }, isPrivate: false, together: false, createdAt: '2026-01-01T00:00:00.000Z', archived: false, ...over,
});
const comp = (h: string, day: string, userId = 'A', pts = 10): Completion => ({
  id: `c:${h}:${day}`, habitId: h, userId, dayKey: day, completedAt: `${day}T10:00:00.000Z`, points: pts, base: pts, multiplier: 1, earlyBonus: 0,
});

// Tarihler
assert.equal(dayKeyOf(new Date(2026, 10, 9, 2, 30)), '2026-11-08'); // 02:30 -> önceki gün
assert.equal(dayKeyOf(new Date(2026, 10, 9, 3, 0)), '2026-11-09');
assert.equal(weekdayOf('2026-11-09'), 0); // Pazartesi
assert.equal(weekStartKey('2026-11-15'), '2026-11-09'); // Pazar -> o haftanın Pzt'si
assert.deepEqual(periodRange('week', '2026-11-11'), ['2026-11-09', '2026-11-15']);
assert.deepEqual(periodRange('month', '2026-02-10'), ['2026-02-01', '2026-02-28']);
assert.equal(addDays('2026-12-31', 1), '2027-01-01');

// Seviye
assert.equal(xpForLevel(1), 0);
assert.equal(xpForLevel(10), 3060);
assert.equal(levelFromXp(3059).level, 9);
assert.equal(levelFromXp(3060).level, 10);

// Çarpan
assert.equal(multiplierForStreak(2), 1);
assert.equal(multiplierForStreak(7), 1.2);
assert.equal(multiplierForStreak(60), 1.5);

// Seri: planlı olmayan gün nötr, bugün yapılmadıysa bozulmaz
const h = mk('h1', { schedule: { days: [0, 2, 4] } }); // Pzt-Çar-Cum
const today = '2026-11-13'; // Cuma
const done = [comp('h1', '2026-11-09'), comp('h1', '2026-11-11')];
assert.equal(currentStreak(h, done, today), 2); // Cuma henüz yapılmadı
assert.equal(currentStreak(h, [...done, comp('h1', '2026-11-13')], today), 3);
assert.equal(currentStreak(h, [comp('h1', '2026-11-11')], today), 1); // Pzt kaçtı → kırıldı

// Puan: hafta 7 seri => x1.2, medium=20 -> 24
const med = mk('m', { difficulty: 'medium' });
const s = scoreCompletion({ habit: med, streakDays: 7, completedAt: new Date('2026-11-13T12:00:00'), todays: [], habitsById: { m: med }, dayTotalSoFar: 0 });
assert.equal(s.points, 24);
// Yeni görev ilk 24 saat %50
const fresh = mk('f', { difficulty: 'medium', createdAt: new Date().toISOString() });
const s2 = scoreCompletion({ habit: fresh, streakDays: 1, completedAt: new Date(), todays: [], habitsById: { f: fresh }, dayTotalSoFar: 0 });
assert.equal(s2.points, 10);
// Sert tavan: 340 sonrası ekleme en fazla 350'ye çıkar
const epic = mk('e', { difficulty: 'epic' });
const s3 = scoreCompletion({ habit: epic, streakDays: 1, completedAt: new Date('2026-11-13T12:00:00'), todays: [], habitsById: { e: epic }, dayTotalSoFar: 340 });
assert.ok(s3.points <= 10, `tavan: ${s3.points}`);
// Mini limit (günde 6)
const mini = mk('mi', { difficulty: 'mini' });
const six = Array.from({ length: 6 }, (_, i) => comp(`mi`, `2026-11-13`)).map((c, i) => ({ ...c, id: 'x' + i }));
const s4 = scoreCompletion({ habit: mini, streakDays: 1, completedAt: new Date('2026-11-13T12:00:00'), todays: six, habitsById: { mi: mini }, dayTotalSoFar: 30 });
assert.equal(s4.points, 0);

// Mükemmel gün: 3 görev (10+10+10 = 30 * .15 = 4.5 -> min 10)
const hs = [mk('a'), mk('b'), mk('c')];
const all = hs.map((x) => comp(x.id, '2026-11-13'));
const ev = deriveBonusEvents(hs, all, 'A', '2026-11-13');
assert.equal(ev.find((e) => e.type === 'perfect_day')?.points, 10);
assert.equal(deriveBonusEvents(hs, all.slice(0, 2), 'A', '2026-11-13').length, 0); // 2/3 = %67 < %80
// Geri alınan tamamlama bonusu düşürür
assert.equal(deriveBonusEvents(hs, all.map((c, i) => (i === 0 ? { ...c, undone: true } : c)), 'A', '2026-11-13').length, 0);
// Yeni başlayan koruması: %80 yeter
const five = ['a', 'b', 'c', 'd', 'e'].map((i) => mk(i));
const fourDone = ['a', 'b', 'c', 'd'].map((i) => comp(i, '2026-11-13'));
assert.ok(deriveBonusEvents(five, fourDone, 'A', '2026-11-13', true).some((e) => e.type === 'perfect_day'));
assert.ok(deriveBonusEvents(five, fourDone, 'A', '2026-11-13', false).some((e) => e.type === 'almost_perfect'));

// Liderlik: günlük eşik 40 SP + 3 görev
const E = (userId: string, day: string, points: number): PointEvent => ({ id: `${userId}${day}${points}`, userId, dayKey: day, type: 'completion', points, createdAt: day });
const cs: Completion[] = [];
for (const u of ['A', 'B']) for (let i = 0; i < 3; i++) cs.push({ ...comp(`h${i}`, '2026-11-12', u), id: `${u}${i}` });
const evs = [E('A', '2026-11-12', 60), E('B', '2026-11-12', 50)];
const st = standings('day', '2026-11-12', ['A', 'B'], evs, cs, '2026-11-13');
assert.equal(st.winnerId, 'A');
const tie = standings('day', '2026-11-12', ['A', 'B'], [E('A', '2026-11-12', 50), E('B', '2026-11-12', 50)], cs, '2026-11-13');
assert.equal(tie.winnerId, null);
assert.equal(tie.tie, true);
const low = standings('day', '2026-11-12', ['A', 'B'], [E('A', '2026-11-12', 30), E('B', '2026-11-12', 20)], cs, '2026-11-13');
assert.equal(low.winnerId, null); // eşik altı
// XP-only olaylar liderliğe sayılmaz
const xpOnly = standings('day', '2026-11-12', ['A', 'B'], [...evs, { ...E('B', '2026-11-12', 500), type: 'badge' }], cs, '2026-11-13');
assert.equal(xpOnly.winnerId, 'A');

console.log('✅ motor testleri geçti');
