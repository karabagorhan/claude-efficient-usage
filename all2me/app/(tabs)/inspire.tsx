import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Header, IconButton, IconTile, Row, Screen, SectionHeader } from '../../src/components/ui';
import { CATEGORIES, FEATURED, PALETTES, QUIZZES, SECTIONS, templatesInSection, type Template } from '../../src/data/inspire';
import { QuizCard, TemplateCard } from '../../src/features/inspire/TemplateCard';
import { L, useLang, useT } from '../../src/i18n';
import { routes } from '../../src/lib/routes';
import { GUTTER, useTheme } from '../../src/theme';

const INK = '#241B2F';

function Banner({ tpl, width }: { tpl: Template; width: number }) {
  const lang = useLang();
  const t = useT();
  const [bg, accent] = PALETTES[tpl.c];
  return (
    <Pressable
      onPress={() => router.push(routes.inspireTemplate(tpl.id))}
      style={{ width, height: 150, borderRadius: 24, backgroundColor: bg, overflow: 'hidden', padding: 18, justifyContent: 'space-between' }}
    >
      <View style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: accent, opacity: 0.25 }} />
      <View style={{ position: 'absolute', right: 14, bottom: 8, flexDirection: 'row' }}>
        {tpl.items.slice(0, 3).map((i, idx) => (
          <Text key={idx} style={{ fontSize: 34, marginLeft: -4, opacity: 0.95 }}>
            {i.emoji}
          </Text>
        ))}
      </View>
      <View style={{ paddingRight: 90 }}>
        <Text numberOfLines={2} style={{ fontSize: 24, lineHeight: 28, fontWeight: '900', color: INK }}>
          {L(tpl.title, lang)}
        </Text>
        <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '600', color: INK, opacity: 0.75, marginTop: 4 }}>
          {L(tpl.desc, lang)}
        </Text>
      </View>
      <View style={{ alignSelf: 'flex-start', backgroundColor: INK, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{t('inspire.open')}</Text>
      </View>
    </Pressable>
  );
}

export default function InspireScreen() {
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const { width: winW } = useWindowDimensions();
  const W = Math.min(winW, 600);
  const [page, setPage] = useState(0);
  const bannerW = W - GUTTER * 2 - 20;
  const cardW = Math.round(W * 0.43);

  return (
    <Screen
      padBottom={24}
      header={
        <Header
          left="none"
          title={t('inspire.title')}
          right={
            <Row>
              <IconButton icon="search-outline" label={t('inspire.searchLabel')} onPress={() => router.push(routes.inspireSearch())} />
              <IconButton icon="heart-outline" label={t('inspire.favoritesLabel')} onPress={() => router.push(routes.inspireFavorites())} />
            </Row>
          }
        />
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={bannerW + 12}
        decelerationRate="fast"
        onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / (bannerW + 12)))}
        scrollEventThrottle={32}
        style={{ marginHorizontal: -GUTTER }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12 }}
      >
        {FEATURED.map((f) => (
          <Banner key={f.id} tpl={f} width={bannerW} />
        ))}
      </ScrollView>
      <Row style={{ justifyContent: 'center', marginTop: 10 }} gap={6}>
        {FEATURED.map((f, i) => (
          <View key={f.id} style={{ width: i === page ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? th.text : th.border }} />
        ))}
      </Row>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GUTTER, marginTop: 18 }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 4 }}
      >
        {CATEGORIES.map((c) => (
          <IconTile key={c.id} emoji={c.emoji} label={L(c.name, lang)} pastel={c.pastel} size={68} onPress={() => router.push(routes.inspireCategory(c.id))} />
        ))}
      </ScrollView>

      {SECTIONS.map((s) => {
        const list = templatesInSection(s.id).slice(0, 8);
        if (!list.length) return null;
        return (
          <View key={s.id}>
            <SectionHeader title={L(s.name, lang)} onSeeAll={() => router.push(routes.inspireCategory(s.id))} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -GUTTER }}
              contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12 }}
            >
              {list.map((tpl) => (
                <TemplateCard key={tpl.id} tpl={tpl} width={cardW} />
              ))}
            </ScrollView>
            {s.id === 'tips' ? (
              <View>
                <SectionHeader title={t('inspire.quiz.section')} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -GUTTER }}
                  contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12 }}
                >
                  {QUIZZES.map((q) => (
                    <QuizCard key={q.id} quiz={q} width={cardW} />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}
