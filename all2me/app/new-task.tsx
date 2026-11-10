/**
 * Yeni Görev sayfası (SPEC §3.3) — modal. Planlayıcı, şanslı görev, bağlı araç görevleri ve önerilen görevler.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Header, PastelCard, Row, Screen, Txt, tap, Chip } from '../src/components/ui';
import { SUGGESTIONS, SUGGEST_CATS, type SuggestCat } from '../src/data/suggestions';
import type { HabitLink, PastelKey } from '../src/engine/types';
import { L, useLang, useT } from '../src/i18n';
import { routes } from '../src/lib/routes';
import { useCore } from '../src/store/core';
import { GRADIENTS, radius, useTheme, pastelFor } from '../src/theme';

const WATER_GLASSES = 8;

function FeatureCard({ colors, emoji, overline, title, onPress }: { colors: readonly [string, string, ...string[]]; emoji: string; overline: string; title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({ marginBottom: 12, borderRadius: radius.lg, overflow: 'hidden', transform: [{ scale: pressed ? 0.985 : 1 }] })}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }}>
        <Row gap={14} style={{ minHeight: 76, paddingHorizontal: 18, paddingVertical: 14 }}>
          <Text style={{ fontSize: 36, width: 44, textAlign: 'center' }}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Txt variant="small" color="#FFFFFF" numberOfLines={2} style={{ opacity: 0.9 }}>
              {overline}
            </Txt>
            <Txt variant="h3" color="#FFFFFF" numberOfLines={2}>
              {title}
            </Txt>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
        </Row>
      </LinearGradient>
    </Pressable>
  );
}

export default function NewTask() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const habits = useCore((s) => s.habits);
  const meId = useCore((s) => s.me?.id);
  const [cat, setCat] = useState<'all' | SuggestCat>('all');

  const mine = useMemo(() => Object.values(habits).filter((h) => h.ownerId === meId && !h.archived), [habits, meId]);
  const titles = useMemo(() => new Set(mine.map((h) => h.title.trim().toLowerCase())), [mine]);
  const links = useMemo(() => new Set(mine.map((h) => h.link).filter(Boolean)), [mine]);

  const linked: { link: HabitLink; icon: string; pastel: PastelKey; kind: 'check' | 'counter'; target?: number }[] = [
    { link: 'drink', icon: '💧', pastel: 'blue', kind: 'counter', target: WATER_GLASSES },
    { link: 'mood', icon: '😊', pastel: 'green', kind: 'check' },
    { link: 'reflection', icon: '✏️', pastel: 'purple', kind: 'check' },
  ];

  const hasHealth = cat === 'all' || cat === 'health' || cat === 'living';
  const shown = SUGGESTIONS.map((s, i) => ({ s, i })).filter(({ s }) => cat === 'all' || s.cat === cat);

  const added = (check: boolean) =>
    check ? (
      <Row gap={4}>
        <Ionicons name="checkmark-circle" size={22} color={t.onPastel} />
        <Txt variant="small" color={t.onPastel} weight="700">
          {tr('newtask.added')}
        </Txt>
      </Row>
    ) : (
      'chevron'
    );

  return (
    <Screen header={<Header left="close" />} padBottom={40}>
      <Pressable onPress={() => router.push(routes.createTask())} style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Txt variant="display" center faint>
          {tr('newtask.title')}
        </Txt>
        <Txt dim faint center>
          {tr('newtask.rename')}
        </Txt>
      </Pressable>

      <FeatureCard colors={GRADIENTS.ai} emoji="✨" overline={tr('newtask.planner.overline')} title={tr('newtask.planner.title')} onPress={() => router.push(routes.planner())} />
      <FeatureCard colors={GRADIENTS.lucky} emoji="🍀" overline={tr('newtask.luckyCard.overline')} title={tr('newtask.luckyCard.title')} onPress={() => router.push(routes.lucky())} />

      {linked.map((l) => {
        const title = tr(`task.link.${l.link}`);
        const isAdded = links.has(l.link);
        return (
          <PastelCard
            key={l.link}
            emoji={l.icon}
            pastel={l.pastel}
            overline={tr('task.progress', { done: 0, target: l.target ?? 1 })}
            title={title}
            right={added(isAdded) as any}
            onPress={() =>
              router.push(routes.createTask({ title, icon: l.icon, pastel: l.pastel, slot: 'anytime', kind: l.kind, target: l.target, link: l.link, source: 'newtask:link' }))
            }
          />
        );
      })}

      <Txt variant="h2" style={{ marginTop: 16, marginBottom: 12 }}>
        {tr('newtask.suggested')}
      </Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 14 }}>
        <Chip label={tr('newtask.cat.all')} active={cat === 'all'} onPress={() => setCat('all')} />
        {SUGGEST_CATS.map((c) => (
          <Chip key={c} label={tr(`newtask.cat.${c}`)} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>

      {shown.map(({ s, i }) => {
        const title = L(s.title, lang);
        const isAdded = titles.has(s.title.tr.toLowerCase()) || titles.has(s.title.en.toLowerCase());
        const overline = s.kind === 'counter' ? tr('newtask.goal', { done: 0, target: s.target ?? 1 }) : tr(`task.slot.${s.slot}`);
        return (
          <PastelCard
            key={s.id}
            emoji={s.icon}
            pastel={pastelFor(i)}
            overline={overline}
            title={title}
            right={added(isAdded) as any}
            onPress={() =>
              router.push(routes.createTask({ title, icon: s.icon, pastel: pastelFor(i), slot: s.slot, kind: s.kind, target: s.target, source: 'newtask:suggest' }))
            }
          />
        );
      })}
      {hasHealth ? (
        <Txt variant="caption" faint center style={{ marginTop: 8 }}>
          {tr('common.medicalNote')}
        </Txt>
      ) : null}
    </Screen>
  );
}
