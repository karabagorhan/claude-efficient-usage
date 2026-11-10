import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { Confetti } from '../../src/components/Confetti';
import { Card, Chip, Header, PastelCard, PillButton, Row, Screen, SectionHeader, Txt, success, tap } from '../../src/components/ui';
import { BREATH_PATTERNS, MEDITATE_DURATIONS } from '../../src/data/breathPatterns';
import { MedNote, StatTile, fmtClock, useNow } from '../../src/features/toolsb';
import { L, fmtDay, useLang, useT } from '../../src/i18n';
import { useCore } from '../../src/store/core';
import { useMeditate } from '../../src/store/slices/meditate';
import { alpha, pastelColor, radius, useTheme } from '../../src/theme';

const MIN_SCALE = 0.5;
const SIZE = 250;
type Phase = 'idle' | 'running' | 'paused' | 'done';

export default function MeditateScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const logActivity = useCore((s) => s.logActivity);
  const sessions = useMeditate((s) => s.sessions);
  const addSession = useMeditate((s) => s.addSession);
  const setLast = useMeditate((s) => s.setLast);

  const [patternId, setPatternId] = useState(() => useMeditate.getState().lastPattern);
  const [minutes, setMinutes] = useState(() => useMeditate.getState().lastMinutes);
  const [phase, setPhase] = useState<Phase>('idle');
  const [burst, setBurst] = useState(0);
  const [doneSec, setDoneSec] = useState(0);
  const acc = useRef(0); // duraklatmalarda biriken süre (ms)
  const startTs = useRef(0);
  const scale = useRef(new Animated.Value(MIN_SCALE)).current;

  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];
  const cycleSec = pattern.phases.reduce((a, p) => a + p.sec, 0);
  const totalMs = minutes * 60000;

  const running = phase === 'running';
  const now = useNow(running, 100);
  const elapsed = Math.min(totalMs, acc.current + (running ? Math.max(0, now - startTs.current) : 0));

  // evre hesabı
  const cycleMs = cycleSec * 1000;
  const pos = elapsed % cycleMs;
  const round = Math.floor(elapsed / cycleMs) + 1;
  let idx = 0;
  let phaseStart = 0;
  for (let i = 0; i < pattern.phases.length; i++) {
    const len = pattern.phases[i].sec * 1000;
    if (pos < phaseStart + len) {
      idx = i;
      break;
    }
    phaseStart += len;
    idx = i;
  }
  const cur = pattern.phases[idx];
  const phaseElapsed = pos - phaseStart;
  const phaseLeft = Math.max(0, cur.sec - phaseElapsed / 1000);
  const phaseKey = `${round}:${idx}`;

  const finish = useCallback(
    (secs: number) => {
      addSession({ seconds: secs, patternId });
      logActivity('meditate');
    },
    [addSession, logActivity, patternId],
  );

  // süre bitti
  useEffect(() => {
    if (running && elapsed >= totalMs) {
      setPhase('done');
      setDoneSec(totalMs / 1000);
      setBurst((b) => b + 1);
      success();
      finish(totalMs / 1000);
      scale.stopAnimation();
      Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  }, [running, elapsed, totalMs, finish, scale]);

  // evre değişince animasyon + haptik
  const firstPhase = useRef(true);
  useEffect(() => {
    if (!running) {
      scale.stopAnimation();
      return;
    }
    if (!firstPhase.current) tap();
    firstPhase.current = false;
    const remaining = Math.max(200, (cur.sec - phaseElapsed / 1000) * 1000);
    if (cur.kind === 'in' || cur.kind === 'out') {
      Animated.timing(scale, {
        toValue: cur.kind === 'in' ? 1 : MIN_SCALE,
        duration: remaining,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey, running]);

  const start = () => {
    tap();
    acc.current = 0;
    startTs.current = Date.now();
    firstPhase.current = true;
    scale.setValue(MIN_SCALE);
    setLast(patternId, minutes);
    setPhase('running');
  };
  const pause = () => {
    tap();
    acc.current = elapsed;
    setPhase('paused');
  };
  const resume = () => {
    tap();
    startTs.current = Date.now();
    firstPhase.current = true;
    setPhase('running');
  };
  const stop = () => {
    const secs = elapsed / 1000;
    if (secs >= 20) finish(secs);
    scale.stopAnimation();
    scale.setValue(MIN_SCALE);
    acc.current = 0;
    setPhase('idle');
  };
  const again = () => {
    scale.setValue(MIN_SCALE);
    acc.current = 0;
    setPhase('idle');
  };

  const stats = useMemo(() => {
    const secs = sessions.reduce((a, s) => a + s.seconds, 0);
    return { min: Math.round(secs / 60), n: sessions.length };
  }, [sessions]);
  const recent = useMemo(() => sessions.slice(-5).reverse(), [sessions]);

  const circle = pastelColor(pattern.pastel, th.isDark);
  const leftSec = Math.max(0, (totalMs - elapsed) / 1000);
  const active = phase !== 'idle';

  const Circle = (
    <View style={{ width: SIZE + 40, height: SIZE + 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      <View style={{ position: 'absolute', width: SIZE + 40, height: SIZE + 40, borderRadius: 999, borderWidth: 2, borderColor: alpha(circle, 0.7), borderStyle: 'dashed' }} />
      <Animated.View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: circle,
          transform: [{ scale }],
          shadowColor: circle,
          shadowOpacity: 0.6,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {phase === 'done' ? (
          <Txt size={44}>🎉</Txt>
        ) : (
          <>
            <Txt variant="h2" color={th.onPastel}>
              {active ? t(`meditate.phase.${cur.kind}`) : pattern.ratio}
            </Txt>
            <Txt size={54} weight="800" color={th.onPastel} style={{ fontVariant: ['tabular-nums'] }}>
              {active ? Math.ceil(phaseLeft) : '🫧'}
            </Txt>
          </>
        )}
      </View>
    </View>
  );

  return (
    <Screen header={<Header title={t('meditate.title')} />}>
      {!active ? (
        <>
          <Txt dim center style={{ marginBottom: 8 }}>
            {t('meditate.intro')}
          </Txt>
          {Circle}
          <Txt variant="h3" style={{ marginTop: 8, marginBottom: 10 }}>
            {t('meditate.patterns')}
          </Txt>
          <View style={{ gap: 10 }}>
            {BREATH_PATTERNS.map((p) => (
              <PastelCard
                key={p.id}
                emoji={p.emoji}
                overline={p.ratio}
                title={L(p.name, lang)}
                pastel={p.pastel}
                right={
                  <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: th.onPastel, alignItems: 'center', justifyContent: 'center' }}>
                    {p.id === patternId ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: th.onPastel }} /> : null}
                  </View>
                }
                onPress={() => setPatternId(p.id)}
              />
            ))}
          </View>
          <Txt variant="small" dim style={{ marginTop: 8 }}>
            {L(pattern.desc, lang)}
          </Txt>
          <Txt variant="h3" style={{ marginTop: 16, marginBottom: 10 }}>
            {t('meditate.duration')}
          </Txt>
          <Row gap={8}>
            {MEDITATE_DURATIONS.map((m) => (
              <Chip key={m} label={t('common.unit.minutes', { n: m })} active={m === minutes} onPress={() => setMinutes(m)} />
            ))}
          </Row>
          <View style={{ marginTop: 20 }}>
            <PillButton label={t('meditate.start')} icon="play" onPress={start} />
          </View>

          <SectionHeader title={t('meditate.historyTitle')} />
          <Row gap={10}>
            <StatTile value={String(stats.min)} label={t('meditate.totalMin')} bg={th.pastel.mint} />
            <StatTile value={String(stats.n)} label={t('meditate.totalSessions')} bg={th.pastel.purple} />
          </Row>
          <Card style={{ marginTop: 12 }}>
            {recent.length === 0 ? (
              <Txt dim>{t('meditate.empty')}</Txt>
            ) : (
              recent.map((s, i) => {
                const p = BREATH_PATTERNS.find((x) => x.id === s.patternId);
                return (
                  <Row key={s.id} between style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: th.border }}>
                    <Txt>
                      {p?.emoji ?? '🫧'}{' '}
                      {t('meditate.sessionLine', { pattern: p ? p.name : '', min: Math.max(1, Math.round(s.seconds / 60)) })}
                    </Txt>
                    <Txt variant="small" dim>
                      {fmtDay(s.dayKey, lang, 'short')}
                    </Txt>
                  </Row>
                );
              })
            )}
          </Card>
        </>
      ) : (
        <>
          <View style={{ marginTop: 16 }}>{Circle}</View>
          {phase === 'done' ? (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Txt variant="h1" center>
                {t('meditate.doneTitle')}
              </Txt>
              <Txt dim center style={{ marginTop: 6 }}>
                {t('meditate.doneBody', { n: Math.round(doneSec / 60) })}
              </Txt>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 16, gap: 4 }}>
              <Txt variant="h3">{L(pattern.name, lang)}</Txt>
              <Txt dim>
                {t('meditate.round', { n: round })} · {t('meditate.left', { time: fmtClock(leftSec) })}
              </Txt>
            </View>
          )}
          <View style={{ gap: 10, marginTop: 28 }}>
            {phase === 'running' ? <PillButton label={t('meditate.pause')} icon="pause" onPress={pause} /> : null}
            {phase === 'paused' ? <PillButton label={t('meditate.resume')} icon="play" onPress={resume} /> : null}
            {phase === 'done' ? <PillButton label={t('meditate.again')} icon="refresh" onPress={again} /> : null}
            {phase !== 'done' ? <PillButton label={t('meditate.stop')} kind="outline" onPress={stop} /> : null}
          </View>
        </>
      )}
      <MedNote />
      <Confetti fire={burst} />
    </Screen>
  );
}
