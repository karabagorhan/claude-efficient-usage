/**
 * Rutin panosundaki yaşam takibi özet şeridi: yaklaşan teslim (okul), sigara bugün x/limit, gecikmiş ev işi.
 * Her parça yalnız ilgili takipçi kurulu / verisi varsa görünür; hiçbiri yoksa şerit hiç çizilmez.
 * zustand v5: seçiciler yalnız mevcut referans/ilkel döndürür, türetme useMemo'da.
 */
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { tap } from '../../components/ui';
import { daysBetween, choreCounts, reductionLimit } from '../life/calc';
import { useStudySummary } from '../study/summary';
import { useT } from '../../i18n';
import { routes } from '../../lib/routes';
import { useChores } from '../../store/slices/chores';
import { useSmoke } from '../../store/slices/smoke';
import { radius, useTheme, type PastelKey } from '../../theme';

interface Item {
  key: string;
  emoji: string;
  label: string;
  pastel: PastelKey;
  alert?: boolean;
  href: string;
}

export function LifeStrip({ day }: { day: string }) {
  const th = useTheme();
  const t = useT();
  const study = useStudySummary();
  const plan = useSmoke((s) => s.plan);
  const smokeLogs = useSmoke((s) => s.logs);
  const chores = useChores((s) => s.chores);
  const history = useChores((s) => s.history);

  const smokeCount = useMemo(() => Object.values(smokeLogs).filter((l) => l.dayKey === day).length, [smokeLogs, day]);
  const overdueChores = useMemo(() => {
    if (!Object.keys(history).length) return 0; // ev işi takibini hiç kullanmadıysa gösterme
    return choreCounts(Object.values(chores), day).overdue;
  }, [chores, history, day]);

  const items: Item[] = [];
  const next = study.next[0];
  if (study.overdue > 0) {
    items.push({ key: 'study', emoji: '🎓', label: t('routine.life.overdue', { n: study.overdue }), pastel: 'pink', alert: true, href: routes.study() });
  } else if (next) {
    const n = daysBetween(day, next.due);
    const label =
      n <= 0 ? t('routine.life.dueToday', { title: next.title }) : n === 1 ? t('routine.life.dueTomorrow', { title: next.title }) : t('routine.life.dueIn', { n, title: next.title });
    if (n <= 7) items.push({ key: 'study', emoji: next.emoji ?? '🎓', label, pastel: 'purple', href: routes.study() });
  }
  if (plan) {
    const limit = reductionLimit(plan, day);
    items.push({ key: 'smoke', emoji: '🚭', label: t('routine.life.smoke', { n: smokeCount, limit }), pastel: 'mint', alert: smokeCount > limit, href: routes.life('smoke') });
  }
  if (overdueChores > 0) {
    items.push({ key: 'chores', emoji: '🧺', label: t('routine.life.chores', { n: overdueChores }), pastel: 'peach', href: routes.life('chores') });
  }
  if (!items.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t('routine.life.label')}
      style={{ marginHorizontal: -16, marginBottom: 4 }}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}
    >
      {items.map((it) => (
        <Pressable
          key={it.key}
          accessibilityRole="button"
          onPress={() => {
            tap();
            router.push(it.href);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            maxWidth: 260,
            paddingHorizontal: 12,
            height: 38,
            borderRadius: radius.pill,
            backgroundColor: th.pastel[it.pastel],
            borderWidth: it.alert ? 1.5 : 0,
            borderColor: th.danger,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16 }}>{it.emoji}</Text>
          <View style={{ flexShrink: 1 }}>
            <Text numberOfLines={1} style={{ color: th.onPastel, fontWeight: '700', fontSize: 14 }}>
              {it.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
