import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { EmptyState, Header, Row, Screen, Segmented, Txt, tap } from '../../src/components/ui';
import { QUOTES, QUOTE_GRADIENTS, quoteIndexForDay } from '../../src/data/quotes';
import { dayKeyOf } from '../../src/engine/dates';
import { L, useLang, useT } from '../../src/i18n';
import { useMotivation } from '../../src/store/slices/motivation';
import { radius } from '../../src/theme';

function QuoteCard({ i, big }: { i: number; big?: boolean }) {
  const t = useT();
  const lang = useLang();
  const fav = useMotivation((s) => s.favorites.includes(i));
  const g = QUOTE_GRADIENTS[i % QUOTE_GRADIENTS.length];
  const text = L(QUOTES[i], lang);
  const share = async () => {
    try {
      await Share.share({ message: text });
    } catch {
      /* paylaşım iptal / web desteği yok */
    }
  };
  return (
    <LinearGradient
      colors={[g[0], g[1]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.xl, padding: 22, minHeight: big ? 240 : 190, justifyContent: 'space-between' }}
    >
      <Txt variant={big ? 'h1' : 'h2'} color="#fff" style={{ fontSize: big ? 26 : 22, lineHeight: big ? 34 : 29 }}>
        “{text}”
      </Txt>
      <Row between style={{ marginTop: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('motivation.share')} onPress={() => { tap(); void share(); }} hitSlop={8}>
          <Ionicons name="share-outline" size={26} color="#fff" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fav ? t('motivation.unfavorite') : t('motivation.favorite')}
          onPress={() => {
            tap();
            useMotivation.getState().toggleFavorite(i);
          }}
          hitSlop={8}
        >
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={28} color="#fff" />
        </Pressable>
      </Row>
    </LinearGradient>
  );
}

export default function MotivationScreen() {
  const t = useT();
  const [tab, setTab] = useState<'all' | 'fav'>('all');
  const favorites = useMotivation((s) => s.favorites);
  const todayIdx = quoteIndexForDay(dayKeyOf());
  const list = tab === 'fav' ? QUOTES.map((_, i) => i).filter((i) => favorites.includes(i)) : QUOTES.map((_, i) => i).filter((i) => i !== todayIdx);

  return (
    <Screen header={<Header title={t('motivation.title')} />}>
      <Txt variant="h3" style={{ marginBottom: 8 }}>
        ✨ {t('motivation.today')}
      </Txt>
      <QuoteCard i={todayIdx} big />
      <Segmented
        style={{ marginTop: 22 }}
        value={tab}
        onChange={setTab}
        options={[
          { id: 'all', label: t('motivation.all') },
          { id: 'fav', label: `${t('motivation.favorites')} (${favorites.length})` },
        ]}
      />
      <View style={{ gap: 14, marginTop: 14 }}>
        {list.length === 0 ? (
          <EmptyState emoji="💜" title={t('motivation.noFavorites')} body={t('motivation.noFavoritesBody')} />
        ) : (
          list.map((i) => <QuoteCard key={i} i={i} />)
        )}
      </View>
    </Screen>
  );
}
