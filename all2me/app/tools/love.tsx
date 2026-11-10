import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { Header, IconButton, PillButton, Row, Screen, Segmented, Txt, success, tap } from '../../src/components/ui';
import { LOVE100 } from '../../src/data/love100';
import { L, fmtDay, useLang, useT } from '../../src/i18n';
import { useCore } from '../../src/store/core';
import { useLove } from '../../src/store/slices/love';
import { GUTTER, PASTEL_KEYS, alpha, pastelFor, radius, useTheme } from '../../src/theme';

const CARD_GRADS: Array<readonly [string, string]> = [
  ['#7C5CFC', '#C3A6FF'],
  ['#3B6CF6', '#8CC1FF'],
  ['#14B8A6', '#9BE8C9'],
  ['#EC4899', '#F9A8D4'],
  ['#FF8A1F', '#FFC37A'],
  ['#8B5CF6', '#F08BEA'],
  ['#0EA5E9', '#7DD3FC'],
];

export default function LoveScreen() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const { width } = useWindowDimensions();
  const bw = Math.min(width, 600) - GUTTER * 2;
  const done = useLove((s) => s.done);
  const startIndex = useLove((s) => s.index);
  const [idx, setIdx] = useState(Math.min(startIndex, LOVE100.length - 1));
  const [view, setView] = useState<'deck' | 'grid'>('deck');
  const ref = useRef<FlatList>(null);
  const count = Object.keys(done).length;
  const isDone = !!done[idx];

  const goTo = useCallback((i: number, animated = true) => {
    const k = Math.max(0, Math.min(LOVE100.length - 1, i));
    setIdx(k);
    useLove.getState().setIndex(k);
    ref.current?.scrollToIndex({ index: k, animated });
  }, []);

  const mark = () => {
    const first = useLove.getState().toggle(idx);
    if (first) {
      useCore.getState().logActivity('love');
      success();
    }
  };

  const random = () => {
    tap();
    const pool = LOVE100.map((_, i) => i).filter((i) => !done[i] && i !== idx);
    const list = pool.length ? pool : LOVE100.map((_, i) => i).filter((i) => i !== idx);
    goTo(list[Math.floor(Math.random() * list.length)]);
  };

  return (
    <Screen header={<Header title={t('love.title')} />}>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { id: 'deck', label: t('love.viewDeck') },
          { id: 'grid', label: t('love.viewGrid') },
        ]}
      />
      <Txt variant="bodyBold" center style={{ marginTop: 12 }}>
        {count === LOVE100.length ? t('love.allDone') : t('love.counter', { n: count, total: LOVE100.length })}
      </Txt>

      {view === 'deck' ? (
        <>
          <FlatList
            ref={ref}
            horizontal
            pagingEnabled
            data={LOVE100}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
            initialScrollIndex={idx}
            getItemLayout={(_, i) => ({ length: bw, offset: bw * i, index: i })}
            windowSize={5}
            initialNumToRender={3}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / bw);
              if (i !== idx && i >= 0 && i < LOVE100.length) {
                setIdx(i);
                useLove.getState().setIndex(i);
              }
            }}
            scrollEventThrottle={32}
            renderItem={({ item, index }) => {
              const g = CARD_GRADS[index % CARD_GRADS.length];
              return (
                <View style={{ width: bw }}>
                  <LinearGradient colors={[g[0], g[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 340, borderRadius: radius.xl, padding: 24, justifyContent: 'space-between' }}>
                    <Row between>
                      <Txt variant="h3" color="#fff">
                        {t('love.cardOf', { i: index + 1, n: LOVE100.length })}
                      </Txt>
                      {done[index] ? <Ionicons name="checkmark-circle" size={30} color="#fff" /> : <View />}
                    </Row>
                    <Txt variant="h1" color="#fff" style={{ fontSize: 26, lineHeight: 34 }}>
                      {L(item, lang)}
                    </Txt>
                    <Txt variant="caption" color="#ffffffcc">
                      {done[index] ? t('love.doneOn', { day: fmtDay(done[index], lang, 'short') }) : ' '}
                    </Txt>
                  </LinearGradient>
                </View>
              );
            }}
          />
          <Row between style={{ marginTop: 14 }}>
            <IconButton icon="chevron-back" size={28} label={t('love.prev')} onPress={() => goTo(idx - 1)} bg={th.card} />
            <PillButton label={t('love.random')} icon="shuffle" kind="outline" small onPress={random} />
            <IconButton icon="chevron-forward" size={28} label={t('love.next')} onPress={() => goTo(idx + 1)} bg={th.card} />
          </Row>
          <View style={{ marginTop: 14 }}>
            <PillButton label={isDone ? t('love.doneMark') : t('love.doneToday')} kind={isDone ? 'outline' : 'primary'} onPress={mark} />
          </View>
          {isDone ? (
            <Txt variant="small" dim center style={{ marginTop: 10 }}>
              {t('love.wellDone')}
            </Txt>
          ) : null}
        </>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {LOVE100.map((_, i) => {
            const c = th.pastel[pastelFor(i)];
            const w = (bw - 8 * 4) / 5;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  tap();
                  setView('deck');
                  setIdx(i);
                  useLove.getState().setIndex(i);
                }}
                style={{ width: w, height: w, borderRadius: radius.md, backgroundColor: done[i] ? th.primary : c, alignItems: 'center', justifyContent: 'center' }}
              >
                {done[i] ? <Ionicons name="checkmark" size={22} color={th.onPrimary} /> : <Txt variant="bodyBold" color={th.onPastel}>{i + 1}</Txt>}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
