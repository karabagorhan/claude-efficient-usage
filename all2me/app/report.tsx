/**
 * Haftalık rapor ve içgörüler (rota /report?week=YYYY-MM-DD). Tüm hesap cihazda, saf fonksiyonlarla:
 * src/features/report/calc.ts + insights.ts. Veri yalnız okunur.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';
import { Card, EmptyState, Header, PillButton, Row, Screen, SectionHeader, Spacer, Txt, tap } from '../src/components/ui';
import { weekdayOf, weekStartKey } from '../src/engine/dates';
import {
  firstDataDay,
  isEmptyData,
  shiftWeek,
  weekComparison,
  weekStats,
} from '../src/features/report/calc';
import { deltaText, insightText, money, num, rangeLabel, shareText, suggestionText } from '../src/features/report/format';
import { computeInsights, suggestions as suggestionsFor, WINDOW_DAYS, type InsightId } from '../src/features/report/insights';
import { syncReportNotifs } from '../src/features/report/notify';
import { useReportData } from '../src/features/report/useReportData';
import { DAYS_LETTER, DAYS_LONG, fmtDay, useLang, useT } from '../src/i18n';
import { today, useCore } from '../src/store/core';
import { useSettings } from '../src/store/settings';
import { alpha, radius, useTheme, type PastelKey } from '../src/theme';

const INSIGHT_EMOJI: Record<InsightId, string> = {
  sleepMood: '😴',
  sleepRate: '🛌',
  morningRate: '🌅',
  moodRate: '🙂',
  smokeStress: '🚭',
  fastWater: '🍔',
  waterRate: '💧',
};
const SLOT_EMOJI = { morning: '🌅', afternoon: '☀️', evening: '🌙', anytime: '⏳' } as const;
const SUGG_PASTELS: PastelKey[] = ['yellow', 'mint', 'pink'];
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function ReportScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const units = useSettings((s) => s.units);
  const partner = useCore((s) => s.partner);
  const params = useLocalSearchParams<{ week?: string }>();
  const data = useReportData();
  const nowKey = today();
  const thisWeek = weekStartKey(nowKey);

  const [week, setWeek] = useState(() => (params.week && WEEK_RE.test(params.week) ? weekStartKey(params.week) : thisWeek));
  // dış bağlantıyla parametre değişirse izle
  useEffect(() => {
    if (params.week && WEEK_RE.test(params.week)) setWeek(weekStartKey(params.week));
  }, [params.week]);

  // Pazar 19:00 bildirimini (yeniden) kur; web'de no-op
  useEffect(() => {
    if (useCore.getState().me) void syncReportNotifs().catch(() => {});
  }, []);

  const empty = useMemo(() => isEmptyData(data), [data]);
  const minWeek = useMemo(() => {
    const d = firstDataDay(data);
    return d ? weekStartKey(d) : thisWeek;
  }, [data, thisWeek]);
  const stats = useMemo(() => weekStats(data, week), [data, week]);
  const cmp = useMemo(() => weekComparison(data, stats), [data, stats]);
  const insights = useMemo(() => computeInsights(data, stats.end), [data, stats.end]);
  const suggs = useMemo(() => (stats.hasData ? suggestionsFor(stats, insights) : []), [stats, insights]);

  const canPrev = week > minWeek;
  const canNext = week < thisWeek;
  const go = (n: number) => {
    tap();
    setWeek(shiftWeek(week, n));
  };

  const doShare = useCallback(async () => {
    const msg = shareText(t, lang, stats, cmp, insights, partner?.name);
    try {
      await Share.share({ message: msg });
    } catch {
      try {
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(msg);
      } catch {}
    }
  }, [t, lang, stats, cmp, insights, partner?.name]);

  const label = week === thisWeek ? t('report.week.current') : week === shiftWeek(thisWeek, -1) ? t('report.week.last') : rangeLabel(stats.start, stats.end, lang);
  const sub = week === thisWeek || week === shiftWeek(thisWeek, -1) ? rangeLabel(stats.start, stats.end, lang) : null;

  const navBtn = (dir: -1 | 1, enabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? t('report.week.prev') : t('report.week.next')}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={() => go(dir)}
      style={{ width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: th.card, borderWidth: 1, borderColor: th.border, opacity: enabled ? 1 : 0.35 }}
    >
      <Ionicons name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={22} color={th.text} />
    </Pressable>
  );

  const picker = (
    <Row between gap={12} style={{ marginBottom: 12 }}>
      {navBtn(-1, canPrev)}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Txt variant="h3" center role="header">{label}</Txt>
        {sub ? <Txt size={13} dim center>{sub}</Txt> : null}
      </View>
      {navBtn(1, canNext)}
    </Row>
  );

  const header = <Header title={t('report.title')} large />;

  if (empty) {
    return (
      <Screen header={header}>
        <EmptyState
          mood="sleepy"
          title={t('report.empty.title')}
          body={t('report.empty.body')}
          action={{ label: t('report.empty.cta'), onPress: () => router.replace('/') }}
        />
      </Screen>
    );
  }

  const tile = (pastel: PastelKey, title: string, value: string, delta?: string | null, hint?: string) => (
    <View style={{ flex: 1, backgroundColor: th.pastel[pastel], borderRadius: radius.lg, padding: 14, minHeight: 112 }}>
      <Txt size={13} weight="700" color={th.onPastel}>{title}</Txt>
      <Txt size={28} weight="800" color={th.onPastel} style={{ marginTop: 6 }}>{value}</Txt>
      {delta ? <Txt size={12} weight="700" color={th.onPastel} style={{ marginTop: 'auto' }}>{delta}</Txt> : null}
      {hint ? <Txt size={11} color={th.onPastel}>{hint}</Txt> : null}
    </View>
  );

  const showDelta = cmp.prevHasData;
  const maxPts = Math.max(10, ...stats.perDay.map((d) => d.points ?? 0));
  const amount = (ml: number) => (units === 'oz' ? `${num(ml / 29.5735, lang, 0)} ${t('common.unit.oz')}` : `${num(ml, lang, 0)} ${t('common.unit.ml')}`);

  const trackers: Array<{ key: string; emoji: string; title: string; value: string; sub?: string; pastel: PastelKey }> = [];
  if (stats.sleep) trackers.push({ key: 'sleep', emoji: '😴', pastel: 'blue', title: t('report.trk.sleep'), value: t('report.trk.sleepVal', { h: num(stats.sleep.avgH, lang) }), sub: t('report.trk.sleepSub', { n: stats.sleep.n, goal: num(stats.sleep.goalH, lang) }) });
  if (stats.mood) trackers.push({ key: 'mood', emoji: '🙂', pastel: 'pink', title: t('report.trk.mood'), value: t('report.trk.moodVal', { avg: num(stats.mood.avg, lang) }), sub: t('report.trk.moodSub', { n: stats.mood.n }) });
  if (stats.water) trackers.push({ key: 'water', emoji: '💧', pastel: 'mint', title: t('report.trk.water'), value: t('report.trk.waterVal', { n: stats.water.goalDays, m: stats.water.days }), sub: t('report.trk.waterSub', { amount: amount(stats.water.avgMl) }) });
  if (stats.smoke) trackers.push({ key: 'smoke', emoji: '🚭', pastel: 'peach', title: t('report.trk.smoke'), value: t('report.trk.smokeVal', { n: stats.smoke.limitDays, m: stats.smoke.tracked }), sub: t('report.trk.smokeSub', { total: stats.smoke.total, money: money(stats.smoke.saved, stats.smoke.currency, lang) }) });
  if (stats.meals) trackers.push({ key: 'meals', emoji: '🍲', pastel: 'yellow', title: t('report.trk.meals'), value: t('report.trk.mealsVal', { n: stats.meals.fastFreeDays }), sub: t('report.trk.mealsSub', { home: stats.meals.home, fast: stats.meals.fast }) });
  if (stats.chores) trackers.push({ key: 'chores', emoji: '🧺', pastel: 'blue', title: t('report.trk.chores'), value: t('report.trk.choresVal', { n: stats.chores.done }) });
  if (stats.study) trackers.push({ key: 'study', emoji: '🎓', pastel: 'purple', title: t('report.trk.study'), value: t('report.trk.studyVal', { h: num(stats.study.minutes / 60, lang) }), sub: t('report.trk.studySub', { n: stats.study.closed }) });
  if (stats.growth) trackers.push({ key: 'growth', emoji: '🚀', pastel: 'green', title: t('report.trk.growth'), value: t('report.trk.growthVal', { n: stats.growth.topDays, m: stats.growth.plannedDays }) });

  const race = stats.race;
  const raceLine = (() => {
    if (!race || !partner) return '';
    if (stats.ended) return race.result === 'win' ? t('report.race.win') : race.result === 'lose' ? t('report.race.lose', { name: partner.name }) : race.result === 'tie' ? t('report.race.tie') : t('report.race.none');
    if (race.mePoints === race.partnerPoints) return t('report.race.tieNow');
    return race.mePoints > race.partnerPoints ? t('report.race.leading') : t('report.race.trailing', { name: partner.name });
  })();

  return (
    <Screen header={header}>
      {picker}
      {stats.days.length < 7 && stats.days.length > 0 ? (
        <Txt size={12} dim center style={{ marginBottom: 10 }}>{t('report.week.inProgress', { n: stats.days.length })}</Txt>
      ) : null}

      {!stats.hasData ? (
        <EmptyState mood="sleepy" title={t('report.empty.weekTitle')} body={t('report.empty.weekBody')} />
      ) : (
        <>
          {/* Özet kartları */}
          <Row gap={12} style={{ alignItems: 'stretch' }}>
            {tile('yellow', t('report.summary.points'), String(stats.points), showDelta ? deltaText(t, cmp.points) : null)}
            {tile(
              'mint',
              t('report.summary.rate'),
              stats.rate === null ? '–' : `%${Math.round(stats.rate * 100)}`,
              showDelta && cmp.rate ? deltaText(t, cmp.rate, 'pts') : null,
            )}
          </Row>
          <Row gap={12} style={{ marginTop: 12, alignItems: 'stretch' }}>
            {tile('peach', t('report.summary.streak'), t('common.unit.days', { n: stats.longestRun }))}
            {tile('purple', t('report.summary.active'), t('report.summary.daysOf', { n: stats.activeDays, m: stats.days.length }), showDelta ? deltaText(t, cmp.activeDays) : null)}
          </Row>
          <Txt size={12} dim style={{ marginTop: 8 }}>
            {showDelta ? (cmp.partial ? t('report.week.vsPartial') : t('report.week.vsFull')) : t('report.week.noPrev')}
          </Txt>

          {/* Yarış */}
          {race && partner ? (
            <Card style={{ marginTop: 12 }} padding={16}>
              <Txt size={13} weight="700" dim>{t('report.race.title')}</Txt>
              <Row between style={{ marginTop: 6 }}>
                <Txt size={26} weight="800">{race.mePoints} – {race.partnerPoints}</Txt>
                <Txt size={13} dim>{partner.name}</Txt>
              </Row>
              <Txt variant="bodyBold" style={{ marginTop: 4 }}>{raceLine}</Txt>
            </Card>
          ) : null}

          {/* Günlük puan + en iyi gün */}
          <Card style={{ marginTop: 12 }} padding={16}>
            <Row between>
              <Txt variant="bodyBold">{t('report.chart.title')}</Txt>
              {stats.bestDay ? <Txt size={12} dim>{t('report.best.title')}: {fmtDay(stats.bestDay.day, lang, 'short')}</Txt> : null}
            </Row>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 84, gap: 8, marginTop: 14 }}>
              {stats.perDay.map((d) => {
                const best = stats.bestDay?.day === d.day;
                const h = d.points === null ? 4 : Math.max(4, (d.points / maxPts) * 72);
                return (
                  <View key={d.day} style={{ flex: 1, alignItems: 'center' }}>
                    <Txt size={10} dim>{d.points ?? ''}</Txt>
                    <View style={{ width: '100%', height: h, borderRadius: 4, backgroundColor: d.points === null ? th.cardAlt : best ? th.primary : alpha(th.isDark ? '#FFFFFF' : '#14171A', 0.28) }} />
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {stats.perDay.map((d, i) => (
                <View key={d.day} style={{ flex: 1, alignItems: 'center' }}>
                  <Txt size={11} dim>{DAYS_LETTER[lang][i]}</Txt>
                </View>
              ))}
            </View>
            {stats.bestDay ? (
              <Txt size={13} style={{ marginTop: 10 }}>
                🏆 {t('report.best.title')}: {DAYS_LONG[lang][weekdayOf(stats.bestDay.day)]} · {t('common.unit.pts', { n: stats.bestDay.points })}
              </Txt>
            ) : null}
          </Card>

          {/* Zaman dilimine göre */}
          <Card style={{ marginTop: 12 }} padding={16}>
            <Txt variant="bodyBold" style={{ marginBottom: 10 }}>{t('report.slots.title')}</Txt>
            {stats.slots.every((s) => s.planned === 0) ? (
              <Txt dim size={14}>{t('report.slots.none')}</Txt>
            ) : (
              stats.slots
                .filter((s) => s.planned > 0)
                .map((s) => (
                  <View key={s.slot} style={{ marginBottom: 10 }}>
                    <Row between>
                      <Txt size={14} weight="600">{SLOT_EMOJI[s.slot]} {t(`task.slot.${s.slot}`)}</Txt>
                      <Txt size={13} dim>{t('report.slots.of', { done: s.done, total: s.planned })} · %{Math.round((s.rate ?? 0) * 100)}</Txt>
                    </Row>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: th.cardAlt, marginTop: 6, overflow: 'hidden' }}>
                      <View style={{ height: 8, width: `${Math.round((s.rate ?? 0) * 100)}%`, backgroundColor: th.success, borderRadius: 4 }} />
                    </View>
                  </View>
                ))
            )}
          </Card>

          {/* Takipçiler */}
          {trackers.length ? (
            <View>
              <SectionHeader title={t('report.trk.title')} />
              {trackers.map((k) => (
                <View key={k.key} style={{ backgroundColor: th.pastel[k.pastel], borderRadius: radius.lg, padding: 14, marginBottom: 10 }}>
                  <Row gap={12}>
                    <Txt size={28}>{k.emoji}</Txt>
                    <View style={{ flex: 1 }}>
                      <Txt size={12} weight="700" color={th.onPastel}>{k.title}</Txt>
                      <Txt size={16} weight="800" color={th.onPastel}>{k.value}</Txt>
                      {k.sub ? <Txt size={12} color={th.onPastel}>{k.sub}</Txt> : null}
                    </View>
                  </Row>
                </View>
              ))}
            </View>
          ) : null}

          {/* İçgörüler */}
          <SectionHeader title={t('report.insights.title')} />
          <Txt size={13} dim style={{ marginBottom: 10 }}>{t('report.insights.intro', { n: WINDOW_DAYS })}</Txt>
          {insights.length === 0 ? (
            <Card padding={16}>
              <Row gap={12}>
                <Txt size={26}>🔎</Txt>
                <Txt dim style={{ flex: 1 }}>{t('report.insights.none')}</Txt>
              </Row>
            </Card>
          ) : (
            insights.map((i) => (
              <Card key={i.id} style={{ marginBottom: 10 }} padding={14}>
                <Row gap={12} style={{ alignItems: 'flex-start' }}>
                  <Txt size={26}>{INSIGHT_EMOJI[i.id]}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt variant="body">{insightText(t, lang, i)}</Txt>
                    <Txt size={12} dim style={{ marginTop: 6 }}>{t('report.insight.basedOn', { n: t('common.unit.days', { n: i.n }) })}</Txt>
                  </View>
                </Row>
              </Card>
            ))
          )}

          {/* Gelecek hafta için öneriler */}
          <SectionHeader title={t('report.sugg.title')} />
          {suggs.map((s, idx) => (
            <View key={s.id} style={{ backgroundColor: th.pastel[SUGG_PASTELS[idx % SUGG_PASTELS.length]], borderRadius: radius.lg, padding: 14, marginBottom: 10 }}>
              <Row gap={12} style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: th.onPastel, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt size={14} weight="800" color={th.pastel[SUGG_PASTELS[idx % SUGG_PASTELS.length]]}>{idx + 1}</Txt>
                </View>
                <Txt style={{ flex: 1 }} color={th.onPastel}>{suggestionText(t, lang, s)}</Txt>
              </Row>
            </View>
          ))}

          <Spacer h={8} />
          <PillButton label={t('report.share.btn')} icon="share-outline" onPress={doShare} />
          <Txt size={12} dim center style={{ marginTop: 14 }}>{t('report.note')}</Txt>
          <Txt size={12} dim center style={{ marginTop: 4 }}>{t('common.medicalNote')}</Txt>
        </>
      )}
    </Screen>
  );
}
