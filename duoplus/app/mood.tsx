import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Btn, Card, Chip, Field, Screen, SectionTitle, Txt, success } from '../src/components/ui';
import { addDays, prettyDay } from '../src/engine/dates';
import { today as todayKey, useStore } from '../src/store/store';
import { MOOD_TAGS, MOODS, useTheme } from '../src/theme';

export default function Mood() {
  const t = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day ?? todayKey();
  const moods = useStore((s) => s.moods);
  const save = useStore((s) => s.saveMood);
  const cur = moods[day];

  const [mood, setMood] = useState<number>(cur?.mood ?? 0);
  const [tags, setTags] = useState<string[]>(cur?.tags ?? []);
  const [note, setNote] = useState(cur?.note ?? '');

  const recent = Array.from({ length: 14 }, (_, i) => addDays(todayKey(), -i)).filter((d) => moods[d]);

  return (
    <Screen>
      <Txt dim center>{prettyDay(day)}</Txt>
      <Txt size={22} weight="800" center style={{ marginTop: 4 }}>Bugün nasıl hissediyorsun?</Txt>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
        {MOODS.map((m) => (
          <Pressable key={m.v} onPress={() => setMood(m.v)} style={{ alignItems: 'center', padding: 8, borderRadius: 16, backgroundColor: mood === m.v ? m.color + '33' : 'transparent', borderWidth: mood === m.v ? 2 : 0, borderColor: m.color }}>
            <Text style={{ fontSize: 34 }}>{m.emoji}</Text>
            <Txt size={11} dim>{m.label}</Txt>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Etiketler</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {MOOD_TAGS.map((x) => <Chip key={x} label={x} active={tags.includes(x)} onPress={() => setTags((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]))} />)}
      </View>

      <SectionTitle>Günlük notu</SectionTitle>
      <Field value={note} onChangeText={setNote} placeholder="Bugün aklında ne var? (isteğe bağlı)" multiline style={{ minHeight: 110, textAlignVertical: 'top' }} />
      <Txt size={12} dim>Ruh hali ve notların yalnızca bu cihazda saklanır, partnerinle paylaşılmaz.</Txt>

      <Btn label="Kaydet" disabled={mood === 0} style={{ marginTop: 16 }} onPress={() => { save({ dayKey: day, mood, tags, note }); success(); router.back(); }} />

      {recent.length > 0 && (
        <>
          <SectionTitle>Son kayıtlar</SectionTitle>
          {recent.map((d) => {
            const m = moods[d];
            const def = MOODS.find((x) => x.v === m.mood)!;
            return (
              <Card key={d} style={{ marginBottom: 8 }} onPress={() => router.setParams({ day: d })}>
                <Txt weight="700">{def.emoji} {prettyDay(d)}</Txt>
                {m.tags.length ? <Txt size={12} dim>{m.tags.join(' · ')}</Txt> : null}
                {m.note ? <Txt size={13} style={{ marginTop: 4 }} numberOfLines={2}>{m.note}</Txt> : null}
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}
