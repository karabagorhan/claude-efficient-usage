import { router, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import { Btn, Chip, Row, Screen, Txt, success } from '../src/components/ui';
import { today as todayKey, useStore } from '../src/store/store';
import { useTheme } from '../src/theme';

const PRESETS = [5, 10, 15, 25, 45, 60, 90];
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Focus() {
  const t = useTheme();
  const { habitId, day } = useLocalSearchParams<{ habitId?: string; day?: string }>();
  const habit = useStore((s) => (habitId ? s.habits[habitId] : undefined));
  const complete = useStore((s) => s.complete);
  const bump = useStore((s) => s.bumpCounter);
  const canBackfill = useStore((s) => s.canBackfill);

  const [minutes, setMinutes] = useState(habit?.kind === 'timer' && habit.target ? habit.target : 25);
  const [remaining, setRemaining] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const endRef = useRef<number | null>(null);
  const notifId = useRef<string | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (!running) setRemaining(minutes * 60);
  }, [minutes, running]);

  const cancelNotif = useCallback(async () => {
    if (notifId.current) {
      try { await Notifications.cancelScheduledNotificationAsync(notifId.current); } catch {}
      notifId.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setRunning(false);
    success();
    bump('focus');
    if (habit) {
      const d = day ?? todayKey();
      complete(habit.id, d, { backfill: d !== todayKey() && canBackfill() });
    }
    Alert.alert('Seans tamamlandı 🎉', habit ? `${habit.title} işaretlendi.` : 'Harika odaklandın!', [{ text: 'Tamam', onPress: () => router.back() }]);
  }, [habit, day, complete, bump, canBackfill]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (!endRef.current) return;
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) finish();
    };
    tick();
    const id = setInterval(tick, 500);
    const sub = AppState.addEventListener('change', (a) => a === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [running, finish]);

  useEffect(() => () => { void cancelNotif(); }, [cancelNotif]);

  const start = async () => {
    finished.current = false;
    endRef.current = Date.now() + remaining * 1000;
    setRunning(true);
    try {
      notifId.current = await Notifications.scheduleNotificationAsync({
        content: { title: '🍅 Odak seansı bitti', body: habit ? habit.title : 'Mola zamanı!' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, remaining) },
      });
    } catch {}
  };
  const pause = async () => {
    setRunning(false);
    endRef.current = null;
    await cancelNotif();
  };
  const reset = async () => {
    await pause();
    setRemaining(minutes * 60);
  };

  const total = minutes * 60;
  const pct = total ? 1 - remaining / total : 0;

  return (
    <Screen>
      {habit ? <Txt center weight="700" size={16} style={{ marginTop: 8 }}>{habit.icon} {habit.title}</Txt> : <Txt center dim style={{ marginTop: 8 }}>Serbest odak seansı</Txt>}
      <View style={{ alignItems: 'center', marginVertical: 30 }}>
        <View style={{ width: 240, height: 240, borderRadius: 120, borderWidth: 10, borderColor: t.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 10, borderColor: t.primary, opacity: 0.15 + pct * 0.85 }} />
          <Txt size={56} weight="800" style={{ fontVariant: ['tabular-nums'] }}>{fmt(remaining)}</Txt>
          <Txt dim size={13}>{running ? 'Odakta kal' : 'Hazır'}</Txt>
        </View>
      </View>

      {!running && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          {PRESETS.map((m) => <Chip key={m} label={`${m} dk`} active={minutes === m} onPress={() => setMinutes(m)} />)}
        </View>
      )}

      <Row style={{ gap: 10, marginTop: 20 }}>
        {running ? (
          <Btn style={{ flex: 1 }} kind="soft" label="Duraklat" onPress={pause} />
        ) : (
          <Btn style={{ flex: 1 }} label={remaining < total ? 'Devam' : 'Başlat'} onPress={start} />
        )}
        <Btn style={{ flex: 1 }} kind="ghost" label="Sıfırla" onPress={reset} />
      </Row>
      {habit && (
        <Btn kind="ghost" label="Süreyi beklemeden tamamlandı say" style={{ marginTop: 10 }} onPress={() => { finished.current = false; finish(); }} />
      )}
      <Txt size={12} dim center style={{ marginTop: 14 }}>Süre bitince bildirim gelir. Uygulama arka plandayken de süre işler.</Txt>
    </Screen>
  );
}
