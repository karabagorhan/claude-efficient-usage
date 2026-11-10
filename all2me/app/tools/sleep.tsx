import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card, Chip, Header, PillButton, Row, Screen, Txt, success } from '../../src/components/ui';
import { addDays, dayKeyOf, weekdayOf } from '../../src/engine/dates';
import { BarChart } from '../../src/features/tools/BarChart';
import { TimeStepper } from '../../src/features/tools/TimeStepper';
import { DAYS_SHORT, useLang, useT } from '../../src/i18n';
import { scheduleGroup } from '../../src/lib/notifications';
import { routes } from '../../src/lib/routes';
import { useCore } from '../../src/store/core';
import { sleepMinutes, useSleep } from '../../src/store/slices/sleep';
import { radius, useTheme } from '../../src/theme';

const QUALITY_EMOJI = ['😫', '🙁', '😐', '🙂', '🤩'];

export default function SleepScreen() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const day = dayKeyOf();
  const entries = useSleep((s) => s.entries);
  const goalHours = useSleep((s) => s.goalHours);
  const bedReminder = useSleep((s) => s.bedReminder);
  const last = entries[day];
  const [bed, setBed] = useState(last?.bed ?? '23:30');
  const [wake, setWake] = useState(last?.wake ?? '07:00');
  const [quality, setQuality] = useState(last?.quality ?? 0);
  const [remTime, setRemTime] = useState(bedReminder ?? '22:45');
  const mins = sleepMinutes(bed, wake);

  useEffect(() => {
    if (last) {
      setBed(last.bed);
      setWake(last.wake);
      setQuality(last.quality);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!last]);

  const week = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const k = addDays(day, -i);
      out.push({ k, m: entries[k]?.minutes ?? 0 });
    }
    return out;
  }, [entries, day]);
  const logged = week.filter((w) => w.m > 0);
  const avg = logged.length ? Math.round(logged.reduce((a, w) => a + w.m, 0) / logged.length) : 0;

  const save = () => {
    const s = useSleep.getState();
    const first = !s.entries[day];
    s.save({ dayKey: day, bed, wake, quality });
    const core = useCore.getState();
    if (first) core.logActivity('sleep', day);
    core.pushToast('sleep.saved');
    success();
  };

  const applyReminder = async (time: string | null) => {
    useSleep.getState().setBedReminder(time);
    if (!time) {
      await scheduleGroup('sleep', []);
      return;
    }
    const [h, m] = time.split(':').map(Number);
    await scheduleGroup('sleep', [
      { title: t('sleep.reminder.notifTitle'), body: t('sleep.reminder.notifBody'), url: routes.tool('sleep'), trigger: { kind: 'daily', hour: h, minute: m } },
    ]);
  };
  useEffect(() => {
    if (bedReminder) void applyReminder(bedReminder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const hm = (m: number) => ({ h: Math.floor(m / 60), m: Math.round(m % 60) });
  const dur = hm(mins);
  const a = hm(avg);

  const stepBtn = (d: number) => (
    <Pressable
      key={d}
      onPress={() => useSleep.getState().setGoal(goalHours + d)}
      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: th.cardAlt, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={d < 0 ? 'remove' : 'add'} size={22} color={th.text} />
    </Pressable>
  );

  return (
    <Screen header={<Header title={t('sleep.title')} />}>
      <Card>
        <Txt variant="h3" center>
          {t('sleep.lastNight')}
        </Txt>
        <Row between style={{ marginTop: 12, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="small" dim style={{ marginBottom: 4 }}>
              🌙 {t('sleep.bedtime')}
            </Txt>
            <TimeStepper value={bed} onChange={setBed} />
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="small" dim style={{ marginBottom: 4 }}>
              ☀️ {t('sleep.waketime')}
            </Txt>
            <TimeStepper value={wake} onChange={setWake} />
          </View>
        </Row>
        <View style={{ backgroundColor: th.pastel.purple, borderRadius: radius.md, padding: 14, marginTop: 14, alignItems: 'center' }}>
          <Txt variant="caption" color={th.onPastel}>
            {t('sleep.total')}
          </Txt>
          <Txt variant="h1" color={th.onPastel}>
            {t('sleep.duration', dur)}
          </Txt>
          <Txt variant="small" color={th.onPastel}>
            {t('sleep.vsGoal', { n: goalHours })}
          </Txt>
        </View>
        <Txt variant="bodyBold" style={{ marginTop: 14, marginBottom: 8 }}>
          {t('sleep.quality')}
        </Txt>
        <Row between>
          {[1, 2, 3, 4, 5].map((q) => (
            <Pressable
              key={q}
              onPress={() => setQuality(quality === q ? 0 : q)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: quality === q ? th.pastel.yellow : th.cardAlt,
                borderWidth: quality === q ? 2 : 0,
                borderColor: th.text,
              }}
            >
              <Txt style={{ fontSize: 26 }}>{QUALITY_EMOJI[q - 1]}</Txt>
            </Pressable>
          ))}
        </Row>
        {quality ? (
          <Txt variant="small" dim center style={{ marginTop: 6 }}>
            {t(`sleep.qualityLabel.${quality}`)}
          </Txt>
        ) : null}
        <View style={{ marginTop: 14 }}>
          <PillButton label={t('common.btn.save')} onPress={save} />
        </View>
      </Card>

      <Txt variant="h3" style={{ marginTop: 22, marginBottom: 8 }}>
        {t('sleep.goal')}
      </Txt>
      <Card>
        <Row between>
          <Txt variant="h2">{t('sleep.goalHours', { n: goalHours })}</Txt>
          <Row gap={10}>{[-1, 1].map(stepBtn)}</Row>
        </Row>
      </Card>

      <Txt variant="h3" style={{ marginTop: 22, marginBottom: 8 }}>
        {t('sleep.chart')}
      </Txt>
      <Card>
        <BarChart
          color={th.purple}
          goal={goalHours * 60}
          data={week.map((w, i) => ({
            label: DAYS_SHORT[lang][weekdayOf(w.k)],
            value: w.m,
            valueLabel: w.m ? (w.m / 60).toFixed(1) : undefined,
            highlight: i === 6,
          }))}
        />
        <Txt variant="small" dim center style={{ marginTop: 10 }}>
          {avg ? t('sleep.avg', a) : t('sleep.noData')}
        </Txt>
      </Card>

      <Txt variant="h3" style={{ marginTop: 22, marginBottom: 8 }}>
        {t('sleep.reminder.title')}
      </Txt>
      <Card>
        <Row gap={8} style={{ marginBottom: 12 }}>
          <Chip label={t('sleep.reminder.off')} active={!bedReminder} onPress={() => void applyReminder(null)} />
          <Chip label={t('sleep.reminder.on')} active={!!bedReminder} onPress={() => void applyReminder(remTime)} />
        </Row>
        <TimeStepper
          value={remTime}
          onChange={(v) => {
            setRemTime(v);
            if (bedReminder) void applyReminder(v);
          }}
        />
      </Card>

      <Txt variant="h3" style={{ marginTop: 22, marginBottom: 8 }}>
        {t('sleep.tips.title')}
      </Txt>
      <Card>
        {['t1', 't2', 't3', 't4'].map((k, i) => (
          <Row key={k} gap={10} style={{ paddingVertical: 6, alignItems: 'flex-start' }}>
            <Txt>{['🌙', '📵', '☕', '🛏️'][i]}</Txt>
            <Txt style={{ flex: 1 }}>{t(`sleep.tips.${k}`)}</Txt>
          </Row>
        ))}
      </Card>
      <Txt variant="caption" faint style={{ marginTop: 14 }}>
        {t('common.medicalNote')}
      </Txt>
    </Screen>
  );
}
