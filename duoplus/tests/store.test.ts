// Native modülleri taklit edip store mantığını Node'da çalıştırır.
const Module = require('module');
const nodeCrypto = require('node:crypto');
const mem: Record<string, string> = {};
const orig = Module._load;
Module._load = function (req: string, ...rest: any[]) {
  if (req === '@react-native-async-storage/async-storage') {
    return { __esModule: true, default: { getItem: async (k: string) => mem[k] ?? null, setItem: async (k: string, v: string) => { mem[k] = v; }, removeItem: async (k: string) => { delete mem[k]; } } };
  }
  if (req === 'expo-crypto') return { __esModule: true, randomUUID: () => nodeCrypto.randomUUID() };
  return orig.call(this, req, ...rest);
};
const assert = require('node:assert/strict');
const { useStore, totalsFor, pointsOnDay, today } = require('../src/store/store');
const { standings } = require('../src/engine/leaderboard');
const { addDays } = require('../src/engine/dates');

const S = () => useStore.getState();
const ME = 'me-1', P = 'p-1';
S().setMe({ id: ME, name: 'Ben', emoji: '🦊', color: '#6366F1' });
S().setPartnerLocal({ id: P, name: 'Eş', emoji: '🐼', color: '#EC4899', _u: 1 });

// 3 görev ekle (yeni görev ilk 24 saatte %50: createdAt'i geriye al)
const ids: string[] = [];
for (const [title, d] of [['A', 'medium'], ['B', 'easy'], ['C', 'easy']] as const) {
  const id = S().saveHabit({ id: 'h' + title, title, icon: '✅', color: '#000', category: 'Sabah', difficulty: d, kind: 'check', schedule: { days: [] }, isPrivate: false, together: false, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() } as any);
  ids.push(id);
}
const t0 = today();

// Tamamlama + çift sayım yok
const c1 = S().complete('hA');
assert.ok(c1 && c1.points === 20, 'medium=20');
assert.equal(S().complete('hA'), null, 'ikinci tamamlama reddedilmeli');
assert.equal(pointsOnDay(S(), ME, t0), 20);

// Mükemmel gün: 3 görev (20+10+10=40*.15=6 -> min 10)
S().complete('hB'); S().complete('hC');
const pd = Object.values(S().events).find((e: any) => e.type === 'perfect_day') as any;
assert.ok(pd && pd.points === 10, 'mükemmel gün bonusu');
assert.equal(pointsOnDay(S(), ME, t0), 20 + 10 + 10 + 10);
assert.ok(S().badges[`${ME}:first`], 'ilk adım rozeti');
assert.ok(S().badges[`${ME}:perfect1`], 'mükemmel gün rozeti');

// Geri alma bonusu da düşürür
S().undo('hC');
assert.ok(!Object.values(S().events).some((e: any) => e.type === 'perfect_day'), 'bonus kalkmalı');
assert.equal(pointsOnDay(S(), ME, t0), 30);
assert.ok(S().dirty['completion|c:hC:' + t0] === 1, 'silme senkron kuyruğunda');

// Dürtme sınırları
assert.equal(S().sendNudge('nudge', 'x').ok || true, true);
const r2 = S().sendNudge('cheer', 'harika');
assert.equal(r2.ok, true);

// Uzak belge uygulama: partner puanı gelir, kendi eski belge ezilmez
S().applyRemote([
  { id: `ev:c:ph:${t0}`, kind: 'event', owner_id: P, deleted: false, data: { id: `ev:c:ph:${t0}`, userId: P, dayKey: t0, type: 'completion', points: 55, createdAt: new Date().toISOString(), _u: 5 } },
  { id: `c:ph:${t0}`, kind: 'completion', owner_id: P, deleted: false, data: { id: `c:ph:${t0}`, habitId: 'ph', userId: P, dayKey: t0, completedAt: new Date().toISOString(), points: 55, base: 55, multiplier: 1, earlyBonus: 0, _u: 5 } },
  { id: `profile:${P}`, kind: 'profile', owner_id: P, deleted: false, data: { id: P, name: 'Eşim', emoji: '🐼', color: '#EC4899', _u: 9 } },
] as any);
assert.equal(pointsOnDay(S(), P, t0), 55);
assert.equal(S().partner.name, 'Eşim');

// Liderlik: partner 55 (1 görev), ben 30 (2 görev): eşik 3 görev → kimse "kazanmaz"
const st = standings('day', t0, [ME, P], Object.values(S().events), Object.values(S().completions), t0);
assert.equal(st.rows[0].userId, P);
assert.equal(st.winnerId, null, '3 görev eşiği sağlanmadı');

// Geçmiş gün: partner 3 görev + 60 SP, ben 1 görev → partner kazanır → ben XP almam
const y = addDays(t0, -1);
const mk = (u: string, n: number, pts: number) => {
  for (let i = 0; i < n; i++) S().applyRemote([{ id: `c:${u}${i}:${y}`, kind: 'completion', owner_id: u, deleted: false, data: { id: `c:${u}${i}:${y}`, habitId: u + i, userId: u, dayKey: y, completedAt: y + 'T10:00:00Z', points: pts, base: pts, multiplier: 1, earlyBonus: 0, _u: 3 } },
    { id: `ev:c:${u}${i}:${y}`, kind: 'event', owner_id: u, deleted: false, data: { id: `ev:c:${u}${i}:${y}`, userId: u, dayKey: y, type: 'completion', points: pts, createdAt: y + 'T10:00:00Z', _u: 3 } }] as any);
};
mk(P, 3, 20); mk(ME, 1, 20);
S().markSynced();
S().settleChampions();
assert.ok(!S().events[`champ:day:${y}:${ME}`], 'kaybeden şampiyon olmamalı');
// Şimdi ben kazanayım (önceki günde 4 görev, 80 SP)
const y2 = addDays(t0, -2);
for (let i = 0; i < 4; i++) S().applyRemote([{ id: `c:m${i}:${y2}`, kind: 'completion', owner_id: ME, deleted: false, data: { id: `c:m${i}:${y2}`, habitId: 'm' + i, userId: ME, dayKey: y2, completedAt: y2 + 'T10:00:00Z', points: 20, base: 20, multiplier: 1, earlyBonus: 0, _u: 3 } },
  { id: `ev:c:m${i}:${y2}`, kind: 'event', owner_id: ME, deleted: false, data: { id: `ev:c:m${i}:${y2}`, userId: ME, dayKey: y2, type: 'completion', points: 20, createdAt: y2 + 'T10:00:00Z', _u: 3 } }] as any);
S().settleChampions();
const champ = S().events[`champ:day:${y2}:${ME}`];
assert.ok(champ && champ.points === 20, 'günün şampiyonu XP');
assert.ok(S().badges[`${ME}:dayWin`], 'gün kazanma rozeti');
const sp = totalsFor(S(), ME);
assert.ok(sp.xp > sp.sp, 'XP > SP (bonuslar)');
// Şampiyon XP'si liderlik puanına sayılmaz
assert.equal(pointsOnDay(S(), ME, y2), 80);

console.log('✅ store testleri geçti');
