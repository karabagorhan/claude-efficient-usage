/**
 * Rutin sekmesi — uygulamanın ana panosu (SPEC §3.2).
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Confetti } from '../../src/components/Confetti';
import { RingGauge } from '../../src/components/RingGauge';
import { TaskCard } from '../../src/components/TaskCard';
import { Card, EmptyState, PillButton, Row, Screen, SectionHeader, Txt, success, tap } from '../../src/components/ui';
import { addDays, weekStartKey } from '../../src/engine/dates';
import { currentStreak, isPlannedOn } from '../../src/engine/points';
import type { Habit, Slot } from '../../src/engine/types';
import { DuelCard } from '../../src/features/routine/DuelCard';
import { LifeStrip } from '../../src/features/routine/LifeStrip';
import { WeekStrip } from '../../src/features/routine/WeekStrip';
import { fmtDay, useLang, useT } from '../../src/i18n';
import { completionId } from '../../src/lib/id';
import { routes } from '../../src/lib/routes';
import {
  habitsBySlot,
  pointsOnDay,
  selectTodayPoints,
  today,
  useActiveDays,
  useCore,
  useDayStreak,
  useHabitsOnDay,
} from '../../src/store/core';
import { radius, useTheme } from '../../src/theme';

const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'anytime'];

function greetingKey(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'common.greeting.morning';
  if (h >= 12 && h < 18) return 'common.greeting.afternoon';
  if (h >= 18 && h < 22) return 'common.greeting.evening';
  return 'common.greeting.night';
}

export default function ScreenRoutine() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const todayKey = today();

  const me = useCore((s) => s.me);
  const partner = useCore((s) => s.partner);
  const habits = useCore((s) => s.habits);
  const completions = useCore((s) => s.completions);
  const progress = useCore((s) => s.progress);
  const nudges = useCore((s) => s.nudges);
  const seenNudges = useCore((s) => s.seenNudges);
  const backfillUsed = useCore((s) => s.backfillUsed);
  const myPts = useCore(selectTodayPoints);
  const partnerPts = useCore((s) => (s.partner ? pointsOnDay(s, s.partner.id, today()) : 0));
  const streak = useDayStreak();
  const active = useActiveDays();

  const [sel, setSel] = useState(todayKey);
  const [burst, setBurst] = useState(0);

  const list = useHabitsOnDay(sel);
  const hasAny = useMemo(() => Object.values(habits).some((h) => h.ownerId === me?.id && !h.archived), [habits, me?.id]);
  const normal = useMemo(() => list.filter((h) => !h.schedule.weeklyQuota), [list]);
  const quota = useMemo(() => list.filter((h) => h.schedule.weeklyQuota), [list]);
  const bySlot = useMemo(() => habitsBySlot(normal), [normal]);
  const myComps = useMemo(() => Object.values(completions).filter((c) => c.userId === me?.id), [completions, me?.id]);

  const isToday = sel === todayKey;
  const isYesterday = sel === addDays(todayKey, -1);
  // backfillUsed değişince yeniden hesaplanır
  const backfillOk = useMemo(() => isYesterday && useCore.getState().canBackfill(), [isYesterday, backfillUsed]);
  const canEdit = isToday || backfillOk;

  const doneOn = (id: string, day = sel) => Boolean(completions[completionId(id, day)]);
  const doneCount = normal.filter((h) => doneOn(h.id)).length;
  const weekStart = weekStartKey(sel);
  const weekCount = (h: Habit) => {
    let n = 0;
    for (let i = 0; i < 7; i++) if (completions[completionId(h.id, addDays(weekStart, i))]) n++;
    return n;
  };

  const partnerList = useMemo(() => {
    if (!partner) return [] as Habit[];
    return Object.values(habits).filter((h) => h.ownerId === partner.id && !h.archived && isPlannedOn(h, sel));
  }, [habits, partner, sel]);

  const unseen = useMemo(() => {
    if (!me) return [];
    return Object.values(nudges)
      .filter((n) => n.to === me.id && !seenNudges[n.id])
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [nudges, seenNudges, me]);

  if (!me) return <Screen><View /></Screen>;

  const celebrate = (h: Habit, points: number) => {
    success();
    setBurst((b) => b + 1);
    useCore.getState().pushToast({ key: 'toast.completedTitle', params: { title: h.title, points }, emoji: '🎉' });
  };

  const completeNow = (h: Habit) => {
    const core = useCore.getState();
    if (h.kind === 'counter' && h.target) {
      const cur = core.progress[`${h.id}|${sel}`] ?? 0;
      if (cur < h.target) core.addProgress(h.id, sel, h.target - cur);
    }
    const c = core.complete(h.id, sel, backfillOk && !isToday ? { backfill: true } : undefined);
    if (c) celebrate(h, c.points);
  };

  const undoNow = (h: Habit) => {
    useCore.getState().undo(h.id, sel);
    useCore.getState().pushToast('toast.undone');
  };

  const onPress = (h: Habit) => {
    if (!canEdit) return;
    if (doneOn(h.id)) {
      if (isToday) undoNow(h);
      return;
    }
    if (isToday) {
      // bağlı görev: ilgili aracı / takipçiyi aç (oradaki kayıt görevi tamamlar); elle tamamlama onay dairesiyle
      if (h.link) return void router.push(routes.linkTarget(h.link));
      if (h.kind === 'timer') return void router.push(routes.timer({ habitId: h.id, minutes: h.target }));
      if (h.kind === 'counter' && h.target) {
        const core = useCore.getState();
        const next = core.addProgress(h.id, sel, h.step ?? 1);
        if (next >= h.target) {
          const c = core.complete(h.id, sel);
          if (c) celebrate(h, c.points);
        }
        return;
      }
    }
    completeNow(h);
  };

  const onToggle = (h: Habit) => {
    if (!canEdit) return;
    if (doneOn(h.id)) {
      if (isToday) undoNow(h);
      return;
    }
    completeNow(h);
  };

  const edit = (h: Habit) => router.push(routes.editTask(h.id));

  const renderCard = (h: Habit, opts?: { overline?: string }) => {
    const done = doneOn(h.id);
    const c = completions[completionId(h.id, sel)];
    const interactive = canEdit && (isToday || !done);
    return (
      <TaskCard
        key={h.id}
        habit={h}
        done={done}
        progress={progress[`${h.id}|${sel}`] ?? 0}
        streak={h.schedule.weeklyQuota ? undefined : currentStreak(h, myComps, sel)}
        points={c?.points}
        overline={opts?.overline}
        readOnly={!interactive}
        onPress={() => onPress(h)}
        onToggle={() => onToggle(h)}
        onLongPress={() => edit(h)}
      />
    );
  };

  const pct = normal.length ? doneCount / normal.length : 0;
  const allDone = normal.length > 0 && doneCount === normal.length;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Screen padBottom={110}>
        {/* Üst: selam + seri + puan */}
        <Row between gap={12} style={{ marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="h2" numberOfLines={2}>
              {tr(greetingKey(), { name: me.name })}
            </Txt>
            <Txt dim>{fmtDay(todayKey, lang)}</Txt>
          </View>
          <Row gap={8}>
            <Pressable
              accessibilityLabel={tr('routine.streakLabel', { n: streak })}
              onPress={() => {
                tap();
                router.push(routes.streak());
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 40, borderRadius: radius.pill, backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}
            >
              <Txt size={18}>🔥</Txt>
              <Txt variant="bodyBold">{streak}</Txt>
            </Pressable>
            <View
              accessibilityLabel={tr('routine.todayPts', { n: myPts })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 40, borderRadius: radius.pill, backgroundColor: t.pastel.yellow }}
            >
              <Txt size={16}>⭐</Txt>
              <Txt variant="bodyBold" color={t.onPastel}>
                {myPts}
              </Txt>
            </View>
          </Row>
        </Row>

        <WeekStrip weekStart={weekStart} selected={sel} today={todayKey} active={active} onSelect={setSel} onShift={(w) => setSel(addDays(sel, 7 * w))} />

        {/* Dürtme / tebrik bandı */}
        {unseen.length > 0 ? (
          <Card bg={t.pastel.pink} style={{ marginTop: 16 }}>
            <Row between gap={12}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyBold" color={t.onPastel}>
                  {tr(`routine.nudge.${unseen[0].kind}`, { name: partner?.name ?? '' })}
                </Txt>
                {unseen[0].text ? (
                  <Txt variant="small" color={t.onPastel} numberOfLines={2}>
                    {unseen[0].text}
                  </Txt>
                ) : null}
              </View>
              <PillButton small label={tr('routine.nudge.dismiss')} onPress={() => useCore.getState().markNudgesSeen()} />
            </Row>
          </Card>
        ) : null}

        {/* Salt okunur / unuttum hakkı bandı */}
        {backfillOk && !isToday ? (
          <Card bg={t.pastel.yellow} style={{ marginTop: 16 }}>
            <Row gap={12}>
              <Txt size={28}>🕘</Txt>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyBold" color={t.onPastel}>
                  {tr('routine.backfill.title')}
                </Txt>
                <Txt variant="small" color={t.onPastel}>
                  {tr('routine.backfill.body')}
                </Txt>
              </View>
            </Row>
          </Card>
        ) : !isToday ? (
          <Row gap={6} style={{ marginTop: 16 }}>
            <Ionicons name="lock-closed-outline" size={14} color={t.textDim} />
            <Txt variant="small" dim>
              {sel < todayKey ? tr('task.readOnlyDay') : tr('routine.readOnlyFuture')}
            </Txt>
          </Row>
        ) : null}

        {/* Yarış kartı */}
        <View style={{ height: 16 }} />
        <DuelCard me={me} partner={partner} myPts={myPts} partnerPts={partnerPts} />
        {isToday ? <LifeStrip day={todayKey} /> : null}

        {!hasAny ? (
          <EmptyState
            title={tr('routine.empty.title')}
            body={tr('routine.empty.body')}
            action={{ label: tr('routine.empty.cta'), onPress: () => router.push(routes.newTask()) }}
          />
        ) : (
          <>
            {/* Günlük ilerleme */}
            <Card style={{ marginBottom: 4 }}>
              <Row between gap={12}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyBold">{tr('routine.progress.title')}</Txt>
                  <Txt dim>{normal.length ? tr('routine.progress.count', { done: doneCount, total: normal.length }) : tr('routine.progress.none')}</Txt>
                  {allDone ? (
                    <Txt variant="small" color={t.success} weight="700" style={{ marginTop: 4 }}>
                      {tr('routine.progress.allDone')}
                    </Txt>
                  ) : null}
                </View>
                <RingGauge value={pct} size={68} stroke={9} color={t.success} label={`${Math.round(pct * 100)}%`} />
              </Row>
            </Card>

            {/* Zaman dilimine göre görevler */}
            {SLOTS.map((slot) =>
              bySlot[slot].length ? (
                <View key={slot}>
                  <SectionHeader title={tr(`task.slot.${slot}`)} />
                  {bySlot[slot].map((h) => renderCard(h))}
                </View>
              ) : null,
            )}

            {/* Haftalık hedefler */}
            {quota.length ? (
              <View>
                <SectionHeader title={tr('routine.weekly.title')} />
                {quota.map((h) => renderCard(h, { overline: tr('routine.weekly.count', { done: weekCount(h), n: h.schedule.weeklyQuota ?? 1 }) }))}
              </View>
            ) : null}

            {/* Partnerin görevleri */}
            {partner && partnerList.length ? (
              <View>
                <SectionHeader title={tr('routine.partner.title', { name: partner.name })} />
                {partnerList.map((h) => (
                  <TaskCard key={h.id} habit={h} done={Boolean(completions[completionId(h.id, sel)])} masked={h.isPrivate} readOnly />
                ))}
              </View>
            ) : null}
          </>
        )}
      </Screen>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr('routine.addTask')}
        onPress={() => {
          tap();
          router.push(routes.newTask());
        }}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: t.primary,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }],
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        })}
      >
        <Ionicons name="add" size={32} color={t.onPrimary} />
      </Pressable>
      <Confetti fire={burst} />
    </View>
  );
}
