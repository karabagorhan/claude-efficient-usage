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
const { useCore: useStore, totalsFor, pointsOnDay, today, selectDayStreak, habitsOnDay, myHabits } = require('../src/store/core');
const { standings } = require('../src/engine/leaderboard');
const { addDays } = require('../src/engine/dates');

const S = () => useStore.getState();
const ME = 'me-1', P = 'p-1';
S().setMe({ id: ME, name: 'Ben', emoji: '🦊', color: '#6366F1' });
S().setPartnerLocal({ id: P, name: 'Eş', emoji: '🐼', color: '#EC4899', _u: 1 });

// 3 görev ekle (yeni görev ilk 24 saatte %50: createdAt'i geriye al)
const ids: string[] = [];
for (const [title, d] of [['A', 'medium'], ['B', 'easy'], ['C', 'easy']] as const) {
  const id = S().saveHabit({ id: 'h' + title, title, icon: '✅', difficulty: d, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() });
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

// saveHabit varsayılanları
assert.equal(S().habits.hA.slot, 'anytime');
assert.equal(S().habits.hA.pastel, 'blue');
assert.equal(S().habits.hA.kind, 'check');
assert.equal(habitsOnDay(S(), t0).length, 3);

// Dürtme sınırları (sonuç metin değil anahtar)
const r1 = S().sendNudge('nudge', 'x');
assert.ok(r1.ok || typeof r1.reason?.key === 'string');
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


// ---- Toast'lar metin değil anahtar ----
assert.ok(S().toasts.length > 0 && S().toasts.every((x: any) => typeof x.key === 'string' && x.key.startsWith('toast.')), 'toast anahtarları');
const badgeToast = S().toasts.find((x: any) => x.key === 'toast.newBadge');
assert.ok(badgeToast && typeof badgeToast.params.name === 'object' && badgeToast.params.name.en, 'rozet adı {tr,en}');

// ---- completeLinked ----
assert.equal(S().completeLinked('drink'), null, 'bağlı görev yoksa no-op');
S().saveHabit({ id: 'hW', title: 'Su', icon: '💧', link: 'drink', kind: 'counter', target: 8, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() });
const before = pointsOnDay(S(), ME, t0);
assert.equal(S().setLinkedProgress('drink', 3), null, 'hedefin altında tamamlanmaz');
assert.equal(S().progress[`hW|${t0}`], 3);
const lc = S().completeLinked('drink');
assert.ok(lc && lc.habitId === 'hW', 'bağlı görev tamamlandı');
assert.equal(S().progress[`hW|${t0}`], 8, 'sayaç hedefe çekildi');
assert.equal(S().completeLinked('drink'), null, 'ikinci kez sayılmaz');
assert.ok(pointsOnDay(S(), ME, t0) > before);
assert.equal(S().completeLinked('mood'), null);

// ---- undoLinked (BUG-002): kaynak kayıt geri alınınca bağlı görev + puanı geri alınır ----
const withLinked = pointsOnDay(S(), ME, t0);
assert.equal(S().undoLinked('drink'), 1, 'bağlı su görevi geri alındı');
assert.ok(!S().completions[`c:hW:${t0}`], 'tamamlama silindi');
assert.equal(pointsOnDay(S(), ME, t0), before, 'puan bağlı tamamlamadan önceki değere döner');
assert.equal(S().undoLinked('drink'), 0, 'tamamlanmamışken no-op');
assert.equal(S().undoLinked('meal'), 0, 'bu türde bağlı görev yoksa no-op');
assert.ok(withLinked > before);
// hedefin altındaki ilerleme yeniden tamamlamaz; hedefe yeniden ulaşınca tekrar tamamlanır
assert.equal(S().setLinkedProgress('drink', 7), null);
assert.ok(S().completeLinked('drink'), 'geri alındıktan sonra yeniden tamamlanabilir');
// yemek bağlantısı: aynı akış (ev yemeği kaydı silinince)
S().saveHabit({ id: 'hM', title: 'Ev yemeği', icon: '🍲', link: 'meal', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() });
assert.ok(S().completeLinked('meal'));
const pm = pointsOnDay(S(), ME, t0);
assert.equal(S().undoLinked('meal'), 1);
assert.ok(pointsOnDay(S(), ME, t0) < pm, 'yemek kaydı silinince puan düşer');
S().archiveHabit('hM');

// ---- awardBonus ----
const b1 = S().awardBonus({ id: 'wheel:1', points: 10, label: 'Lavabo', group: 'wheel', perDay: 2 });
assert.ok(b1.ok, 'ilk bonus');
const p1 = pointsOnDay(S(), ME, t0);
const dup = S().awardBonus({ id: 'wheel:1', points: 10, label: 'Lavabo', group: 'wheel', perDay: 2 });
assert.deepEqual(dup, { ok: false, reason: 'duplicate' });
assert.equal(pointsOnDay(S(), ME, t0), p1, 'aynı id ikinci kez puan vermez');
assert.ok(S().awardBonus({ id: 'wheel:2', points: 10, group: 'wheel', perDay: 2 }).ok);
assert.deepEqual(S().awardBonus({ id: 'wheel:3', points: 10, group: 'wheel', perDay: 2 }), { ok: false, reason: 'cap' });
assert.ok(S().awardBonus({ id: 'lucky:1', points: 999, group: 'lucky', perDay: 2 }).ok, 'başka grup tavana takılmaz');
assert.equal(S().events[`bonus:${ME}:lucky:1`].points, 50, 'bonus üst sınırı');
assert.ok(S().dirty[`event|bonus:${ME}:wheel:1`] === 0, 'bonus senkron kuyruğunda');
S().revokeBonus('lucky:1');
assert.ok(!S().events[`bonus:${ME}:lucky:1`]);

// ---- dayStreak / activeDays ----
// Bu kullanıcının tamamlamaları: bugün + 2 gün önce (y2) ; dün (y) 1 görev var → 3 gün
assert.equal(S().dayStreak(), 3);
assert.equal(selectDayStreak(S()), 3);
assert.ok(S().activeDays().has(t0) && S().activeDays().has(y) && S().activeDays().has(y2));
assert.ok(!S().activeDays().has(addDays(t0, -3)));

// ---- logActivity rozetleri besler ----
for (let i = 0; i < 10; i++) S().logActivity('focus');
assert.ok(S().badges[`${ME}:focus10`], 'odak rozeti');

// ---- yaşam takibi rozetleri (dilim import etmeden: activity + bonus grupları) ----
const has = (id: string) => Boolean(S().badges[`${ME}:${id}`]);
for (let i = 1; i <= 6; i++) S().logActivity('smokeOk', addDays(t0, -i));
S().logActivity('smokeOk', addDays(t0, -1)); // aynı gün iki kez sayılmaz
assert.ok(!has('smoke7'), 'limitte 6 gün yetmez');
S().logActivity('smokeOk', t0);
assert.ok(has('smoke7'), 'limitte 7 gün rozeti');

// fast food'suz gün: öğün kaydı var, fast food yok, bugünden önce
for (let i = 1; i <= 8; i++) S().logActivity('meal', addDays(t0, -i));
S().logActivity('fastFood', addDays(t0, -2));
S().logActivity('meal', t0); // bugün sayılmaz (gün kapanmadı)
assert.ok(has('nofast7'), "fast food'suz 7 gün rozeti (8 kayıtlı gün - 1 fast food)");

for (let i = 0; i < 19; i++) S().logActivity('choreDone');
assert.ok(!has('chores20'), '19 ev işi yetmez');
S().logActivity('choreDone');
assert.ok(has('chores20'), '20 ev işi rozeti');

// okul: bonus olayları (refId study:item:*) sayılır; günlük tavan için farklı günlere yay
for (let i = 0; i < 10; i++) S().awardBonus({ id: `study:item:s${i}`, points: 10, group: 'study', perDay: 5, dayKey: addDays(t0, -Math.floor(i / 5)) });
S().awardBonus({ id: 'study:milestone:x', points: 40, group: 'study', perDay: 50 });
assert.ok(has('study10'), '10 okul öğesi rozeti');

assert.ok(!has('goal1'), 'hedef rozeti henüz yok');
S().awardBonus({ id: 'growth:goal:g1', points: 30, group: 'growth', perDay: 5 });
assert.ok(has('goal1'), 'ilk hedef rozeti (bonus olayından)');

// ---- makeHabit: açıkça undefined verilen alan varsayılanı ezmez; düzenlemede undefined temizler ----
const hid = S().saveHabit({ title: 'Undef', icon: '✅', kind: undefined, difficulty: undefined, reminderTime: '08:00' });
assert.equal(S().habits[hid].kind, 'check');
assert.equal(S().habits[hid].difficulty, 'easy');
S().saveHabit({ id: hid, title: 'Undef', icon: '✅', reminderTime: undefined });
assert.equal(S().habits[hid].reminderTime, undefined, 'hatırlatıcı temizlenir');

// ---- arşiv ----
S().archiveHabit('hW');
assert.equal(myHabits(S()).some((h: any) => h.id === 'hW'), false);

// ---- Gelişim: azalan hedef (BUG-001) ----
{
  const { useGrowth } = require('../src/store/slices/growth');
  const { goalProgress } = require('../src/features/growth/calc');
  const G = () => useGrowth.getState();
  const bonusOf = (id: string) => S().events[`bonus:${ME}:growth:goal:${id}`];
  // şu anki değer verilmezse başlangıç değeri sayılır: 90 → 80 hedefi %0'dan başlar, tamamlanmaz, bonus yok
  const gid = G().saveGoal({ title: 'Kilo ver', area: 'health', measure: 'number', startValue: 90, targetValue: 80 });
  assert.equal(G().goals[gid].current, 90, 'current = startValue');
  assert.equal(goalProgress(G().goals[gid]), 0, 'azalan hedef %0');
  assert.ok(!G().goals[gid].doneDay && !bonusOf(gid), 'kaydetmek hedefi tamamlamaz');
  // ilerleme start → target yönünde
  G().saveGoal({ id: gid, title: 'Kilo ver', current: 85 });
  assert.equal(goalProgress(G().goals[gid]), 0.5);
  G().saveGoal({ id: gid, title: 'Kilo ver', current: 80 });
  assert.ok(G().goals[gid].doneDay && bonusOf(gid), 'hedefe inince tamamlanır ve bonus verilir');
  // ters yöne gitmek (kilo almak) ilerleme saymaz
  const g2 = G().saveGoal({ title: 'Kilo 2', measure: 'number', startValue: 90, targetValue: 80, current: 95 });
  assert.equal(goalProgress(G().goals[g2]), 0);
  // "tamamlanmış doğan" yeni hedef bonus vermez (puan avcılığı yok)
  const g3 = G().saveGoal({ title: 'Hazır', measure: 'number', startValue: 0, targetValue: 1, current: 1 });
  assert.ok(G().goals[g3].doneDay, 'tamamlandı işaretlenir');
  assert.ok(!bonusOf(g3), 'ama oluşturulurken bonus verilmez');
}

// ---- Ev işleri: aynı gün ikinci "yaptım" yeni kayıt üretmez (BUG-004) ----
{
  const { useChores } = require('../src/store/slices/chores');
  const C = () => useChores.getState();
  const cid = C().upsert({ name: 'Bulaşık', emoji: '🍽️', area: 'kitchen', every: 1 });
  const id = typeof cid === 'string' ? cid : Object.keys(C().chores)[0];
  assert.ok(C().done(id, t0), 'ilk işaret kaydedilir');
  assert.equal(C().done(id, t0), null, 'aynı gün ikinci işaret yok sayılır');
  assert.equal(Object.values(C().history).filter((h: any) => h.choreId === id && h.dayKey === t0).length, 1);
  assert.equal(C().chores[id].doneCount, 1);
  assert.ok(C().done(id, addDays(t0, 1)), 'ertesi gün yeniden sayılır');
}

// ---- Faz 3: önceden işaretle (advance), arşivi geri al, elle sıralama ----
{
  const core = require('../src/store/core');
  const tomorrow = addDays(t0, 1);
  const hid = S().saveHabit({ id: 'hAdv', title: 'Önceden', icon: '⏩', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() });
  const evBefore = Object.keys(S().events).length;
  const xpBefore = totalsFor(S(), ME).xp;
  // bugün ve geçmiş için önceden işaretleme yok
  assert.equal(S().complete(hid, t0, { advance: true }), null, 'bugün için advance reddedilir');
  const a = S().complete(hid, tomorrow, { advance: true });
  assert.ok(a && a.advance === true && a.points === 0, 'ileri tarih: puansız işaret');
  assert.equal(Object.keys(S().events).length, evBefore, 'puan olayı yazılmaz');
  assert.equal(totalsFor(S(), ME).xp, xpBefore, 'XP değişmez');
  assert.ok(core.isDone(S(), hid, tomorrow), 'o gün tamamlanmış görünür');
  assert.equal(S().complete(hid, tomorrow), null, 'o gün geldiğinde yeniden puan alınmaz (çift sayım yok)');
  assert.equal(pointsOnDay(S(), ME, tomorrow), 0, 'o günün puanı 0');
  assert.ok(!S().activeDays().has(tomorrow), 'gün serisine sayılmaz');
  assert.ok(S().dirty['completion|c:hAdv:' + tomorrow] === 0, 'senkron kuyruğunda');
  // geri alınabilir
  S().undo(hid, tomorrow);
  assert.ok(!core.isDone(S(), hid, tomorrow));

  // arşivle → geri al
  S().archiveHabit(hid);
  assert.ok(!core.myHabits(S()).some((h: any) => h.id === hid), 'arşivlenen listeden çıkar');
  S().unarchiveHabit(hid);
  assert.ok(core.myHabits(S()).some((h: any) => h.id === hid), 'geri alınca listeye döner');
  assert.equal(S().habits[hid].archived, false);

  // sıra: yeni görev en sona (en büyük order + 1); düzenleme sırayı korur
  const o1 = S().saveHabit({ title: 'Sıra 1', icon: '1️⃣', slot: 'evening' });
  const o2 = S().saveHabit({ title: 'Sıra 2', icon: '2️⃣', slot: 'evening', reminderTime: '07:00' });
  const o3 = S().saveHabit({ title: 'Sıra 3', icon: '3️⃣', slot: 'evening' });
  assert.ok(typeof S().habits[o1].order === 'number');
  assert.equal(S().habits[o2].order, S().habits[o1].order + 1);
  assert.equal(S().habits[o3].order, S().habits[o2].order + 1);
  const ord1 = S().habits[o1].order;
  S().saveHabit({ id: o1, title: 'Sıra 1 (düzenlendi)', icon: '1️⃣', slot: 'evening' });
  assert.equal(S().habits[o1].order, ord1, 'düzenleme sırayı değiştirmez');
  const evening = () => core.myHabits(S()).filter((h: any) => [o1, o2, o3].includes(h.id));
  const ids3 = (mode: 'auto' | 'manual') => core.sortHabits(evening(), mode).map((h: any) => h.id);
  assert.deepEqual(ids3('manual'), [o1, o2, o3]);
  assert.deepEqual(ids3('auto'), [o2, o1, o3], 'otomatik: saatli önce');
  // elle taşı: o3'ü en üste, sonra o1'i aşağı
  S().moveHabit(o3, 'top', ids3('manual'));
  assert.deepEqual(ids3('manual'), [o3, o1, o2]);
  S().moveHabit(o1, 'down', ids3('manual'));
  assert.deepEqual(ids3('manual'), [o3, o2, o1]);
  assert.equal(S().moveHabit(o3, 'up', ids3('manual')), 0, 'en üstteki yukarı gitmez');
  assert.ok(S().dirty['habit|' + o3] === 0, 'sıra senkron kuyruğunda (görev belgesi)');
  // eski (order alanı olmayan) görevlerle de çalışır
  const legacy = ['hA', 'hB'].filter((x) => S().habits[x]);
  for (const id of legacy) useStore.setState((st: any) => ({ habits: { ...st.habits, [id]: { ...st.habits[id], order: undefined } } }));
  S().moveHabit('hB', 'up', ['hA', 'hB']);
  assert.ok(S().habits.hB.order < S().habits.hA.order, 'order yoksa sıralı değer atanır');
  assert.deepEqual(core.moveInList([1, 2, 3], 2, 'top'), [3, 1, 2]);
}

// ---- Faz 3: kalıcı durum bozuksa dilim çökmez ----
{
  const { parseStored, safeMerge } = require('../src/store/safeStorage');
  assert.equal(parseStored('{bozuk').ok, false);
  assert.equal(parseStored('[1,2]').ok, false);
  assert.equal(parseStored('{"state":"x"}').ok, false);
  assert.deepEqual(parseStored(null), { ok: true, value: null });
  assert.equal(parseStored('{"state":{"a":1},"version":1}').ok, true);
  const def = { list: [] as number[], map: {} as Record<string, number>, me: null as any, n: 1, fn: () => 1 };
  const m = safeMerge({ list: 'oops', map: [1], me: { id: 'x' }, n: 5, fn: 'kötü' }, def);
  assert.deepEqual(m.list, [], 'tür uyuşmazlığı → varsayılan');
  assert.deepEqual(m.map, {});
  assert.deepEqual(m.me, { id: 'x' }, 'null varsayılan her türü kabul eder');
  assert.equal(m.n, 5);
  assert.equal(typeof m.fn, 'function', 'işlev ezilmez');
  assert.equal(safeMerge('çöp', def), def);
}
{
  // AsyncStorage'da bozuk JSON: rehydrate çökmez, varsayılanla devam eder, ham değer yedeklenir
  const { useMood } = require('../src/store/slices/mood');
  mem['all2me-mood-v1'] = '{"state": {bozuk';
  const warns: string[] = [];
  const ow = console.warn;
  console.warn = (...a: any[]) => { warns.push(a.join(' ')); };
  let threw = false;
  (async () => {
    try { await useMood.persist.rehydrate(); } catch { threw = true; }
    console.warn = ow;
    assert.equal(threw, false, 'rehydrate fırlatmaz');
    assert.equal(useMood.getState().hydrated, true);
    assert.ok(warns.some((w) => w.includes('bozuk kayıt')), 'konsol uyarısı');
    assert.equal(mem['all2me-mood-v1-corrupt'], '{"state": {bozuk', 'ham değer yedeklenir');
    console.log('✅ bozuk kalıcı durum testi geçti');
  })();
}

console.log('✅ store testleri geçti');
