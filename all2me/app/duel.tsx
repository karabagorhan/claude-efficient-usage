import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Bar, Card, EmptyState, Header, PillButton, Row, Screen, SectionHeader, Segmented, Txt, tap } from '../src/components/ui';
import { addDays, eachDay, parseDayKey, periodRange } from '../src/engine/dates';
import { championCounts, dayStats, standings } from '../src/engine/leaderboard';
import type { Period } from '../src/engine/types';
import { DualBars } from '../src/features/duel/DualBars';
import { eventLabel, fmtDay, translate, useLang, useT } from '../src/i18n';
import { MONTHS_SHORT } from '../src/i18n/dates';
import { routes } from '../src/lib/routes';
import { today as todayKey, useCore } from '../src/store/core';
import { alpha, radius, useTheme } from '../src/theme';

const NUDGE_KEYS = ['duel.nudgeMsg.a', 'duel.nudgeMsg.b', 'duel.nudgeMsg.c'];
const CHEER_KEYS = ['duel.cheerMsg.a', 'duel.cheerMsg.b', 'duel.cheerMsg.c'];
const FEED_TYPES = ['completion', 'perfect_day', 'champion', 'badge'];

export default function DuelScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const params = useLocalSearchParams<{ period?: string }>();
  const me = useCore((s) => s.me);
  const partner = useCore((s) => s.partner);
  const eventsMap = useCore((s) => s.events);
  const compsMap = useCore((s) => s.completions);
  const habits = useCore((s) => s.habits);
  const sendNudge = useCore((s) => s.sendNudge);
  const pushToast = useCore((s) => s.pushToast);

  const t0 = todayKey();
  const initial: Period = params.period === 'week' || params.period === 'month' ? params.period : 'day';
  const [period, setPeriod] = useState<Period>(initial);
  const [anchor, setAnchor] = useState(t0);

  const events = useMemo(() => Object.values(eventsMap), [eventsMap]);
  const comps = useMemo(() => Object.values(compsMap), [compsMap]);
  const myId = me?.id ?? '__me__';
  const pId = partner?.id ?? '__none__';

  const [from, to] = periodRange(period, anchor);
  const isCurrent = t0 >= from && t0 <= to;
  const closed = to < t0;
  const days = useMemo(() => eachDay(from, to), [from, to]);

  const st = useMemo(() => standings(period, anchor, [myId, pId], events, comps, t0), [period, anchor, myId, pId, events, comps, t0]);
  const myDays = useMemo(() => dayStats(myId, events, comps, from, to), [myId, events, comps, from, to]);
  const thDays = useMemo(() => (partner ? dayStats(pId, events, comps, from, to) : null), [partner, pId, events, comps, from, to]);
  const myPts = useMemo(() => Object.fromEntries(days.map((d) => [d, myDays[d]?.points ?? 0])), [days, myDays]);
  const thPts = useMemo(() => (thDays ? Object.fromEntries(days.map((d) => [d, thDays[d]?.points ?? 0])) : null), [days, thDays]);

  const firstDay = useMemo(() => {
    let m = t0;
    for (const e of events) if (e.dayKey < m) m = e.dayKey;
    for (const c of comps) if (c.dayKey < m) m = c.dayKey;
    return m;
  }, [events, comps, t0]);
  const champs = useMemo(() => {
    if (!partner) return null;
    const ids: [string, string] = [myId, pId];
    return {
      day: championCounts('day', ids, events, comps, firstDay, t0),
      week: championCounts('week', ids, events, comps, firstDay, t0),
      month: championCounts('month', ids, events, comps, firstDay, t0),
    };
  }, [partner, myId, pId, events, comps, firstDay, t0]);

  const form = useMemo(() => {
    if (!partner) return [];
    return Array.from({ length: 7 }, (_, i) => addDays(t0, -(6 - i))).map((d) => {
      const r = standings('day', d, [myId, pId], events, comps, t0);
      return { d, res: r.winnerId === myId ? 'W' : r.winnerId === pId ? 'L' : 'D' };
    });
  }, [partner, myId, pId, events, comps, t0]);

  const feed = useMemo(() => {
    if (!partner) return [];
    return events
      .filter((e) => e.userId === pId && FEED_TYPES.includes(e.type))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [partner, pId, events]);

  if (!me) return null;

  const periodLabel = () => {
    if (period === 'day') return fmtDay(anchor, lang);
    if (period === 'month') return fmtDay(from, lang, 'month');
    const a = parseDayKey(from);
    const b = parseDayKey(to);
    const ms = MONTHS_SHORT[lang];
    return lang === 'tr'
      ? `${a.getDate()} ${ms[a.getMonth()]} – ${b.getDate()} ${ms[b.getMonth()]}`
      : `${ms[a.getMonth()]} ${a.getDate()} – ${ms[b.getMonth()]} ${b.getDate()}`;
  };

  const move = (dir: -1 | 1) => {
    tap();
    if (period === 'day') setAnchor(addDays(anchor, dir));
    else if (period === 'week') setAnchor(addDays(from, dir * 7));
    else setAnchor(dir < 0 ? addDays(from, -1) : addDays(to, 1));
  };
  const switchPeriod = (p: Period) => {
    setPeriod(p);
    setAnchor(t0);
  };

  const header = <Header title={t('duel.title')} />;

  if (!partner) {
    const mine = st.rows.find((r) => r.userId === myId)!;
    return (
      <Screen header={header}>
        <View style={{ marginTop: 8 }}>
          <Segmented<Period>
            value={period}
            onChange={switchPeriod}
            options={[
              { id: 'day', label: t('points.period.day') },
              { id: 'week', label: t('points.period.week') },
              { id: 'month', label: t('points.period.month') },
            ]}
          />
        </View>
        <EmptyState
          title={t('duel.noPartnerTitle')}
          body={t('duel.noPartnerBody')}
          mood="cheer"
          action={{ label: t('duel.pair'), onPress: () => router.push(routes.pairing()) }}
        />
        <Card>
          <Txt variant="bodyBold">{t('duel.yourPoints')}</Txt>
          <Txt dim size={14} style={{ marginTop: 4 }}>
            {periodLabel()} · {t('duel.yourPointsBody', { n: mine.points, tasks: mine.tasks })}
          </Txt>
        </Card>
      </Screen>
    );
  }

  const mine = st.rows.find((r) => r.userId === myId)!;
  const theirs = st.rows.find((r) => r.userId === pId)!;
  const total = mine.points + theirs.points;
  const myShare = total === 0 ? 0.5 : mine.points / total;
  const winnerName = st.winnerId === myId ? me.name : st.winnerId === pId ? partner.name : null;
  const banner = winnerName
    ? isCurrent
      ? { text: t('duel.banner.leading', { name: winnerName, title: t(`points.champion.${period}`) }), color: th.warn }
      : { text: t('duel.banner.winner', { name: winnerName, title: t(`points.champion.${period}`) }), color: th.warn }
    : st.tie && st.qualified
      ? { text: t('duel.banner.tie'), color: th.textDim }
      : !st.qualified
        ? { text: t('duel.banner.notQualified'), color: th.textDim }
        : null;

  const send = (kind: 'nudge' | 'cheer') => {
    const keys = kind === 'nudge' ? NUDGE_KEYS : CHEER_KEYS;
    const r = sendNudge(kind, translate(keys[Math.floor(Math.random() * keys.length)]));
    if (r.ok) pushToast(kind === 'nudge' ? 'toast.nudge.sent' : 'toast.nudge.cheerSent');
    else pushToast({ key: r.reason?.key ?? 'duel.nudgeFail', params: r.reason?.params });
  };

  const feedIcon = (type: string) => (type === 'champion' ? '🏆' : type === 'badge' ? '🎖️' : type === 'perfect_day' ? '✨' : '✅');
  const feedText = (e: (typeof feed)[number]) => {
    if (e.type === 'completion') {
      const hid = e.refId?.split(':')[1];
      const h = hid ? habits[hid] : undefined;
      if (!h || h.isPrivate) return t('duel.privateDone');
    }
    return eventLabel(t, e);
  };

  const statusLabel = isCurrent ? t('duel.status.current') : closed ? t('duel.status.closed') : t('duel.status.future');

  return (
    <Screen header={header}>
      <View style={{ marginTop: 8 }}>
        <Segmented<Period>
          value={period}
          onChange={switchPeriod}
          options={[
            { id: 'day', label: t('points.period.day') },
            { id: 'week', label: t('points.period.week') },
            { id: 'month', label: t('points.period.month') },
          ]}
        />
      </View>

      <Row between style={{ marginTop: 14 }}>
        <Pressable onPress={() => move(-1)} hitSlop={14} accessibilityLabel={t('duel.prev')}>
          <Txt size={30} weight="700">‹</Txt>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Txt variant="bodyBold">{periodLabel()}</Txt>
          <Txt size={12} dim>{statusLabel}</Txt>
        </View>
        <Pressable onPress={() => move(1)} hitSlop={14} disabled={isCurrent} accessibilityLabel={t('duel.next')}>
          <Txt size={30} weight="700" style={{ opacity: isCurrent ? 0.2 : 1 }}>›</Txt>
        </Pressable>
      </Row>

      <Card style={{ marginTop: 12 }} padding={18}>
        <Row between>
          <PlayerCol p={me} pts={mine.points} lead={mine.points > theirs.points} unit={t('duel.pts')} />
          <Txt size={16} weight="800" dim>{t('points.vs')}</Txt>
          <PlayerCol p={partner} pts={theirs.points} lead={theirs.points > mine.points} align="right" unit={t('duel.pts')} />
        </Row>
        <View style={{ marginTop: 16 }}>
          <Bar value={myShare} color={me.color} bg={partner.color} height={14} />
          <Row between style={{ marginTop: 6 }}>
            <Txt size={12} dim>{Math.round(myShare * 100)}%</Txt>
            <Txt size={12} dim>{Math.round((1 - myShare) * 100)}%</Txt>
          </Row>
        </View>
        {banner ? (
          <View style={{ marginTop: 12, backgroundColor: alpha(banner.color, 0.14), borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 }}>
            <Txt center weight="800" color={banner.color}>{banner.text}</Txt>
          </View>
        ) : null}
        <Row style={{ justifyContent: 'space-around', marginTop: 16 }}>
          <Mini label={t('duel.mini.tasks')} a={mine.tasks} b={theirs.tasks} ca={me.color} cb={partner.color} />
          <Mini label={t('duel.mini.activeDays')} a={mine.activeDays} b={theirs.activeDays} ca={me.color} cb={partner.color} />
          {period !== 'day' ? <Mini label={t('duel.mini.wonDays')} a={mine.dayWins} b={theirs.dayWins} ca={me.color} cb={partner.color} /> : null}
        </Row>
      </Card>

      {period !== 'day' ? (
        <Card style={{ marginTop: 12 }}>
          <Txt variant="bodyBold" style={{ marginBottom: 12 }}>{t('duel.dayByDay')}</Txt>
          <DualBars days={days} mine={myPts} theirs={thPts} myColor={me.color} theirColor={partner.color} labels={period === 'week'} />
        </Card>
      ) : null}

      {champs ? (
        <>
          <SectionHeader title={t('duel.shelf')} />
          <Card>
            {(['day', 'week', 'month'] as const).map((p) => (
              <Row key={p} between style={{ paddingVertical: 6 }}>
                <Txt weight="600" style={{ flex: 1 }}>{p === 'day' ? '🥇' : p === 'week' ? '🌠' : '🏅'} {t(`points.champion.${p}`)}</Txt>
                <Txt weight="800" color={me.color}>{champs[p].wins[myId] ?? 0}</Txt>
                <Txt weight="800" dim> – </Txt>
                <Txt weight="800" color={partner.color}>{champs[p].wins[pId] ?? 0}</Txt>
                {champs[p].ties ? <Txt dim size={12}>  ({t('duel.shelfTies', { n: champs[p].ties })})</Txt> : null}
              </Row>
            ))}
            <Row style={{ marginTop: 10, flexWrap: 'wrap', rowGap: 4 }}>
              <Txt size={12} dim style={{ marginRight: 8 }}>{t('duel.last7')}</Txt>
              {form.map((f) => (
                <View
                  key={f.d}
                  style={{ width: 24, height: 24, borderRadius: 12, marginRight: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: f.res === 'W' ? th.success : f.res === 'L' ? th.danger : th.cardAlt }}
                >
                  <Txt size={11} weight="800" color={f.res === 'D' ? th.textDim : '#fff'}>
                    {f.res === 'W' ? t('duel.form.win') : f.res === 'L' ? t('duel.form.loss') : t('duel.form.draw')}
                  </Txt>
                </View>
              ))}
            </Row>
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('duel.withPartner', { name: partner.name })} />
      <Row gap={10}>
        <View style={{ flex: 1 }}><PillButton label={t('duel.nudge')} kind="outline" onPress={() => send('nudge')} /></View>
        <View style={{ flex: 1 }}><PillButton label={t('duel.cheer')} kind="outline" onPress={() => send('cheer')} /></View>
      </Row>

      {feed.length > 0 ? (
        <>
          <SectionHeader title={t('duel.feed', { name: partner.name })} />
          <Card>
            {feed.map((e) => (
              <Row key={e.id} between style={{ paddingVertical: 6 }} gap={8}>
                <Txt numberOfLines={1} style={{ flex: 1 }}>{feedIcon(e.type)} {feedText(e)}</Txt>
                {e.points > 0 ? <Txt weight="700" color={th.success}>+{e.points}</Txt> : null}
              </Row>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function PlayerCol({ p, pts, lead, align, unit }: { p: { name: string; emoji: string; color: string }; pts: number; lead: boolean; align?: 'right'; unit: string }) {
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start', flex: 1 }}>
      <Avatar emoji={p.emoji} color={p.color} size={52} />
      <Txt variant="bodyBold" numberOfLines={1} style={{ marginTop: 6 }}>{p.name}</Txt>
      <Txt size={32} weight="800" color={p.color}>{pts}{lead ? ' 👑' : ''}</Txt>
      <Txt size={12} dim>{unit}</Txt>
    </View>
  );
}

function Mini({ label, a, b, ca, cb }: { label: string; a: number; b: number; ca: string; cb: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt size={12} dim>{label}</Txt>
      <Row>
        <Txt weight="800" color={ca}>{a}</Txt>
        <Txt weight="800" dim> – </Txt>
        <Txt weight="800" color={cb}>{b}</Txt>
      </Row>
    </View>
  );
}
