import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, Bar, Card, Header, IconButton, PillButton, Row, Screen, Txt, tap } from '../../src/components/ui';
import { BADGES } from '../../src/data/badges';
import { addDays } from '../../src/engine/dates';
import { dayStats, standings } from '../../src/engine/leaderboard';
import { levelFromXp } from '../../src/engine/levels';
import { useLang, useT } from '../../src/i18n';
import { routes } from '../../src/lib/routes';
import { today as todayKey, totalsFor, useCore, useDayStreak } from '../../src/store/core';
import { useSettings } from '../../src/store/settings';
import { alpha, radius, useTheme } from '../../src/theme';

export default function ProfileTab() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const setLang = useSettings((s) => s.setLang);
  const me = useCore((s) => s.me);
  const partner = useCore((s) => s.partner);
  const pairId = useCore((s) => s.pairId);
  const dirtyCount = useCore((s) => Object.keys(s.dirty).length);
  const eventsMap = useCore((s) => s.events);
  const compsMap = useCore((s) => s.completions);
  const badgeRecs = useCore((s) => s.badges);
  const streak = useDayStreak();
  const t0 = todayKey();
  const myId = me?.id ?? '__me__';
  const pId = partner?.id ?? '__none__';

  const events = useMemo(() => Object.values(eventsMap), [eventsMap]);
  const comps = useMemo(() => Object.values(compsMap), [compsMap]);
  const myTotals = useMemo(() => totalsFor(useCore.getState(), myId), [eventsMap, myId]); // eslint-disable-line react-hooks/exhaustive-deps
  const pTotals = useMemo(() => totalsFor(useCore.getState(), pId), [eventsMap, pId]); // eslint-disable-line react-hooks/exhaustive-deps
  const lvl = levelFromXp(myTotals.xp);
  const pLvl = levelFromXp(pTotals.xp);

  const week = useMemo(() => {
    if (!partner) return null;
    const s = standings('week', t0, [myId, pId], events, comps, t0);
    return { me: s.rows.find((r) => r.userId === myId)?.points ?? 0, them: s.rows.find((r) => r.userId === pId)?.points ?? 0 };
  }, [partner, myId, pId, events, comps, t0]);

  const last7 = useMemo(() => {
    const from = addDays(t0, -6);
    const st = dayStats(myId, events, comps, from, t0);
    const list = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    const max = Math.max(10, ...list.map((d) => st[d]?.points ?? 0));
    return list.map((d) => ({ d, v: (st[d]?.points ?? 0) / max }));
  }, [myId, events, comps, t0]);

  const myBadges = useMemo(
    () => Object.values(badgeRecs).filter((r) => r.userId === myId).sort((a, b) => b.at.localeCompare(a.at)),
    [badgeRecs, myId],
  );

  if (!me) return null;

  const go = (href: string) => () => {
    tap();
    router.push(href as never);
  };

  const cardBase = { borderRadius: radius.lg, padding: 14, minHeight: 132, flex: 1 } as const;

  return (
    <Screen
      header={
        <Header
          left="none"
          title={t('tabs.profile')}
          large
          right={<IconButton icon="settings-outline" label={t('profile.settings')} onPress={() => router.push(routes.settings())} />}
        />
      }
    >
      {/* Üst: avatar + seviye */}
      <Card padding={18}>
        <Row gap={14}>
          <Avatar emoji={me.emoji} color={me.color} size={68} />
          <View style={{ flex: 1 }}>
            <Txt variant="h2" numberOfLines={1}>{me.name}</Txt>
            <Txt dim size={14}>{t('points.levelN', { n: lvl.level })} · {t(lvl.titleKey)}</Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt size={24} weight="800">{myTotals.sp}</Txt>
            <Txt size={12} dim>{t('points.points')}</Txt>
          </View>
        </Row>
        <View style={{ marginTop: 14 }}>
          <Bar value={lvl.progress} color={me.color} height={10} />
          <Txt size={12} dim style={{ marginTop: 6 }}>{t('profile.xpToNext', { n: Math.max(0, Math.ceil(lvl.nextLevelXp - lvl.xp)) })}</Txt>
        </View>
      </Card>

      {/* Kart ızgarası */}
      <Row gap={12} style={{ marginTop: 12, alignItems: 'stretch' }}>
        <Pressable onPress={go(routes.streak())} style={{ flex: 1, flexDirection: 'row' }}>
          <View style={[cardBase, { backgroundColor: th.pastel.peach }]}>
            <Txt size={13} weight="700" color={th.onPastel}>{t('profile.card.streak')}</Txt>
            <Txt size={34} style={{ marginTop: 6 }}>🔥</Txt>
            <Txt size={20} weight="800" color={th.onPastel} style={{ marginTop: 'auto' }}>{t('profile.card.streakValue', { n: streak })}</Txt>
            {streak === 0 ? <Txt size={11} color={th.onPastel}>{t('profile.card.streakHint')}</Txt> : null}
          </View>
        </Pressable>
        <Pressable onPress={go(partner ? routes.duel('week') : routes.pairing())} style={{ flex: 1, flexDirection: 'row' }}>
          <View style={[cardBase, { backgroundColor: th.pastel.purple }]}>
            <Txt size={13} weight="700" color={th.onPastel}>{t('profile.card.duel')}</Txt>
            {partner && week ? (
              <>
                <Row gap={6} style={{ marginTop: 10 }}>
                  <Avatar emoji={me.emoji} color={me.color} size={28} />
                  <Txt size={12} weight="700" color={th.onPastel}>{t('points.vs')}</Txt>
                  <Avatar emoji={partner.emoji} color={partner.color} size={28} />
                </Row>
                <Txt size={22} weight="800" color={th.onPastel} style={{ marginTop: 'auto' }}>{week.me} – {week.them}</Txt>
                <Txt size={11} color={th.onPastel}>{t('profile.card.duelWeek')}</Txt>
              </>
            ) : (
              <>
                <Txt size={34} style={{ marginTop: 6 }}>🏆</Txt>
                <Txt size={12} color={th.onPastel} style={{ marginTop: 'auto' }}>{t('profile.card.duelNoPartner')}</Txt>
              </>
            )}
          </View>
        </Pressable>
      </Row>

      <Row gap={12} style={{ marginTop: 12, alignItems: 'stretch' }}>
        <Pressable onPress={go(routes.badges())} style={{ flex: 1, flexDirection: 'row' }}>
          <View style={[cardBase, { backgroundColor: th.pastel.yellow }]}>
            <Txt size={13} weight="700" color={th.onPastel}>{t('profile.card.badges')}</Txt>
            <Row gap={4} style={{ marginTop: 10, flexWrap: 'wrap' }}>
              {myBadges.slice(0, 4).map((r) => {
                const b = BADGES.find((x) => x.id === r.badgeId);
                return b ? <Txt key={r.id} size={22}>{b.emoji}</Txt> : null;
              })}
              {myBadges.length === 0 ? <Txt size={11} color={th.onPastel}>{t('profile.card.badgesNone')}</Txt> : null}
            </Row>
            <Txt size={13} weight="800" color={th.onPastel} style={{ marginTop: 'auto' }}>
              {t('profile.card.badgesCount', { n: myBadges.length, total: BADGES.length })}
            </Txt>
          </View>
        </Pressable>
        <Pressable onPress={go(routes.stats())} style={{ flex: 1, flexDirection: 'row' }}>
          <View style={[cardBase, { backgroundColor: th.pastel.mint }]}>
            <Txt size={13} weight="700" color={th.onPastel}>{t('profile.card.stats')}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 56, gap: 4, marginTop: 'auto', marginBottom: 6 }}>
              {last7.map((x) => (
                <View key={x.d} style={{ flex: 1, height: Math.max(4, x.v * 56), borderRadius: 3, backgroundColor: alpha(th.isDark ? '#FFFFFF' : '#14171A', x.d === t0 ? 0.75 : 0.3) }} />
              ))}
            </View>
            <Txt size={11} color={th.onPastel}>{t('profile.card.statsHint')}</Txt>
          </View>
        </Pressable>
      </Row>

      {/* Partner kartı */}
      <Card style={{ marginTop: 12 }} padding={16}>
        <Txt variant="bodyBold" style={{ marginBottom: 10 }}>{t('profile.partner.title')}</Txt>
        {partner ? (
          <Row gap={12}>
            <Avatar emoji={partner.emoji} color={partner.color} size={52} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold" numberOfLines={1}>{partner.name}</Txt>
              <Txt size={13} dim>{t('profile.partner.level', { n: pLvl.level, title: t(pLvl.titleKey) })}</Txt>
              <Txt size={12} dim>
                {t('profile.partner.points', { n: pTotals.sp })} · {pairId ? (dirtyCount > 0 ? t('profile.partner.pending') : t('profile.partner.synced')) : t('profile.partner.local')}
              </Txt>
            </View>
          </Row>
        ) : (
          <View>
            <Txt variant="bodyBold">{t('profile.partner.none')}</Txt>
            <Txt dim size={14} style={{ marginTop: 2, marginBottom: 12 }}>{t('profile.partner.noneBody')}</Txt>
            <PillButton label={t('profile.partner.pair')} onPress={() => router.push(routes.pairing())} small />
          </View>
        )}
      </Card>

      {/* Kısayollar */}
      <Card style={{ marginTop: 12 }} padding={6}>
        <Pressable onPress={() => { tap(); setLang(lang === 'tr' ? 'en' : 'tr'); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
          <Ionicons name="language-outline" size={22} color={th.text} />
          <View style={{ flex: 1 }}>
            <Txt weight="600">{t('profile.shortcuts.language')}</Txt>
            <Txt size={12} dim>{t('profile.shortcuts.languageValue')}</Txt>
          </View>
          <Txt size={13} weight="700" color={th.primary}>{t('profile.shortcuts.switchTo')}</Txt>
        </Pressable>
        <View style={{ height: 1, backgroundColor: th.border, marginHorizontal: 12 }} />
        <Pressable onPress={go(routes.settings())} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
          <Ionicons name="settings-outline" size={22} color={th.text} />
          <Txt weight="600" style={{ flex: 1 }}>{t('profile.shortcuts.settings')}</Txt>
          <Ionicons name="chevron-forward" size={18} color={th.textFaint} />
        </Pressable>
      </Card>
    </Screen>
  );
}
