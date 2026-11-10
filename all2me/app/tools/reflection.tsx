import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Chip, EmptyState, Header, Row, Screen, Segmented, Txt, tap } from '../../src/components/ui';
import { REFLECTION_CATEGORIES, REFLECTION_TOPICS, topicById, type ReflectionCategory } from '../../src/data/reflections';
import { L, fmtDay, useLang, useT } from '../../src/i18n';
import { routes } from '../../src/lib/routes';
import { useReflection } from '../../src/store/slices/reflection';
import { radius, useTheme } from '../../src/theme';

export default function ReflectionScreen() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const [tab, setTab] = useState<'topics' | 'history'>('topics');
  const [cat, setCat] = useState<ReflectionCategory | 'all'>('all');
  const entries = useReflection((s) => s.entries);
  const history = useMemo(() => Object.values(entries).sort((a, b) => (a.at < b.at ? 1 : -1)), [entries]);
  const topics = REFLECTION_TOPICS.filter((x) => cat === 'all' || x.category === cat);

  return (
    <Screen header={<Header title={t('reflection.title')} />}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: 'topics', label: t('reflection.tabTopics') },
          { id: 'history', label: t('reflection.tabHistory') },
        ]}
      />
      {tab === 'topics' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <Chip label={t('reflection.all')} active={cat === 'all'} onPress={() => setCat('all')} />
            {REFLECTION_CATEGORIES.map((c) => (
              <Chip key={c.id} emoji={c.emoji} label={L(c.name, lang)} active={cat === c.id} onPress={() => setCat(c.id)} />
            ))}
          </View>
          <Pressable
            onPress={() => {
              tap();
              router.push(routes.reflectionWrite());
            }}
            style={{ marginTop: 16, backgroundColor: th.pastel.yellow, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <Text style={{ fontSize: 34 }}>✍️</Text>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold" color={th.onPastel}>
                {t('reflection.freeWrite')}
              </Txt>
              <Txt variant="small" color={th.onPastel}>
                {t('reflection.freeWriteSub')}
              </Txt>
            </View>
          </Pressable>
          {topics.map((tp) => (
            <Pressable
              key={tp.id}
              onPress={() => {
                tap();
                router.push(routes.reflectionWrite(tp.id));
              }}
              style={{ marginTop: 12, backgroundColor: th.card, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{ width: 72, height: 72, borderRadius: radius.md, backgroundColor: th.pastel[tp.pastel], alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 34 }}>{tp.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyBold" numberOfLines={2}>
                  {L(tp.title, lang)}
                </Txt>
                <Txt variant="small" dim numberOfLines={2}>
                  {L(tp.sub, lang)}
                </Txt>
                <Txt variant="caption" faint style={{ marginTop: 2 }}>
                  {t('reflection.questionCount', { n: tp.questions.length })}
                </Txt>
              </View>
            </Pressable>
          ))}
        </>
      ) : history.length === 0 ? (
        <View style={{ marginTop: 20 }}>
          <EmptyState emoji="📓" title={t('reflection.historyEmpty')} body={t('reflection.historyEmptyBody')} />
        </View>
      ) : (
        history.map((e) => {
          const tp = topicById(e.topicId);
          const first = e.answers.find((a) => a.trim()) ?? '';
          return (
            <Card
              key={e.id}
              onPress={() => router.push(`/tools/reflection-write?entryId=${encodeURIComponent(e.id)}` as never)}
              style={{ marginTop: 12 }}
            >
              <Row gap={12} style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: th.pastel[tp?.pastel ?? 'yellow'], alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{tp?.emoji ?? '✍️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyBold" numberOfLines={1}>
                    {tp ? L(tp.title, lang) : t('reflection.freeTitle')}
                  </Txt>
                  <Txt variant="caption" dim>
                    {fmtDay(e.dayKey, lang, 'long')}
                  </Txt>
                  <Txt variant="small" numberOfLines={2} style={{ marginTop: 4 }}>
                    {first}
                  </Txt>
                </View>
              </Row>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
