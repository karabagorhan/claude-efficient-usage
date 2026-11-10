import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Confetti } from '../../src/components/Confetti';
import { RingGauge } from '../../src/components/RingGauge';
import { Bar, Card, Header, PastelCard, PillButton, Row, Screen, Txt, success, tap } from '../../src/components/ui';
import { WORKOUTS, routineSeconds, type WorkoutRoutine } from '../../src/data/workouts';
import { MedNote, StatTile, fmtClock, useNow } from '../../src/features/toolsb';
import { L, useLang, useT } from '../../src/i18n';
import { dayKeyOf } from '../../src/engine/dates';
import { useCore } from '../../src/store/core';
import { useWorkout } from '../../src/store/slices/workout';
import { pastelColor, radius, useTheme } from '../../src/theme';

type View_ = 'list' | 'detail' | 'play' | 'done';
interface Step {
  type: 'prep' | 'move' | 'rest';
  sec: number;
  move: number; // hareket dizini (rest için bir sonraki hareket)
}

function buildSteps(r: WorkoutRoutine): Step[] {
  const steps: Step[] = [{ type: 'prep', sec: 3, move: 0 }];
  r.moves.forEach((mv, i) => {
    steps.push({ type: 'move', sec: mv.sec, move: i });
    if (i < r.moves.length - 1) steps.push({ type: 'rest', sec: r.restSec, move: i + 1 });
  });
  return steps;
}

export default function WorkoutScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const logActivity = useCore((s) => s.logActivity);
  const sessions = useWorkout((s) => s.sessions);
  const addSession = useWorkout((s) => s.addSession);

  const [view, setView] = useState<View_>('list');
  const [routine, setRoutine] = useState<WorkoutRoutine>(WORKOUTS[0]);
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [endAt, setEndAt] = useState(0);
  const [remMs, setRemMs] = useState(0);
  const [burst, setBurst] = useState(0);
  const startedAt = useRef(0);

  const steps = useMemo(() => buildSteps(routine), [routine]);
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const playing = view === 'play' && !paused;
  const now = useNow(playing, 200);
  const remaining = playing ? Math.max(0, endAt - now) : remMs;

  const begin = (i: number) => {
    const st = steps[i];
    setStepIdx(i);
    setEndAt(Date.now() + st.sec * 1000);
    setRemMs(st.sec * 1000);
    if (i > 0) tap();
  };

  const finish = useCallback(() => {
    const secs = (Date.now() - startedAt.current) / 1000;
    addSession({ routineId: routine.id, seconds: Math.max(secs, 1), moves: routine.moves.length });
    logActivity('workout');
    success();
    setBurst((b) => b + 1);
    setView('done');
  }, [addSession, logActivity, routine]);

  const advance = useCallback(() => {
    if (stepIdx >= steps.length - 1) finish();
    else begin(stepIdx + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, steps, finish]);

  useEffect(() => {
    if (playing && now >= endAt) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, playing]);

  const startPlay = () => {
    startedAt.current = Date.now();
    setPaused(false);
    setView('play');
    const st = steps[0];
    setStepIdx(0);
    setEndAt(Date.now() + st.sec * 1000);
    setRemMs(st.sec * 1000);
    tap();
  };
  const togglePause = () => {
    tap();
    if (paused) {
      setEndAt(Date.now() + remMs);
      setPaused(false);
    } else {
      setRemMs(Math.max(0, endAt - Date.now()));
      setPaused(true);
    }
  };
  const goPrev = () => {
    // bir önceki hareketin başına dön
    let i = stepIdx - 1;
    while (i > 0 && steps[i].type !== 'move') i--;
    begin(Math.max(1, i));
    setPaused(false);
  };
  const goNext = () => {
    setPaused(false);
    advance();
  };
  const quit = () => {
    setPaused(false);
    setView('detail');
  };

  const todayKey = dayKeyOf();
  const stats = useMemo(() => {
    const l = sessions.filter((s) => s.dayKey === todayKey);
    return { n: l.length, min: Math.round(l.reduce((a, s) => a + s.seconds, 0) / 60) };
  }, [sessions, todayKey]);

  const mins = (r: WorkoutRoutine) => Math.max(1, Math.round(routineSeconds(r) / 60));

  // ---------- liste ----------
  if (view === 'list') {
    return (
      <Screen header={<Header title={t('workout.title')} />}>
        <Txt dim style={{ marginBottom: 12 }}>
          {t('workout.intro')}
        </Txt>
        <Row gap={10} style={{ marginBottom: 16 }}>
          <StatTile value={String(stats.n)} label={`${t('workout.todayTitle')} · ${t('workout.todaySessions')}`} bg={th.pastel.peach} />
          <StatTile value={String(stats.min)} label={`${t('workout.todayTitle')} · ${t('workout.todayMin')}`} bg={th.pastel.mint} />
        </Row>
        <View style={{ gap: 10 }}>
          {WORKOUTS.map((r) => (
            <PastelCard
              key={r.id}
              emoji={r.emoji}
              overline={`${t('workout.minutes', { n: mins(r) })} · ${t('workout.moves', { n: r.moves.length })}`}
              title={L(r.name, lang)}
              pastel={r.pastel}
              onPress={() => {
                setRoutine(r);
                setView('detail');
              }}
            />
          ))}
        </View>
        <MedNote />
      </Screen>
    );
  }

  // ---------- detay ----------
  if (view === 'detail') {
    return (
      <Screen header={<Header title={L(routine.name, lang)} onLeft={() => setView('list')} />}>
        <Card bg={pastelColor(routine.pastel, th.isDark)} padding={18}>
          <Txt size={44}>{routine.emoji}</Txt>
          <Txt variant="h2" color={th.onPastel}>
            {L(routine.name, lang)}
          </Txt>
          <Txt color={th.onPastel} style={{ marginTop: 4 }}>
            {L(routine.desc, lang)}
          </Txt>
          <Txt variant="small" color={th.onPastel} style={{ marginTop: 8 }}>
            {t('workout.minutes', { n: mins(routine) })} · {t('workout.moves', { n: routine.moves.length })} · {t('workout.restBetween', { n: routine.restSec })}
          </Txt>
        </Card>
        <Txt variant="h3" style={{ marginTop: 20, marginBottom: 8 }}>
          {t('workout.movesTitle')}
        </Txt>
        <Card padding={4}>
          {routine.moves.map((mv, i) => (
            <Row key={i} gap={12} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: th.border, alignItems: 'flex-start' }}>
              <Txt size={28}>{mv.emoji}</Txt>
              <View style={{ flex: 1 }}>
                <Row between>
                  <Txt variant="bodyBold" style={{ flex: 1 }}>
                    {L(mv.name, lang)}
                  </Txt>
                  <Txt variant="small" dim>
                    {t('workout.secShort', { n: mv.sec })}
                  </Txt>
                </Row>
                <Txt variant="small" dim>
                  {L(mv.how, lang)}
                </Txt>
              </View>
            </Row>
          ))}
        </Card>
        <View style={{ marginTop: 20 }}>
          <PillButton label={t('workout.start')} icon="play" onPress={startPlay} />
        </View>
        <Txt variant="small" dim center style={{ marginTop: 12 }}>
          {t('workout.painWarning')}
        </Txt>
        <MedNote />
      </Screen>
    );
  }

  // ---------- bitiş ----------
  if (view === 'done') {
    return (
      <Screen header={<Header title={L(routine.name, lang)} onLeft={() => setView('list')} />}>
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Txt size={80}>🎉</Txt>
          <Txt variant="h1" center style={{ marginTop: 12 }}>
            {t('workout.doneTitle')}
          </Txt>
          <Txt dim center style={{ marginTop: 8 }}>
            {t('workout.doneBody', { routine: L(routine.name, lang), n: routine.moves.length, min: mins(routine) })}
          </Txt>
        </View>
        <View style={{ gap: 10, marginTop: 32 }}>
          <PillButton label={t('workout.again')} icon="refresh" onPress={startPlay} />
          <PillButton label={t('workout.back')} kind="outline" onPress={() => setView('list')} />
        </View>
        <Confetti fire={burst} />
      </Screen>
    );
  }

  // ---------- oynatıcı ----------
  const mv = routine.moves[step.move];
  const nextMove = step.type === 'move' ? routine.moves[step.move + 1] : step.type === 'rest' || step.type === 'prep' ? mv : undefined;
  const totalSteps = steps.length;
  const overall = (stepIdx + 1 - remaining / (step.sec * 1000)) / totalSteps;
  const ringColor = step.type === 'move' ? th.coral : step.type === 'rest' ? th.success : th.blue;
  const sec = Math.ceil(remaining / 1000);
  return (
    <Screen header={<Header title={L(routine.name, lang)} left="close" onLeft={quit} />}>
      <Bar value={Math.max(0, Math.min(1, overall))} color={th.coral} height={8} />
      <Txt variant="small" dim center style={{ marginTop: 8 }}>
        {step.type === 'prep' ? t('workout.prepare') : t('workout.step', { n: step.move + 1 - (step.type === 'rest' ? 1 : 0), total: routine.moves.length })}
      </Txt>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <RingGauge value={1 - remaining / (step.sec * 1000)} size={260} stroke={16} color={ringColor}>
          <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
            {step.type === 'prep' ? (
              <Txt size={96} weight="800">
                {sec}
              </Txt>
            ) : (
              <>
                <Txt size={64}>{step.type === 'rest' ? '😮‍💨' : mv.emoji}</Txt>
                <Txt size={44} weight="800" style={{ fontVariant: ['tabular-nums'] }}>
                  {fmtClock(remaining / 1000)}
                </Txt>
              </>
            )}
          </View>
        </RingGauge>
      </View>
      <Txt variant="h1" center style={{ marginTop: 16 }}>
        {step.type === 'prep' ? t('workout.prepare') : step.type === 'rest' ? t('workout.rest') : L(mv.name, lang)}
      </Txt>
      <Txt dim center style={{ marginTop: 6, minHeight: 44 }}>
        {step.type === 'move' ? L(mv.how, lang) : step.type === 'rest' ? t('workout.next', { name: L(mv.name, lang) }) : t('workout.next', { name: L(mv.name, lang) })}
      </Txt>
      {step.type === 'move' ? (
        <View style={{ backgroundColor: th.cardAlt, borderRadius: radius.md, padding: 12, marginTop: 12, alignItems: 'center' }}>
          <Txt variant="small" dim>
            {nextMove ? t('workout.next', { name: `${nextMove.emoji} ${L(nextMove.name, lang)}` }) : t('workout.last')}
          </Txt>
        </View>
      ) : null}
      <Row gap={10} style={{ marginTop: 20 }}>
        <View style={{ flex: 1 }}>
          <PillButton label={t('workout.prev')} kind="outline" icon="play-back" onPress={goPrev} disabled={stepIdx <= 1} />
        </View>
        <View style={{ flex: 1 }}>
          <PillButton label={t('workout.skip')} kind="outline" icon="play-forward" onPress={goNext} />
        </View>
      </Row>
      <View style={{ marginTop: 10 }}>
        <PillButton label={paused ? t('workout.resume') : t('workout.pause')} icon={paused ? 'play' : 'pause'} onPress={togglePause} />
      </View>
      <Txt variant="small" dim center style={{ marginTop: 12 }}>
        {t('workout.painWarning')}
      </Txt>
    </Screen>
  );
}
