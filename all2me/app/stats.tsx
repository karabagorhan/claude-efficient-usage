import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Bar, Card, Header, Row, Screen, SectionHeader, Segmented, Txt } from '../src/components/ui';
import { addDays, daysInMonth, eachDay, monthStartKey, parseDayKey, weekdayOf } from '../src/engine/dates';
import { dayStats } from '../src/engine/leaderboard';
import { currentStreak, isPlannedOn } from '../src/engine/points';
import type { Slot } from '../src/engine/types';
import { DualBars } from '../src/features/duel/DualBars';
import { DAYS_LETTER, DAYS_LONG, fmtDay, useLang, useT } from '../src/i18n';
import { today as todayKey, totalsFor, useCore } from '../src/store/core';
import { alpha, useTheme } from '../src/theme';

const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'anytime'];

export default function StatsScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const me = useCore((s) => s.me);
  const partner = useCore((s) => s.partner);
  const habitsMap = useCore((s) => s.habits);
  const compsMap = useCore((s) => s.completions);
  const eventsMap = useCore((s) => s.events);
  const [range, setRange] = useState<'7' | '30'>('7');
  const t0 = todayKey();
  const myId = me?.id ?? '__me__';

  const habits = useMemo(() => Object.values(habitsMap).filter((h) => h.ownerId === myId && !h.archived), [habitsMap, myId]);
  const allComps = useMemo(() => Object.values(compsMap), [compsMap]);
  const comps = useMemo(() => allComps.filter((c) => c.userId === myId && !c.undone), [allComps, myId]);
  const events = useMemo(() => Object.values(eventsMap), [eventsMap]);

  const n = range === '7' ? 7 : 30;
  const from = addDays(t0, -(n - 1));
  const days = useMemo(() => eachDay(from, t0), [from, t0]);
  const mine = useMemo(() => dayStats(myId, events, allComps, from, t0), [myId, events, allComps, from, t0]);
  const theirs = useMemo(() => (partner ? dayStats(partner.id, events, allComps, from, t0) : null), [partner, events, allComps, from, t0]);
  const myPts = useMemo(() => Object.fromEntries(days.map((d) => [d, mine[d]?.points ?? 0])), [days, mine]);
  const thPts = useMemo(() => (theirs ? Object.fromEntries(days.map((d) => [d, theirs[d]?.points ?? 0])) : null), [days, theirs]);

  const doneSet = useMemo(() => new Set(comps.map((c) => `${c.habitId}|${c.dayKey}`)), [comps]);
  const ratioOn = (d: string) => {
    const plan = habits.filter((h) => h.createdAt.slice(0, 10) <= d && isPlannedOn(h, d));
    if (!plan.length) return null;
    return plan.filter((h) => doneSet.has(`${h.id}|${d}`)).length / plan.length;
  };

  const totalPts = days.reduce((a, d) => a + (myPts[d] ?? 0), 0);
  const avg = Math.round(totalPts / n);
  const avgRate = useMemo(() => {
    const v = days.map(ratioOn).filter((r): r is number => r !== null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, habits, doneSet]);

  // Isı haritası (bu ay, Pazartesi başlangıç)
  const ms = monthStartKey(t0);
  const cells: Array<string | null> = [...Array(weekdayOf(ms)).fill(null), ...Array.from({ length: daysInMonth(t0) }, (_, i) => addDays(ms, i))];

  // Zaman dilimine göre puan
  const slotPts = useMemo(() => {
    const out: Record<Slot, number> = { morning: 0, afternoon: 0, evening: 0, anytime: 0 };
    for (const c of comps) {
      if (c.dayKey < from || c.dayKey > t0) continue;
      const h = habitsMap[c.habitId];
      if (h) out[h.slot ?? 'anytime'] += c.points;
    }
    return out;
  }, [comps, habitsMap, from, t0]);
  const slotMax = Math.max(1, ...SLOTS.map((s) => slotPts[s]));
  const slotTotal = SLOTS.reduce((a, s) => a + slotPts[s], 0);

  // En uzun seriler
  const best = useMemo(
    () =>
      habits
        .map((h) => ({ h, streak: currentStreak(h, comps, t0) }))
        .filter((x) => x.streak > 0)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5),
    [habits, comps, t0],
  );

  // Haftanın en verimli günü (son 8 hafta, ilk etkinlikten itibaren)
  const bestDay = useMemo(() => {
    const first = events.filter((e) => e.userId === myId).reduce((m, e) => (e.dayKey < m ? e.dayKey : m), t0);
    const start = first > addDays(t0, -55) ? first : addDays(t0, -55);
    const st = dayStats(myId, events, allComps, start, t0);
    const sum = [0, 0, 0, 0, 0, 0, 0];
    const cnt = [0, 0, 0, 0, 0, 0, 0];
    for (const d of eachDay(start, t0)) {
      const w = weekdayOf(d);
      sum[w] += st[d]?.points ?? 0;
      cnt[w] += 1;
    }
    let bi = -1;
    let bv = 0;
    sum.forEach((s, i) => {
      const a = cnt[i] ? s / cnt[i] : 0;
      if (a > bv) {
        bv = a;
        bi = i;
      }
    });
    return bi < 0 ? null : { i: bi, avg: Math.round(bv) };
  }, [events, allComps, myId, t0]);

  if (!me) return null;
  const sp = totalsFor(useCore.getState(), me.id).sp;
  const slotColor: Record<Slot, string> = { morning: th.pastel.yellow, afternoon: th.pastel.peach, evening: th.pastel.purple, anytime: th.pastel.mint };

  return (
    <Screen header={<Header title={t('profile.stats.title')} />}>
      <View style={{ marginTop: 8 }}>
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { id: '7', label: t('profile.stats.range7') },
            { id: '30', label: t('profile.stats.range30') },
          ]}
        />
      </View>

      <Row gap={8} style={{ marginTop: 12 }}>
        <Tile label={t('profile.stats.totalPoints')} value={String(sp)} bg={th.pastel.blue} />
        <Tile label={t('profile.stats.dailyAvg')} value={String(avg)} bg={th.pastel.green} />
        <Tile label={t('profile.stats.completion')} value={`${Math.round(avgRate * 100)}%`} bg={th.pastel.pink} />
      </Row>

      <SectionHeader title={t('profile.stats.dailyChart')} />
      <Card>
        {partner ? (
          <Row gap={14} style={{ marginBottom: 10 }}>
            <Legend color={me.color} label={me.name} />
            <Legend color={partner.color} label={partner.name} />
          </Row>
        ) : null}
        <DualBars days={days} mine={myPts} theirs={thPts} myColor={me.color} theirColor={partner?.color} labels={n === 7} />
      </Card>

      <SectionHeader title={t('profile.stats.heatmap')} />
      <Card>
        <Txt variant="bodyBold" style={{ marginBottom: 8 }}>{fmtDay(ms, lang, 'month')}</Txt>
        <Row style={{ marginBottom: 4 }}>
          {DAYS_LETTER[lang].map((d, i) => (
            <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
              <Txt size={11} dim>{d}</Txt>
            </View>
          ))}
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />;
            const r = d > t0 ? 0 : ratioOn(d) ?? 0;
            const future = d > t0;
            return (
              <View key={d} style={{ width: `${100 / 7}%`, height: 40, padding: 2 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: future ? 'transparent' : r === 0 ? th.cardAlt : alpha(th.success, 0.25 + r * 0.75),
                    borderWidth: d === t0 ? 1.5 : 0,
                    borderColor: th.primary,
                  }}
                >
                  <Txt size={12} dim={future || r === 0} weight={r > 0.6 ? '700' : '500'}>{parseDayKey(d).getDate()}</Txt>
                </View>
              </View>
            );
          })}
        </View>
        <Row gap={6} style={{ marginTop: 8, justifyContent: 'flex-end' }}>
          <Txt size={11} dim>{t('profile.stats.heatmapLegendLess')}</Txt>
          {[0, 0.35, 0.65, 1].map((v) => (
            <View key={v} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: v === 0 ? th.cardAlt : alpha(th.success, 0.25 + v * 0.75) }} />
          ))}
          <Txt size={11} dim>{t('profile.stats.heatmapLegendMore')}</Txt>
        </Row>
      </Card>

      <SectionHeader title={`${t('profile.stats.bySlot')} · ${t('profile.stats.bySlotRange', { n })}`} />
      <Card>
        {slotTotal === 0 ? (
          <Txt dim>{t('profile.stats.noData')}</Txt>
        ) : (
          SLOTS.map((s) => (
            <View key={s} style={{ marginBottom: 10 }}>
              <Row between style={{ marginBottom: 4 }}>
                <Txt size={14}>{t(`task.slot.${s}`)}</Txt>
                <Txt size={14} weight="700">{t('profile.stats.points', { n: slotPts[s] })}</Txt>
              </Row>
              <Bar value={slotPts[s] / slotMax} color={slotColor[s]} height={10} />
            </View>
          ))
        )}
      </Card>

      <SectionHeader title={t('profile.stats.longestStreaks')} />
      <Card>
        {best.length === 0 ? (
          <Txt dim>{t('profile.stats.noStreaks')}</Txt>
        ) : (
          best.map(({ h, streak }) => (
            <Row key={h.id} between gap={8} style={{ paddingVertical: 6 }}>
              <Txt numberOfLines={1} style={{ flex: 1 }}>{h.icon} {h.title}</Txt>
              <Txt weight="800" color={th.orange}>
                🔥 {h.schedule.weeklyQuota ? t('profile.stats.streakWeeks', { n: Math.round(streak / 7) }) : t('profile.stats.streakDays', { n: streak })}
              </Txt>
            </Row>
          ))
        )}
      </Card>

      <SectionHeader title={t('profile.stats.bestDay')} />
      <Card>
        {bestDay ? (
          <>
            <Txt size={22} weight="800">⚡ {DAYS_LONG[lang][bestDay.i]}</Txt>
            <Txt dim style={{ marginTop: 2 }}>{t('profile.stats.bestDayBody', { n: bestDay.avg })}</Txt>
          </>
        ) : (
          <Txt dim>{t('profile.stats.bestDayNone')}</Txt>
        )}
      </Card>
    </Screen>
  );
}

function Tile({ label, value, bg }: { label: string; value: string; bg: string }) {
  const th = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' }}>
      <Txt size={22} weight="800" color={th.onPastel}>{value}</Txt>
      <Txt size={11} color={th.onPastel} center numberOfLines={1}>{label}</Txt>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Txt size={12} dim>{label}</Txt>
    </Row>
  );
}
