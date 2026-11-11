/**
 * Alarm çalma ekranı (tam ekran). Alarm bildirimine dokunulunca ya da uygulama açıkken alarm gelince açılır.
 * Kapat / Ertele (5, 10 dk) + isteğe bağlı mini görev (3 nefes ya da günün ilk görevi).
 * Parametreler: alarmId?, hour, minute, label? (routes.alarmRing).
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Card, PillButton, Row, Screen, Txt, success, tap } from '../src/components/ui';
import { Mascot } from '../src/components/Mascot';
import { cancelSnoozes, dismissPresentedAlarms, setRingOpen, snoozeAlarm, SNOOZE_OPTIONS } from '../src/features/toolsb/alarmSchedule';
import { fmtTime, useLang, useT } from '../src/i18n';
import { habitsOnDay, isDone, today, useCore } from '../src/store/core';
import { useAlarm } from '../src/store/slices/alarm';
import { useTheme } from '../src/theme';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const pad = (n: number) => String(n).padStart(2, '0');
const BREATHS = 3;

export default function AlarmRing() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const params = useLocalSearchParams<Record<string, string>>();
  const alarmId = one(params.alarmId) ?? '';
  const hour = Number(one(params.hour));
  const minute = Number(one(params.minute));
  const label = one(params.label) ?? '';
  const hasTime = Number.isFinite(hour) && Number.isFinite(minute) && one(params.hour) !== undefined;
  const clock = useMemo(() => {
    if (hasTime) return fmtTime(`${pad(hour)}:${pad(minute)}`, lang);
    const d = new Date();
    return fmtTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`, lang);
  }, [hasTime, hour, minute, lang]);

  const [breaths, setBreaths] = useState(0);
  const [snoozedMin, setSnoozedMin] = useState<number | null>(null);
  const day = today();
  // ilkel seçici: günün ilk bitmemiş görevinin id'si
  const firstId = useCore((s) => habitsOnDay(s, day).find((h) => !isDone(s, h.id, day))?.id ?? '');
  const firstTitle = useCore((s) => (firstId ? `${s.habits[firstId]?.icon ?? ''} ${s.habits[firstId]?.title ?? ''}`.trim() : ''));
  const [taskDone, setTaskDone] = useState(false);

  useEffect(() => {
    setRingOpen(true);
    return () => setRingOpen(false);
  }, []);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const dismiss = async () => {
    tap();
    if (alarmId) {
      const a = useAlarm.getState().alarms.find((x) => x.id === alarmId);
      if (a && a.days.length === 0) useAlarm.getState().toggle(alarmId, false); // tek seferlik: kapanır
      await cancelSnoozes(alarmId);
    }
    await dismissPresentedAlarms();
    leave();
  };

  const snooze = async (min: number) => {
    tap();
    await snoozeAlarm({ id: alarmId, hour: hasTime ? hour : new Date().getHours(), minute: hasTime ? minute : new Date().getMinutes(), label }, min);
    await dismissPresentedAlarms();
    useCore.getState().pushToast({ key: 'alarm.ring.snoozedToast', params: { n: min }, emoji: '😴' });
    setSnoozedMin(min);
    setTimeout(leave, 700);
  };

  const doBreath = () => {
    tap();
    setBreaths((b) => Math.min(BREATHS, b + 1));
  };

  const doFirst = () => {
    if (!firstId) return;
    const c = useCore.getState().complete(firstId);
    if (c) {
      success();
      setTaskDone(true);
      useCore.getState().pushToast('toast.completedTitle', { title: firstTitle, points: c.points });
    }
  };

  return (
    <Screen scroll contentStyle={{ paddingTop: 24 }} padBottom={40}>
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Mascot mood="cheer" size={110} />
        <Txt variant="caption" dim style={{ marginTop: 10, letterSpacing: 1 }}>
          {tr('alarm.ring.title')}
        </Txt>
        <Txt size={64} weight="800" style={{ fontVariant: ['tabular-nums'], marginTop: 4 }}>
          {clock}
        </Txt>
        <Txt variant="h2" center style={{ marginTop: 4 }}>
          {label || tr('alarm.ring.noLabel')}
        </Txt>
      </View>

      <Card padding={16} style={{ marginTop: 26 }}>
        <Txt variant="bodyBold">{tr('alarm.ring.mini')}</Txt>
        <Txt variant="small" dim style={{ marginTop: 2, marginBottom: 12 }}>
          {tr('alarm.ring.miniHint')}
        </Txt>
        <PillButton
          kind="outline"
          icon={breaths >= BREATHS ? 'checkmark' : 'leaf-outline'}
          label={breaths >= BREATHS ? tr('alarm.ring.breathDone') : tr('alarm.ring.breath', { done: breaths, n: BREATHS })}
          onPress={doBreath}
          disabled={breaths >= BREATHS}
        />
        {firstId ? (
          <View style={{ marginTop: 10 }}>
            <PillButton
              kind="outline"
              icon={taskDone ? 'checkmark' : 'flag-outline'}
              label={taskDone ? tr('alarm.ring.taskDone') : tr('alarm.ring.firstTask', { title: firstTitle })}
              onPress={doFirst}
              disabled={taskDone}
            />
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: 24, gap: 10 }}>
        <PillButton label={tr('alarm.ring.dismiss')} icon="alarm-outline" onPress={() => void dismiss()} />
        <Row gap={10}>
          {SNOOZE_OPTIONS.map((m) => (
            <View key={m} style={{ flex: 1 }}>
              <PillButton kind="outline" label={tr('alarm.ring.snooze', { n: m })} onPress={() => void snooze(m)} disabled={snoozedMin !== null} />
            </View>
          ))}
        </Row>
      </View>
    </Screen>
  );
}
