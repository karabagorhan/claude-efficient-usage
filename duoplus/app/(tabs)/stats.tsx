import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Bar, Card, Row, Screen, Segmented, SectionTitle, Txt } from '../../src/components/ui';
import { addDays, daysInMonth, eachDay, monthStartKey, parseDayKey, TR_DAYS_SHORT, TR_MONTHS, weekdayOf } from '../../src/engine/dates';
import { dayStats } from '../../src/engine/leaderboard';
import { currentStreak, isPlannedOn } from '../../src/engine/points';
import { totalsFor, today as todayKey, useStore } from '../../src/store/store';
import { MOODS, useTheme } from '../../src/theme';

export default function Stats() {
  const t = useTheme();
  const s = useStore();
  const me = s.me!;
  const t0 = todayKey();
  const [range, setRange] = useState<'7' | '30'>('7');

  const habits = useMemo(() => Object.values(s.habits).filter((h) => h.ownerId === me.id), [s.habits, me.id]);
  const comps = useMemo(() => Object.values(s.completions).filter((c) => c.userId === me.id), [s.completions, me.id]);
  const events = useMemo(() => Object.values(s.events), [s.events]);

  const n = range === '7' ? 7 : 30;
  const from = addDays(t0, -(n - 1));
  const stats = useMemo(() => dayStats(me.id, events, comps, from, t0), [events, comps, from, t0, me.id]);
  const pstats = useMemo(() => (s.partner ? dayStats(s.partner.id, events, Object.values(s.completions), from, t0) : null), [events, s.completions, from, t0, s.partner?.id]);
  const days = eachDay(from, t0);
  const max = Math.max(10, ...days.map((d) => Math.max(stats[d].points, pstats?.[d]?.points ?? 0)));
  const totalPts = days.reduce((a, d) => a + stats[d].points, 0);
  const avg = Math.round(totalPts / n);

  // Tamamlama oranı (planlı görevler üzerinden)
  const rates = days.map((d) => {
    const plan = habits.filter((h) => isPlannedOn(h, d));
    if (!plan.length) return null;
    const done = plan.filter((h) => comps.some((c) => c.habitId === h.id && c.dayKey === d)).length;
    return done / plan.length;
  });
  const valid = rates.filter((r): r is number => r !== null);
  const avgRate = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;

  const { xp, sp } = totalsFor(s, me.id);
  const best = habits
    .filter((h) => !h.archived)
    .map((h) => ({ h, streak: currentStreak(h, comps, t0) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  // Isı haritası: bu ay
  const ms = monthStartKey(t0);
  const mdays = Array.from({ length: daysInMonth(t0) }, (_, i) => addDays(ms, i));
  const offset = weekdayOf(ms);
  const cells: Array<string | null> = [...Array(offset).fill(null), ...mdays];
  const mdate = parseDayKey(t0);

  // Ruh hali
  const moodDays = Object.keys(s.moods).sort().slice(-30);
  const avgMood = moodDays.length ? moodDays.reduce((a, d) => a + s.moods[d].mood, 0) / moodDays.length : 0;

  // Kategori dağılımı
  const catPoints: Record<string, number> = {};
  for (const c of comps) {
    if (c.dayKey < from) continue;
    const h = s.habits[c.habitId];
    if (h) catPoints[h.category] = (catPoints[h.category] ?? 0) + c.points;
  }
  const cats = Object.entries(catPoints).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(1, ...cats.map((x) => x[1]));

  return (
    <Screen>
      <Txt size={26} weight="800">İstatistik 📊</Txt>
      <View style={{ marginTop: 12 }}>
        <Segmented value={range} onChange={setRange} options={[{ id: '7', label: 'Son 7 gün' }, { id: '30', label: 'Son 30 gün' }]} />
      </View>

      <Row style={{ gap: 8, marginTop: 12 }}>
        <Tile label="Toplam SP" value={String(sp)} />
        <Tile label="Günlük ort." value={`${avg}`} />
        <Tile label="Tamamlama" value={`%${Math.round(avgRate * 100)}`} />
      </Row>

      <SectionTitle>Günlük puan{s.partner ? ` (${me.name} / ${s.partner.name})` : ''}</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120 }}>
          {days.map((d) => (
            <View key={d} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100 }}>
                <View style={{ width: n === 7 ? 12 : 4, height: Math.max(2, (stats[d].points / max) * 100), backgroundColor: me.color, borderRadius: 3 }} />
                {pstats ? <View style={{ width: n === 7 ? 12 : 4, height: Math.max(2, ((pstats[d]?.points ?? 0) / max) * 100), backgroundColor: s.partner!.color, borderRadius: 3, marginLeft: 1 }} /> : null}
              </View>
              {n === 7 ? <Txt size={10} dim style={{ marginTop: 4 }}>{TR_DAYS_SHORT[weekdayOf(d)]}</Txt> : null}
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle>{TR_MONTHS[mdate.getMonth()]} ısı haritası</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          {TR_DAYS_SHORT.map((d) => <Txt key={d} size={10} dim style={{ width: 38, textAlign: 'center' }}>{d}</Txt>)}
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 34 }} />;
            const plan = habits.filter((h) => isPlannedOn(h, d));
            const done = plan.filter((h) => comps.some((c) => c.habitId === h.id && c.dayKey === d)).length;
            const r = plan.length ? done / plan.length : 0;
            const future = d > t0;
            return (
              <View key={d} style={{ width: `${100 / 7}%`, height: 34, padding: 2 }}>
                <View style={{ flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: future ? 'transparent' : r === 0 ? t.cardAlt : t.success, opacity: future ? 1 : r === 0 ? 1 : 0.25 + r * 0.75, borderWidth: d === t0 ? 1.5 : 0, borderColor: t.primary }}>
                  <Txt size={11} dim={future || r === 0}>{parseDayKey(d).getDate()}</Txt>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <SectionTitle>Kategori dağılımı ({n} gün)</SectionTitle>
      <Card>
        {cats.length === 0 ? <Txt dim>Henüz veri yok.</Txt> : cats.map(([c, v]) => (
          <View key={c} style={{ marginBottom: 8 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Txt size={13}>{c}</Txt>
              <Txt size={13} weight="700">{v} SP</Txt>
            </Row>
            <Bar value={v / catMax} color={t.primary} height={6} />
          </View>
        ))}
      </Card>

      <SectionTitle>En uzun seriler</SectionTitle>
      <Card>
        {best.filter((b) => b.streak > 0).length === 0 ? <Txt dim>Seri başlatmak için bugün bir görev tamamla 🔥</Txt> : best.filter((b) => b.streak > 0).map(({ h, streak }) => (
          <Row key={h.id} style={{ justifyContent: 'space-between', paddingVertical: 5 }}>
            <Txt numberOfLines={1} style={{ flex: 1 }}>{h.icon} {h.title}</Txt>
            <Txt weight="800" color={t.warn}>🔥 {h.schedule.weeklyQuota ? `${Math.round(streak / 7)} hf` : `${streak} gün`}</Txt>
          </Row>
        ))}
      </Card>

      <SectionTitle right={<Pressable onPress={() => router.push('/mood')}><Txt size={13} color={t.primary} weight="700">Kaydet ＋</Txt></Pressable>}>Ruh hali</SectionTitle>
      <Card>
        {moodDays.length === 0 ? <Txt dim>Henüz kayıt yok. Günde 30 saniyede ruh halini kaydet.</Txt> : (
          <>
            <Txt weight="700">Ortalama: {MOODS[Math.max(0, Math.round(avgMood) - 1)].emoji} {avgMood.toFixed(1)} / 5</Txt>
            <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
              {moodDays.map((d) => <View key={d} style={{ width: 22, height: 22, borderRadius: 6, margin: 2, backgroundColor: MOODS[s.moods[d].mood - 1].color }} />)}
            </View>
          </>
        )}
      </Card>

      <Txt size={12} dim center style={{ marginTop: 16 }}>Toplam XP: {xp} (rozet ve şampiyonluk bonusları dahil)</Txt>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
      <Txt size={22} weight="800">{value}</Txt>
      <Txt size={11} dim>{label}</Txt>
    </Card>
  );
}
