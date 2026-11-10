import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Confetti } from '../../src/components/Confetti';
import { RingGauge } from '../../src/components/RingGauge';
import { Card, Chip, Header, PillButton, Row, Screen, Segmented, Txt, success, tap } from '../../src/components/ui';
import { dayKeyOf } from '../../src/engine/dates';
import { StatTile, fmtClock, useNow } from '../../src/features/toolsb';
import { useT } from '../../src/i18n';
import { cancelOne, scheduleOne } from '../../src/lib/notifications';
import { routes } from '../../src/lib/routes';
import { isDone, today, useCore } from '../../src/store/core';
import { TIMER_TAGS, minutesByTagOf, useTimer, type TimerTag } from '../../src/store/slices/timer';
import { radius, useTheme } from '../../src/theme';

const PRESETS = [5, 10, 15, 25, 45, 60, 90];
const POMO = { work: 25, short: 5, long: 15, rounds: 4 };
type Mode = 'focus' | 'pomodoro';
type Phase = 'idle' | 'running' | 'paused' | 'done';
type Stage = 'work' | 'break' | 'long';

export default function TimerScreen() {
  const t = useT();
  const th = useTheme();
  const params = useLocalSearchParams<{ habitId?: string; minutes?: string; tag?: string }>();
  const habitId = typeof params.habitId === 'string' && params.habitId ? params.habitId : undefined;
  const habit = useCore((s) => (habitId ? s.habits[habitId] : undefined));
  const habitDone = useCore((s) => (habitId ? isDone(s, habitId, today()) : false));
  const complete = useCore((s) => s.complete);
  const logActivity = useCore((s) => s.logActivity);
  const pushToast = useCore((s) => s.pushToast);
  const sessions = useTimer((s) => s.sessions);
  const addSession = useTimer((s) => s.addSession);
  const setLast = useTimer((s) => s.setLast);
  const tag = useTimer((s) => s.lastTag);
  const setTag = useTimer((s) => s.setTag);
  const paramTag = typeof params.tag === 'string' && (TIMER_TAGS as readonly string[]).includes(params.tag) ? (params.tag as TimerTag) : undefined;
  // rota etiketi (okul/gelişim "Odaklan") seçili etiketi belirler
  useEffect(() => {
    if (paramTag) setTag(paramTag);
  }, [paramTag, setTag]);

  const paramMin = Number(params.minutes);
  const habitMin = habit?.kind === 'timer' && habit.target ? habit.target : undefined;
  const initialMin = Number.isFinite(paramMin) && paramMin > 0 ? Math.min(180, Math.round(paramMin)) : habitMin ?? useTimer.getState().lastMinutes ?? 25;

  const [mode, setMode] = useState<Mode>(useTimer.getState().lastMode === 'pomodoro' && !params.minutes ? 'pomodoro' : 'focus');
  const [minutes, setMinutes] = useState(initialMin);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stage, setStage] = useState<Stage>('work');
  const [round, setRound] = useState(1);
  const [endAt, setEndAt] = useState(0);
  const [remMs, setRemMs] = useState(initialMin * 60000);
  const [burst, setBurst] = useState(0);
  const [doneMin, setDoneMin] = useState(0);
  const startedAt = useRef(0); // geçerli odak diliminin başlangıcı (ilerleme için)
  const notif = useRef<Promise<string | null> | null>(null);

  const segMs = useCallback(
    (m: Mode, mins: number, st: Stage) => (m === 'focus' ? mins : st === 'work' ? POMO.work : st === 'break' ? POMO.short : POMO.long) * 60000,
    [],
  );

  const cancelNotif = useCallback(() => {
    const p = notif.current;
    notif.current = null;
    p?.then((id) => {
      if (id) cancelOne(id);
    }).catch(() => {});
  }, []);

  const scheduleEnd = useCallback(
    (m: Mode, st: Stage, at: number, rnd: number) => {
      cancelNotif();
      const key = m === 'focus' ? 'Focus' : st === 'work' ? 'Focus' : st === 'break' ? 'Break' : 'Long';
      const last = m === 'pomodoro' && st === 'work' && rnd >= POMO.rounds;
      notif.current = scheduleOne('timer', {
        title: t(`timer.notif${last ? 'Focus' : key}Title`),
        body: t(`timer.notif${last ? 'Focus' : key}Body`),
        trigger: { kind: 'date', date: new Date(at) },
        url: routes.tool('timer'),
      });
    },
    [cancelNotif, t],
  );

  // çıkışta bildirimi iptal et
  useEffect(() => () => cancelNotif(), [cancelNotif]);

  const running = phase === 'running';
  const now = useNow(running, 250);
  const remaining = running ? Math.max(0, endAt - now) : remMs;
  const total = segMs(mode, minutes, stage);

  const recordFocus = useCallback(
    (mins: number) => {
      addSession({ minutes: mins, mode, habitId, tag });
      logActivity('focus');
    },
    [addSession, logActivity, mode, habitId, tag],
  );

  const completeHabit = useCallback(() => {
    if (!habitId) return;
    const c = complete(habitId);
    if (c && habit) pushToast('toast.completedTitle', { title: habit.title, points: c.points });
  }, [habitId, habit, complete, pushToast]);

  // süre doldu
  useEffect(() => {
    if (!running || now < endAt) return;
    success();
    if (mode === 'focus') {
      setPhase('done');
      setRemMs(0);
      setDoneMin(minutes);
      setBurst((b) => b + 1);
      recordFocus(minutes);
      completeHabit();
      return;
    }
    // pomodoro
    if (stage === 'work') {
      recordFocus(POMO.work);
      setBurst((b) => b + 1);
      if (round >= POMO.rounds) {
        completeHabit();
        setStage('long');
        const at = Date.now() + POMO.long * 60000;
        setEndAt(at);
        startedAt.current = Date.now();
        scheduleEnd('pomodoro', 'long', at, round);
      } else {
        setStage('break');
        const at = Date.now() + POMO.short * 60000;
        setEndAt(at);
        scheduleEnd('pomodoro', 'break', at, round);
      }
    } else if (stage === 'break') {
      setStage('work');
      setRound(round + 1);
      const at = Date.now() + POMO.work * 60000;
      setEndAt(at);
      scheduleEnd('pomodoro', 'work', at, round + 1);
    } else {
      setPhase('done');
      setRemMs(0);
      setDoneMin(POMO.work * POMO.rounds);
      setBurst((b) => b + 1);
      cancelNotif();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, running]);

  const start = () => {
    tap();
    const st: Stage = 'work';
    const dur = segMs(mode, minutes, st);
    const at = Date.now() + dur;
    setStage(st);
    setRound(1);
    setEndAt(at);
    setRemMs(dur);
    setPhase('running');
    startedAt.current = Date.now();
    setLast(minutes, mode);
    scheduleEnd(mode, st, at, 1);
  };
  const pause = () => {
    tap();
    setRemMs(Math.max(0, endAt - Date.now()));
    setPhase('paused');
    cancelNotif();
  };
  const resume = () => {
    tap();
    const at = Date.now() + remMs;
    setEndAt(at);
    setPhase('running');
    scheduleEnd(mode, stage, at, round);
  };
  const reset = (nextMode: Mode = mode, nextMin: number = minutes) => {
    cancelNotif();
    setPhase('idle');
    setStage('work');
    setRound(1);
    setRemMs(segMs(nextMode, nextMin, 'work'));
  };
  const completeNow = () => {
    // yalnızca geçen süre >= 1 dk ise odak kaydı tut
    const elapsed = phase === 'running' ? total - Math.max(0, endAt - Date.now()) : total - remMs;
    if (elapsed >= 60000 && stage === 'work') recordFocus(elapsed / 60000);
    completeHabit();
    success();
    setBurst((b) => b + 1);
    reset();
  };

  const pickMinutes = (m: number) => {
    setMinutes(m);
    setRemMs(m * 60000);
    setLast(m, mode);
  };
  const changeMode = (m: Mode) => {
    setMode(m);
    reset(m, minutes);
  };

  // bugünkü toplam
  const todayKey = dayKeyOf();
  const stats = useMemo(() => {
    const list = sessions.filter((s) => s.dayKey === todayKey);
    return { min: Math.round(list.reduce((a, s) => a + s.minutes, 0)), n: list.length, byTag: minutesByTagOf(sessions, todayKey, todayKey) };
  }, [sessions, todayKey]);

  const progress = total > 0 ? 1 - remaining / total : 0;
  const ringColor = stage === 'work' ? th.coral : th.success;
  const stageLabel =
    phase === 'done' ? t('timer.stage.done') : phase === 'idle' ? t('timer.stage.idle') : phase === 'paused' ? t('timer.stage.paused') : t(`timer.stage.${stage}`);
  const showPresets = mode === 'focus' && phase === 'idle';
  const presetList = PRESETS.includes(minutes) ? PRESETS : [...PRESETS, minutes].sort((a, b) => a - b);

  return (
    <Screen header={<Header title={t('timer.title')} />}>
      {habit ? (
        <View style={{ backgroundColor: th.cardAlt, borderRadius: radius.md, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Txt size={22}>{habit.icon}</Txt>
          <View style={{ flex: 1 }}>
            <Txt variant="caption" dim>
              {t('timer.linkedTask')}
            </Txt>
            <Txt variant="bodyBold" numberOfLines={1}>
              {habit.title}
            </Txt>
          </View>
          {habitDone ? <Txt size={20}>✅</Txt> : null}
        </View>
      ) : null}

      <Segmented<Mode>
        value={mode}
        onChange={changeMode}
        options={[
          { id: 'focus', label: t('timer.modeFocus') },
          { id: 'pomodoro', label: t('timer.modePomodoro') },
        ]}
      />

      <View style={{ marginTop: 16 }}>
        <Txt variant="small" dim style={{ marginBottom: 6 }}>
          {t('timer.tagTitle')}
        </Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {TIMER_TAGS.map((g: TimerTag) => (
            <Chip key={g} label={t(`timer.tag.${g}`)} active={g === tag} onPress={() => phase === 'idle' && setTag(g)} />
          ))}
        </Row>
      </View>

      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <RingGauge value={phase === 'done' ? 1 : progress} size={280} stroke={18} color={ringColor}>
          <View style={{ alignItems: 'center' }}>
            <Txt size={60} weight="800" style={{ fontVariant: ['tabular-nums'] }}>
              {fmtClock(remaining / 1000)}
            </Txt>
            <Txt variant="bodyBold" dim>
              {stageLabel}
            </Txt>
            {mode === 'pomodoro' ? (
              <Row gap={6} style={{ marginTop: 10 }}>
                {Array.from({ length: POMO.rounds }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: i < round - (phase === 'done' || stage !== 'work' ? 0 : 1) ? th.coral : 'transparent',
                      borderWidth: 2,
                      borderColor: th.coral,
                    }}
                  />
                ))}
              </Row>
            ) : null}
          </View>
        </RingGauge>
        {mode === 'pomodoro' ? (
          <Txt variant="small" dim center style={{ marginTop: 12 }}>
            {phase === 'idle' ? t('timer.pomodoroInfo') : t('timer.round', { n: round, total: POMO.rounds })}
          </Txt>
        ) : null}
      </View>

      {phase === 'done' ? (
        <Card bg={th.pastel.mint} padding={18} style={{ marginBottom: 12 }}>
          <Txt variant="h3" color={th.onPastel}>
            🎉 {t('timer.doneTitle')}
          </Txt>
          <Txt color={th.onPastel} style={{ marginTop: 4 }}>
            {mode === 'pomodoro' ? t('timer.pomoDoneBody') : t('timer.doneBody', { n: doneMin })}
          </Txt>
        </Card>
      ) : null}

      {showPresets ? (
        <View style={{ marginBottom: 12 }}>
          <Txt variant="bodyBold" style={{ marginBottom: 8 }}>
            {t('timer.presets')}
          </Txt>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {presetList.map((m) => (
              <Chip key={m} label={t('common.unit.minutes', { n: m })} active={m === minutes} onPress={() => pickMinutes(m)} />
            ))}
          </Row>
        </View>
      ) : null}

      <View style={{ gap: 10, marginTop: 8 }}>
        {phase === 'idle' ? <PillButton label={t('timer.start')} icon="play" onPress={start} /> : null}
        {phase === 'running' ? <PillButton label={t('timer.pause')} icon="pause" onPress={pause} /> : null}
        {phase === 'paused' ? <PillButton label={t('timer.resume')} icon="play" onPress={resume} /> : null}
        {phase === 'done' ? <PillButton label={t('timer.again')} icon="refresh" onPress={() => reset()} /> : null}
        {phase === 'running' || phase === 'paused' ? <PillButton label={t('timer.reset')} kind="outline" onPress={() => reset()} /> : null}
        {habit && !habitDone && phase !== 'done' ? <PillButton label={t('timer.completeNow')} kind="ghost" onPress={completeNow} /> : null}
      </View>

      <Card padding={16} style={{ marginTop: 20 }}>
        <Txt variant="bodyBold" style={{ marginBottom: 10 }}>
          {t('timer.todayTitle')}
        </Txt>
        <Row gap={10}>
          <StatTile value={String(stats.min)} label={t('timer.todayMinutes')} bg={th.pastel.blue} />
          <StatTile value={String(stats.n)} label={t('timer.todaySessions')} bg={th.pastel.peach} />
        </Row>
        <Txt variant="small" dim style={{ marginTop: 12, marginBottom: 6 }}>
          {t('timer.byTag')}
        </Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {TIMER_TAGS.filter((g) => stats.byTag[g] > 0).map((g) => (
            <Chip key={g} label={`${t(`timer.tag.${g}`)} · ${Math.round(stats.byTag[g])} ${t('common.unit.min')}`} />
          ))}
          {stats.n === 0 ? <Txt variant="small" faint>—</Txt> : null}
        </Row>
      </Card>
      <Confetti fire={burst} />
    </Screen>
  );
}
