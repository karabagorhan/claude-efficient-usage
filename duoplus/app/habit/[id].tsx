import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Btn, Chip, Field, Row, Screen, SectionTitle, Txt } from '../../src/components/ui';
import { CATEGORIES, HABIT_COLORS, HABIT_EMOJIS } from '../../src/data/templates';
import { CONFIG } from '../../src/engine/config';
import { TR_DAYS_SHORT } from '../../src/engine/dates';
import type { Difficulty, HabitKind, Weekday } from '../../src/engine/types';
import { uuid } from '../../src/lib/id';
import { useStore } from '../../src/store/store';
import { useTheme } from '../../src/theme';

const DIFFS: Array<{ id: Difficulty; label: string }> = [
  { id: 'mini', label: 'Mini' },
  { id: 'easy', label: 'Kolay' },
  { id: 'medium', label: 'Orta' },
  { id: 'hard', label: 'Zor' },
  { id: 'epic', label: 'Efsane' },
];
const KINDS: Array<{ id: HabitKind; label: string }> = [
  { id: 'check', label: 'Evet/Hayır' },
  { id: 'counter', label: 'Sayaç' },
  { id: 'timer', label: 'Zamanlı' },
];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function HabitForm() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const existing = id && id !== 'new' ? store.habits[id] : undefined;
  const me = store.me!;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? '🎯');
  const [color, setColor] = useState(existing?.color ?? me.color);
  const [category, setCategory] = useState(existing?.category ?? 'Sabah');
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty ?? 'easy');
  const [kind, setKind] = useState<HabitKind>(existing?.kind ?? 'check');
  const [target, setTarget] = useState(String(existing?.target ?? ''));
  const [step, setStep] = useState(String(existing?.step ?? '1'));
  const [mode, setMode] = useState<'daily' | 'days' | 'quota'>(
    existing?.schedule.weeklyQuota ? 'quota' : existing?.schedule.days?.length ? 'days' : 'daily',
  );
  const [days, setDays] = useState<Weekday[]>(existing?.schedule.days ?? []);
  const [quota, setQuota] = useState(existing?.schedule.weeklyQuota ?? 3);
  const [reminder, setReminder] = useState(existing?.reminderTime ?? '');
  const [due, setDue] = useState(existing?.dueTime ?? '');
  const [isPrivate, setPrivate] = useState(existing?.isPrivate ?? false);
  const [together, setTogether] = useState(existing?.together ?? false);

  const valid =
    title.trim().length > 0 &&
    (!reminder || HHMM.test(reminder)) &&
    (!due || HHMM.test(due)) &&
    (kind === 'check' || Number(target) > 0) &&
    (mode !== 'days' || days.length > 0);

  const save = () => {
    store.saveHabit({
      id: existing?.id ?? uuid(),
      title: title.trim(),
      icon,
      color,
      category,
      difficulty,
      kind,
      target: kind === 'check' ? undefined : Number(target),
      step: kind === 'counter' ? Math.max(1, Number(step) || 1) : undefined,
      schedule: mode === 'quota' ? { days: [], weeklyQuota: quota } : mode === 'days' ? { days: [...days].sort() as Weekday[] } : { days: [] },
      reminderTime: reminder || undefined,
      dueTime: due || undefined,
      isPrivate,
      together,
    });
    router.back();
  };

  const remove = () =>
    Alert.alert('Görev silinsin mi?', 'Geçmiş puanların korunur, görev listeden kalkar.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          if (existing) store.archiveHabit(existing.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Görevi düzenle' : 'Yeni görev' }} />
      <Field label="Görev adı" value={title} onChangeText={setTitle} placeholder="Örn. 20 dk yürüyüş" maxLength={50} />

      <Txt size={13} dim weight="600" style={{ marginBottom: 6 }}>İkon</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {HABIT_EMOJIS.map((e) => (
          <Pressable key={e} onPress={() => setIcon(e)} style={{ width: 44, height: 44, margin: 3, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: icon === e ? color + '40' : t.cardAlt, borderWidth: icon === e ? 2 : 0, borderColor: color }}>
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Txt size={13} dim weight="600" style={{ marginBottom: 6 }}>Renk</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {HABIT_COLORS.map((c) => (
          <Pressable key={c} onPress={() => setColor(c)} style={{ width: 34, height: 34, margin: 4, borderRadius: 17, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: t.text }} />
        ))}
      </View>

      <SectionTitle>Kategori</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CATEGORIES.map((c) => <Chip key={c.id} label={c.id} emoji={c.icon} active={category === c.id} color={c.color} onPress={() => setCategory(c.id)} />)}
      </View>

      <SectionTitle>Zorluk (puan)</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {DIFFS.map((d) => <Chip key={d.id} label={`${d.label} · ${CONFIG.basePoints[d.id]} SP`} active={difficulty === d.id} onPress={() => setDifficulty(d.id)} />)}
      </View>

      <SectionTitle>Tür</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {KINDS.map((k) => <Chip key={k.id} label={k.label} active={kind === k.id} onPress={() => setKind(k.id)} />)}
      </View>
      {kind !== 'check' && (
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label={kind === 'timer' ? 'Süre (dk)' : 'Hedef sayı'} value={target} onChangeText={(v) => setTarget(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
          </View>
          {kind === 'counter' && (
            <View style={{ flex: 1 }}>
              <Field label="Dokunuş başı artış" value={step} onChangeText={(v) => setStep(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
            </View>
          )}
        </Row>
      )}

      <SectionTitle>Tekrar</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label="Her gün" active={mode === 'daily'} onPress={() => setMode('daily')} />
        <Chip label="Belirli günler" active={mode === 'days'} onPress={() => setMode('days')} />
        <Chip label="Haftada N kez" active={mode === 'quota'} onPress={() => setMode('quota')} />
      </View>
      {mode === 'days' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {TR_DAYS_SHORT.map((d, i) => (
            <Chip key={d} label={d} active={days.includes(i as Weekday)} onPress={() => setDays((p) => (p.includes(i as Weekday) ? p.filter((x) => x !== i) : [...p, i as Weekday]))} />
          ))}
        </View>
      )}
      {mode === 'quota' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6].map((n) => <Chip key={n} label={`Haftada ${n}`} active={quota === n} onPress={() => setQuota(n)} />)}
        </View>
      )}

      <SectionTitle>Saat</SectionTitle>
      <Field label="Hatırlatıcı (SS:DD)" value={reminder} onChangeText={setReminder} placeholder="08:30" keyboardType="numbers-and-punctuation" maxLength={5} />
      <Field label="Erken bonus için hedef saat (SS:DD)" value={due} onChangeText={setDue} placeholder="09:00 (isteğe bağlı)" keyboardType="numbers-and-punctuation" maxLength={5} />
      {(reminder && !HHMM.test(reminder)) || (due && !HHMM.test(due)) ? <Txt color={t.danger} size={12}>Saat biçimi SS:DD olmalı (ör. 07:30).</Txt> : null}

      <SectionTitle>Paylaşım</SectionTitle>
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="600">🔒 Özel görev</Txt>
          <Txt size={12} dim>Partnerin adını görmez</Txt>
        </View>
        <Switch value={isPrivate} onValueChange={setPrivate} />
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt weight="600">💞 Birlikte yapılır</Txt>
          <Txt size={12} dim>Ortak görev olarak işaretlenir</Txt>
        </View>
        <Switch value={together} onValueChange={setTogether} />
      </Row>

      <Btn label={existing ? 'Kaydet' : 'Görevi ekle'} disabled={!valid} onPress={save} style={{ marginTop: 24 }} />
      {existing ? <Btn kind="danger" label="Görevi sil" onPress={remove} style={{ marginTop: 10 }} /> : null}
    </Screen>
  );
}
