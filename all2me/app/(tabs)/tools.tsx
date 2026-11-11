import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Bar, IconTile, Row, Screen, SectionHeader, Txt, tap } from '../../src/components/ui';
import { REFLECTION_TOPICS } from '../../src/data/reflections';
import { QUOTES, quoteIndexForDay } from '../../src/data/quotes';
import { L, useLang, useT } from '../../src/i18n';
import { dayKeyOf } from '../../src/engine/dates';
import { MoodFace } from '../../src/features/tools/MoodFace';
import { TopicCard } from '../../src/features/tools/TopicCard';
import { DropFill } from '../../src/features/tools/DropFill';
import { fromMl } from '../../src/features/tools/units';
import { routes } from '../../src/lib/routes';
import { useDrink, drinkTotalOn } from '../../src/store/slices/drink';
import { useMood } from '../../src/store/slices/mood';
import { useSleep } from '../../src/store/slices/sleep';
import { useSettings } from '../../src/store/settings';
import { GUTTER, alpha, radius, useTheme, type PastelKey } from '../../src/theme';

const TOOLS: Array<{ id: Parameters<typeof routes.tool>[0]; emoji: string; pastel: PastelKey }> = [
  { id: 'timer', emoji: '⏳', pastel: 'purple' },
  { id: 'drink', emoji: '💧', pastel: 'blue' },
  { id: 'sleep', emoji: '🌙', pastel: 'mint' },
  { id: 'reflection', emoji: '📓', pastel: 'yellow' },
  { id: 'meditate', emoji: '🧘', pastel: 'pink' },
  { id: 'workout', emoji: '💪', pastel: 'peach' },
  { id: 'motivation', emoji: '👍', pastel: 'green' },
  { id: 'soundscape', emoji: '🎧', pastel: 'purple' },
  { id: 'alarm', emoji: '🔔', pastel: 'peach' },
];

export default function ToolsTab() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const { width } = useWindowDimensions();
  const bw = width - GUTTER * 2;
  const [page, setPage] = useState(0);
  const day = dayKeyOf();
  const todayMood = useMood((s) => s.entries[day]?.level ?? 0);
  const drunk = useDrink((s) => drinkTotalOn(s, day));
  const goalMl = useDrink((s) => s.goalMl);
  const units = useSettings((s) => s.units);
  const sleepMin = useSleep((s) => s.entries[day]?.minutes ?? 0);
  const quote = QUOTES[quoteIndexForDay(day)];

  const life: Array<{ key: string; emoji: string; pastel: PastelKey; href: string }> = [
    { key: 'smoke', emoji: '🚭', pastel: 'mint', href: routes.life('smoke') },
    { key: 'meals', emoji: '🍲', pastel: 'peach', href: routes.life('meals') },
    { key: 'chores', emoji: '🧺', pastel: 'blue', href: routes.life('chores') },
    { key: 'study', emoji: '🎓', pastel: 'purple', href: routes.study() },
    { key: 'growth', emoji: '🚀', pastel: 'yellow', href: routes.growth() },
  ];

  return (
    <Screen header={<View style={{ paddingVertical: 14, paddingHorizontal: GUTTER }}><Txt variant="h3" center>{t('tools.title')}</Txt></View>} padBottom={24}>
      {/* Afişler */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={bw + 0}
        decelerationRate="fast"
        onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / bw))}
        scrollEventThrottle={16}
        style={{ marginHorizontal: 0 }}
      >
        <Pressable onPress={() => router.push(routes.tool('love'))} style={{ width: bw }}>
          <LinearGradient
            colors={['#7C5CFC', '#A66CFF', '#F08BEA']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.8 }}
            style={{ height: 150, borderRadius: radius.lg, padding: 20, overflow: 'hidden', justifyContent: 'center' }}
          >
            <View style={{ width: '58%' }}>
              <Txt variant="h1" color="#fff" numberOfLines={3}>
                {t('tools.banner.love')}
              </Txt>
              <Txt variant="small" color="#ffffffdd" style={{ marginTop: 6 }}>
                {t('tools.banner.loveSub')}
              </Txt>
            </View>
            <View style={{ position: 'absolute', right: 26, top: 22, width: 92, height: 104, borderRadius: 18, backgroundColor: '#ffffff40', transform: [{ rotate: '8deg' }] }} />
            <View style={{ position: 'absolute', right: 40, top: 22, width: 92, height: 104, borderRadius: 18, backgroundColor: '#5B6CF0', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }}>
              <Text style={{ fontSize: 50 }}>🤗</Text>
            </View>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.push(routes.tool('motivation'))} style={{ width: bw }}>
          <LinearGradient
            colors={['#FF8A1F', '#FF6B8B', '#F08BEA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 150, borderRadius: radius.lg, padding: 20, justifyContent: 'center' }}
          >
            <Txt variant="caption" color="#ffffffcc" weight="700">
              ✨ {t('tools.banner.quote')}
            </Txt>
            <Txt variant="h3" color="#fff" numberOfLines={4} style={{ marginTop: 6 }}>
              {L(quote, lang)}
            </Txt>
          </LinearGradient>
        </Pressable>
      </ScrollView>
      <Row style={{ justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ width: i === page ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === page ? th.text : th.border }} />
        ))}
      </Row>

      {/* Araç şeridi */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 18, marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER - 6, gap: 4 }}>
        {TOOLS.map((x) => (
          <IconTile key={x.id} emoji={x.emoji} pastel={x.pastel} label={t(`tools.name.${x.id}`)} onPress={() => router.push(routes.tool(x.id))} />
        ))}
      </ScrollView>

      {/* Ruh hali */}
      <Pressable
        onPress={() => router.push(routes.tool('mood'))}
        style={{ marginTop: 22, backgroundColor: th.pastel.green, borderRadius: radius.lg, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Txt variant="h3" color={th.onPastel}>
            {todayMood ? t('tools.mood.today', { label: t(`mood.level.${todayMood}`) }) : t('tools.mood.title')}
          </Txt>
          <Txt color={th.onPastel} style={{ marginTop: 2 }}>
            {todayMood ? t('tools.mood.edit') : t('tools.mood.sub')}
          </Txt>
        </View>
        {todayMood ? (
          <MoodFace level={todayMood} size={52} />
        ) : (
          <Row>
            {[5, 4, 2, 1].map((l, i) => (
              <View key={l} style={{ marginLeft: i ? -12 : 0 }}>
                <MoodFace level={l} size={40} ring={th.pastel.green} />
              </View>
            ))}
            <View style={{ marginLeft: -10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#14171A', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={26} color="#fff" />
            </View>
          </Row>
        )}
      </Pressable>

      {/* Su */}
      <Pressable
        onPress={() => router.push(routes.tool('drink'))}
        style={{ marginTop: 12, backgroundColor: th.pastel.blue, borderRadius: radius.lg, padding: 18, flexDirection: 'row', alignItems: 'center' }}
      >
        <View style={{ flex: 1 }}>
          <Txt variant="h3" color={th.onPastel}>
            {t('tools.drink.title')}
          </Txt>
          <Txt color={th.onPastel} style={{ marginTop: 2 }}>
            {t('tools.drink.sub')}
          </Txt>
          <View style={{ marginTop: 10, marginRight: 8 }}>
            <Bar value={drunk / goalMl} color={th.blue} bg={alpha('#FFFFFF', 0.5)} height={8} />
            <Txt variant="caption" color={th.onPastel} style={{ marginTop: 4 }}>
              {t('drink.amountOf', { a: fromMl(drunk, units), b: fromMl(goalMl, units), unit: t(`common.unit.${units}`) })}
            </Txt>
          </View>
        </View>
        <DropFill value={drunk / goalMl} size={56} />
        <Ionicons name="chevron-forward" size={22} color={th.onPastel} />
      </Pressable>

      {/* Yansıma */}
      <SectionHeader title={t('tools.reflection.title')} onSeeAll={() => router.push(routes.tool('reflection'))} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 18 }}>
        {REFLECTION_TOPICS.slice(0, 8).map((tp) => (
          <TopicCard key={tp.id} topic={tp} onPress={() => router.push(routes.reflectionWrite(tp.id))} />
        ))}
      </ScrollView>

      {/* Uyku özeti */}
      <Pressable
        onPress={() => router.push(routes.tool('sleep'))}
        style={{ marginTop: 22, backgroundColor: th.pastel.purple, borderRadius: radius.lg, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <Text style={{ fontSize: 38 }}>🌙</Text>
        <View style={{ flex: 1 }}>
          <Txt variant="h3" color={th.onPastel}>
            {t('tools.sleep.title')}
          </Txt>
          <Txt color={th.onPastel}>
            {sleepMin ? t('tools.sleep.last', { h: Math.floor(sleepMin / 60), m: sleepMin % 60 }) : t('tools.sleep.none')}
          </Txt>
        </View>
        <Ionicons name="chevron-forward" size={22} color={th.onPastel} />
      </Pressable>

      {/* Yaşam takibi */}
      <SectionHeader title={t('tools.life.title')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {life.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => {
              tap();
              router.push(c.href as never);
            }}
            style={{ width: (bw - 12) / 2, minHeight: 112, backgroundColor: th.pastel[c.pastel], borderRadius: radius.lg, padding: 16, justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 36 }}>{c.emoji}</Text>
            <Txt variant="bodyBold" color={th.onPastel} numberOfLines={2}>
              {t(`tools.life.${c.key}`)}
            </Txt>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
