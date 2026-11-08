import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Btn, Card, Row, Screen, SectionTitle, Txt } from '../../src/components/ui';
import { CATEGORIES } from '../../src/data/templates';
import { CONFIG } from '../../src/engine/config';
import { TR_DAYS_SHORT } from '../../src/engine/dates';
import type { Habit } from '../../src/engine/types';
import { useStore } from '../../src/store/store';
import { useTheme } from '../../src/theme';

function scheduleText(h: Habit) {
  if (h.schedule.weeklyQuota) return `Haftada ${h.schedule.weeklyQuota}`;
  const d = h.schedule.days;
  if (!d || d.length === 0 || d.length === 7) return 'Her gün';
  return d.map((x) => TR_DAYS_SHORT[x]).join(' ');
}

export default function Habits() {
  const t = useTheme();
  const habitsMap = useStore((s) => s.habits);
  const me = useStore((s) => s.me)!;
  const list = useMemo(() => Object.values(habitsMap).filter((h) => h.ownerId === me.id && !h.archived), [habitsMap, me.id]);
  const baseTotal = list.filter((h) => !h.schedule.weeklyQuota).reduce((s, h) => s + CONFIG.basePoints[h.difficulty], 0);

  const cats = [...CATEGORIES.map((c) => c.id as string), ...Array.from(new Set(list.map((h) => h.category))).filter((c) => !CATEGORIES.some((x) => x.id === c))];

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt size={26} weight="800">Rutinlerim</Txt>
        <Btn small label="＋ Yeni" onPress={() => router.push({ pathname: '/habit/[id]', params: { id: 'new' } })} />
      </Row>
      <Txt dim size={13} style={{ marginTop: 4 }}>
        {list.length} görev · günlük planlı taban puan {baseTotal} SP (tavan {CONFIG.plannedBaseCapPerDay})
      </Txt>

      <Row style={{ gap: 8, marginTop: 12 }}>
        <Btn style={{ flex: 1 }} kind="soft" label="📦 Şablonlar" onPress={() => router.push('/templates')} />
        <Btn style={{ flex: 1 }} kind="soft" label="📚 Kütüphane" onPress={() => router.push('/library')} />
      </Row>

      {list.length === 0 && (
        <Card style={{ marginTop: 16, alignItems: 'center' }}>
          <Txt size={40}>🌱</Txt>
          <Txt dim center style={{ marginTop: 6 }}>Henüz görev yok. Şablonlardan başla.</Txt>
        </Card>
      )}

      {cats.map((c) => {
        const items = list.filter((h) => h.category === c);
        if (!items.length) return null;
        return (
          <View key={c}>
            <SectionTitle>{c}</SectionTitle>
            {items.map((h) => (
              <Pressable key={h.id} onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}>
                <Row style={{ backgroundColor: t.card, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: t.border }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: h.color + '26', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{h.icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Txt weight="700" numberOfLines={1}>{h.title}{h.isPrivate ? ' 🔒' : ''}{h.together ? ' 💞' : ''}</Txt>
                    <Txt size={12} dim>{scheduleText(h)} · {CONFIG.basePoints[h.difficulty]} SP{h.reminderTime ? ` · ⏰ ${h.reminderTime}` : ''}</Txt>
                  </View>
                  <Txt dim>›</Txt>
                </Row>
              </Pressable>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
