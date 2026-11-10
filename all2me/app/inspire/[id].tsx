import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Card, EmptyState, Header, PillButton, Row, Screen, SectionHeader, Txt, tap } from '../../src/components/ui';
import { getCategory, getTemplate, needsMedicalNote, PALETTES, similarTo, type TemplateItem } from '../../src/data/inspire';
import { FavHeart, TemplateCard } from '../../src/features/inspire/TemplateCard';
import { DAYS_SHORT, L, useLang, useT } from '../../src/i18n';
import { useCore, type HabitDraft } from '../../src/store/core';
import { GUTTER, pastelFor, radius, useTheme } from '../../src/theme';

const INK = '#241B2F';

export default function InspireDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const { width } = useWindowDimensions();
  const tpl = getTemplate(id);
  const habits = useCore((s) => s.habits);
  const me = useCore((s) => s.me);
  const addHabits = useCore((s) => s.addHabitsFromTemplates);
  const pushToast = useCore((s) => s.pushToast);

  const have = useMemo(() => {
    const set = new Set<string>();
    for (const h of Object.values(habits)) if (!h.archived && h.ownerId === me?.id) set.add(h.title);
    return set;
  }, [habits, me]);

  if (!tpl) {
    return (
      <Screen header={<Header title={t('inspire.title')} />}>
        <EmptyState emoji="🔎" title={t('inspire.notFound')} body={t('inspire.notFoundBody')} />
      </Screen>
    );
  }
  const [bg, accent] = PALETTES[tpl.c];
  const draft = (i: TemplateItem, idx: number): HabitDraft => ({
    title: L(i.name, lang),
    icon: i.emoji,
    slot: i.slot,
    pastel: pastelFor(idx),
    difficulty: i.difficulty ?? 'easy',
    kind: i.kind ?? 'check',
    ...(i.target ? { target: i.target } : {}),
    ...(i.days ? { schedule: { days: i.days as never } } : {}),
    source: `inspire:${tpl.id}`,
  });
  const isIn = (i: TemplateItem) => have.has(L(i.name, lang));
  const all = tpl.items.every(isIn);
  const notify = (n: number) => pushToast(n > 0 ? { key: 'toast.added', params: { n }, emoji: '✅' } : 'toast.nothingAdded');
  const addAll = () => notify(addHabits(tpl.items.map(draft)));
  const addOne = (i: TemplateItem, idx: number) => notify(addHabits([draft(i, idx)]));
  const cardW = Math.round(Math.min(width, 600) * 0.43);

  return (
    <Screen
      header={<Header title={L(tpl.title, lang)} right={<FavHeart id={tpl.id} size={34} bg={th.card} />} />}
      padBottom={40}
    >
      <View style={{ backgroundColor: bg, borderRadius: radius.xl, padding: 20, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -50, top: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: accent, opacity: 0.22 }} />
        <Text style={{ position: 'absolute', right: 12, bottom: 4, fontSize: 70, opacity: 0.22 }}>{tpl.emoji}</Text>
        <Text style={{ fontSize: 32, lineHeight: 36, fontWeight: '900', color: INK, paddingRight: 36 }}>{L(tpl.title, lang)}</Text>
        <Text style={{ fontSize: 15, lineHeight: 21, fontWeight: '500', color: INK, opacity: 0.8, marginTop: 8 }}>{L(tpl.desc, lang)}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {tpl.cats.map((c) => (
            <View key={c} style={{ backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: INK }}>
                {getCategory(c)?.emoji} {L(getCategory(c)!.name, lang)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Txt variant="h2" style={{ marginTop: 22, marginBottom: 10 }}>
        {t('inspire.detail.items')} · {t('inspire.itemsCount', { n: tpl.items.length })}
      </Txt>
      {tpl.items.map((i, idx) => {
        const inn = isIn(i);
        return (
          <Card key={idx} padding={12} style={{ marginBottom: 8 }}>
            <Row gap={12}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: th.pastel[pastelFor(idx)], alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{i.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyBold" numberOfLines={3}>
                  {L(i.name, lang)}
                </Txt>
                <Txt variant="caption" dim>
                  {t(`task.slot.${i.slot}`)}
                  {i.days?.length ? ` · ${i.days.length > 2 ? t('inspire.detail.weekdays') : i.days.map((d) => DAYS_SHORT[lang][d]).join(', ')}` : ''}
                </Txt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={inn ? t('inspire.detail.added') : t('inspire.detail.add')}
                disabled={inn}
                onPress={() => {
                  tap();
                  addOne(i, idx);
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: inn ? th.success : th.primary,
                }}
              >
                <Ionicons name={inn ? 'checkmark' : 'add'} size={22} color={inn ? '#fff' : th.onPrimary} />
              </Pressable>
            </Row>
          </Card>
        );
      })}

      <PillButton
        label={all ? t('inspire.detail.allAdded') : t('inspire.detail.addAll')}
        kind={all ? 'outline' : 'primary'}
        disabled={all}
        onPress={addAll}
        style={{ marginTop: 12 }}
      />
      {needsMedicalNote(tpl) ? (
        <Txt variant="caption" faint center style={{ marginTop: 12 }}>
          {t('common.medicalNote')}
        </Txt>
      ) : null}

      <SectionHeader title={t('inspire.detail.similar')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12 }}>
        {similarTo(tpl).map((s) => (
          <TemplateCard key={s.id} tpl={s} width={cardW} onPress={() => router.push(`/inspire/${s.id}`)} />
        ))}
      </ScrollView>
    </Screen>
  );
}
