import assert from 'node:assert/strict';
import { addDays, dayKeyOf, diffDays, diffMonths, eachDay, weekStartKey, weekdayOf, periodRange } from '../src/engine/dates';
import { levelFromXp, xpForLevel } from '../src/engine/levels';
import { currentStreak, scoreCompletion, deriveBonusEvents, multiplierForStreak, isPlannedOn, nextPlannedDays, validEvery, computeDayBonuses } from '../src/engine/points';
import { evaluateBadges } from '../src/engine/badges';
import { dayStats } from '../src/engine/leaderboard';
import { standings } from '../src/engine/leaderboard';
import { activeDaySet, dayStreakFrom } from '../src/engine/streak';
import type { Completion, Habit, PointEvent } from '../src/engine/types';

const mk = (id: string, over: Partial<Habit> = {}): Habit => ({
  id, ownerId: 'A', title: id, icon: '✅', slot: 'anytime', pastel: 'blue', difficulty: 'easy', kind: 'check',
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

// Bonus etiketleri i18n anahtarı (metin değil)
assert.equal(ev.find((e) => e.type === 'perfect_day')?.labelKey, 'points.event.perfect_day');
assert.equal(levelFromXp(0).titleKey, 'points.level.rookie');
assert.equal(s2.note, 'points.note.newTask');

// Gün serisi: bugün yoksa dünden sayar, boşluk kırar
const dd = activeDaySet([comp('a', '2026-11-12'), comp('b', '2026-11-11'), comp('a', '2026-11-09'), { ...comp('z', '2026-11-10'), undone: true }], 'A');
assert.equal(dayStreakFrom(dd, '2026-11-13'), 2); // 12, 11 (bugün 13 henüz yok); 10 geri alınmış → kırılır
assert.equal(dayStreakFrom(dd, '2026-11-12'), 2);
assert.equal(dayStreakFrom(dd, '2026-11-14'), 0); // dün (13) yok
assert.equal(dayStreakFrom(new Set(['2026-11-13']), '2026-11-13'), 1);

// ---------------------------------------------------------------- Esnek tekrar (schedule.every)
assert.equal(diffDays('2026-01-30', '2026-03-01'), 30);
assert.equal(diffDays('2026-03-28', '2026-03-30'), 2); // yaz saati geçişi (29 Mart) gün farkını bozmaz
assert.equal(diffMonths('2026-11-30', '2027-02-01'), 3);
const planned = (hb: Habit, from: string, to: string) => eachDay(from, to).filter((d) => isPlannedOn(hb, d));

// her 3 günde bir, çapa 2026-11-02 (çapadan önce planlı değil)
const e3 = mk('e3', { schedule: { days: [], every: { unit: 'day', n: 3, anchor: '2026-11-02' } } });
assert.deepEqual(planned(e3, '2026-10-30', '2026-11-12'), ['2026-11-02', '2026-11-05', '2026-11-08', '2026-11-11']);
// ay/yıl geçişi: 30 Aralık çapalı her 2 gün → 1 Ocak
const e2 = mk('e2', { schedule: { days: [], every: { unit: 'day', n: 2, anchor: '2026-12-30' } } });
assert.deepEqual(planned(e2, '2026-12-29', '2027-01-04'), ['2026-12-30', '2027-01-01', '2027-01-03']);

// her 2 haftada bir: çapanın haftanın günü (Çar 2026-11-04) → 04, 18, 2 Ara
const w2 = mk('w2', { schedule: { days: [], every: { unit: 'week', n: 2, anchor: '2026-11-04' } } });
assert.deepEqual(planned(w2, '2026-11-01', '2026-12-06'), ['2026-11-04', '2026-11-18', '2026-12-02']);
// her 2 haftada bir Pzt+Cum (günler seçili): çapa haftası (2-8 Kasım) ve iki hafta sonrası; çapa (Çar 4) öncesindeki Pzt 2 sayılmaz
const w2d = mk('w2d', { schedule: { days: [0, 4], every: { unit: 'week', n: 2, anchor: '2026-11-04' } } });
assert.deepEqual(planned(w2d, '2026-11-01', '2026-11-22'), ['2026-11-06', '2026-11-16', '2026-11-20']);

// her ay 31'inde: kısa aylarda ayın son günü (Şubat 28, artık yılda 29; Nisan 30)
const m31 = mk('m31', { schedule: { days: [], every: { unit: 'month', n: 1, anchor: '2026-01-31' } } });
assert.deepEqual(planned(m31, '2026-01-01', '2026-05-31'), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
const m31leap = mk('m31l', { schedule: { days: [], every: { unit: 'month', n: 1, anchor: '2027-12-31' } } });
assert.ok(isPlannedOn(m31leap, '2028-02-29') && !isPlannedOn(m31leap, '2028-02-28'), 'artık yıl: 29 Şubat');
// 3 ayda bir, 15'inde (çeyrek)
const q3 = mk('q3', { schedule: { days: [], every: { unit: 'month', n: 3, anchor: '2026-01-15' } } });
assert.deepEqual(planned(q3, '2026-01-01', '2026-12-31'), ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15']);
assert.deepEqual(nextPlannedDays(q3, '2026-05-01', 2), ['2026-07-15', '2026-10-15']);

// 03:00 gün sınırı: 1 Şubat 02:30'daki iş 31 Ocak'a yazılır → "her ay 31'inde" görev o gün planlı
assert.equal(dayKeyOf(new Date(2026, 1, 1, 2, 30)), '2026-01-31');
assert.ok(isPlannedOn(m31, dayKeyOf(new Date(2026, 1, 1, 2, 30))));
assert.ok(!isPlannedOn(m31, dayKeyOf(new Date(2026, 1, 1, 3, 0))), '03:00 ve sonrası yeni gün (1 Şubat) planlı değil');
// her 2 gün, çapa 10 Kasım: 12 Kasım 01:00 hâlâ 11 Kasım (planlı değil), 12 Kasım 03:00 planlı
const b2 = mk('b2', { schedule: { days: [], every: { unit: 'day', n: 2, anchor: '2026-11-10' } } });
assert.ok(!isPlannedOn(b2, dayKeyOf(new Date(2026, 10, 12, 1, 0))));
assert.ok(isPlannedOn(b2, dayKeyOf(new Date(2026, 10, 12, 3, 0))));

// bozuk esnek tekrar yok sayılır (her gün gibi davranır), kota varsa kota öncelikli
assert.equal(validEvery({ unit: 'day', n: 0, anchor: '2026-11-01' }), false);
assert.equal(validEvery({ unit: 'year' as any, n: 1, anchor: '2026-11-01' }), false);
assert.ok(isPlannedOn(mk('bad', { schedule: { days: [], every: { unit: 'day', n: 2, anchor: 'x' } } }), '2026-11-03'));
assert.ok(!isPlannedOn(mk('qq', { schedule: { days: [], weeklyQuota: 2, every: { unit: 'day', n: 2, anchor: '2026-11-01' } } }), '2026-11-03'));

// seri: planlı olmayan günler nötr (her 3 günde bir, 3 oluşum art arda → seri 3; biri kaçarsa kırılır)
assert.equal(currentStreak(e3, [comp('e3', '2026-11-05'), comp('e3', '2026-11-08'), comp('e3', '2026-11-11')], '2026-11-12'), 3);
assert.equal(currentStreak(e3, [comp('e3', '2026-11-02'), comp('e3', '2026-11-08'), comp('e3', '2026-11-11')], '2026-11-12'), 2);
// aylık 31: Şubat 28 yapıldıysa seri sürer
assert.equal(currentStreak(m31, [comp('m31', '2026-01-31'), comp('m31', '2026-02-28'), comp('m31', '2026-03-31')], '2026-04-10'), 3);
// rozet: esnek tekrarlı görevin serisi rozetleri besler (3 oluşum → streak3)
const badgeCtx = { userId: 'A', today: '2026-11-12', events: [], moodDays: 0, journalCount: 0, focusSessions: 0, breathSessions: 0, dayStreak: 0, wheelTasks: 0, nudgesSent: 0, cheersSent: 0, paired: false, wins: { day: 0, week: 0, month: 0 }, comeback: false };
assert.ok(evaluateBadges({ ...badgeCtx, habits: [e3], completions: [comp('e3', '2026-11-05'), comp('e3', '2026-11-08'), comp('e3', '2026-11-11')] }).includes('streak3'));

// ---------------------------------------------------------------- Önceden işaretle (completion.advance)
// Kural: puan 0; görev serisinde o gün NÖTR (ne artırır ne bozar); gün serisine, liderliğe, rozete ve
// mükemmel gün bonusuna SAYILMAZ.
const adv = (hb: string, day: string): Completion => ({ ...comp(hb, day, 'A', 0), base: 0, advance: true });
const daily = mk('d1');
// 10 ve 12 normal, 11 önceden işaretli → 11 nötr: seri 2 (kırılmaz ama 11 sayılmaz)
assert.equal(currentStreak(daily, [comp('d1', '2026-11-10'), adv('d1', '2026-11-11'), comp('d1', '2026-11-12')], '2026-11-12'), 2);
// gün serisi: yalnız önceden işaretlenen gün aktif gün sayılmaz
const advDays = activeDaySet([comp('a', '2026-11-12'), adv('a', '2026-11-11'), comp('a', '2026-11-10')], 'A');
assert.ok(!advDays.has('2026-11-11'));
assert.equal(dayStreakFrom(advDays, '2026-11-12'), 1);
// liderlik gün istatistiği: görev sayısına girmez
assert.equal(dayStats('A', [], [adv('a', '2026-11-12'), adv('b', '2026-11-12')], '2026-11-12', '2026-11-12')['2026-11-12'].tasks, 0);
// mükemmel gün: önceden işaretli görev plandan düşer (3 planlıdan biri önceden → kalan 2 < minTasks: bonus yok)
const ph = [mk('p1'), mk('p2'), mk('p3')];
const bon = computeDayBonuses(ph, [adv('p1', '2026-11-12'), comp('p2', '2026-11-12'), comp('p3', '2026-11-12')], 'A', '2026-11-12');
assert.equal(bon.plannedCount, 2);
assert.equal(bon.perfect, 0);
// rozet: yalnız önceden işaretli tamamlama "ilk adım" rozetini vermez
assert.ok(!evaluateBadges({ ...badgeCtx, habits: [daily], completions: [adv('d1', '2026-11-12')] }).includes('first'));

console.log('✅ motor testleri geçti');
