import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { Header, IconButton, PillButton, Row, Screen, Segmented, Txt, success, tap } from '../../src/components/ui';
import { LOVE100 } from '../../src/data/love100';
import { L, fmtDay, useLang, useT } from '../../src/i18n';
import { useCore } from '../../src/store/core';
import { useLove } from '../../src/store/slices/love';
import { GUTTER, pastelFor, radius, useTheme } from '../../src/theme';

// Beyaz yazı iki uçta da AA (≥ 4.5): kart sayacı 18px kalın, büyük metin sayılmaz.
const CARD_GRADS: Array<readonly [string, string]> = [
  ['#6D4AE8', '#8E4FE0'],
  ['#1D4ED8', '#2563EB'],
  ['#0F766E', '#0E7490'],
  ['#BE185D', '#DB2777'],
  ['#C2410C', '#B45309'],
  ['#7C3AED', '#A93BC9'],
  ['#0369A1', '#0E7490'],
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
    <Screen header={<Header />}>
      <Txt variant="h2" center style={{ marginBottom: 12 }}>
        {t('love.title')}
      </Txt>
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
                    <Txt variant="caption" color="#fff">
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
            {isDone ? (
              // Yapıldı durumu bir düğme değil; geri alma ayrı ve açık bir eylem (BUG-010)
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Txt variant="bodyBold" center color={th.successText}>
                  {t('love.doneMark')}
                </Txt>
                <PillButton label={t('love.undo')} icon="arrow-undo" kind="ghost" small onPress={mark} />
              </View>
            ) : (
              <PillButton label={t('love.doneToday')} onPress={mark} />
            )}
          </View>
          {isDone ? (
            <Txt variant="small" dim center style={{ marginTop: 6 }}>
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
