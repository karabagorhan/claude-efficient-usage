import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PALETTES, type Quiz, type Template, type TemplateItem } from '../../data/inspire';
import { L, useLang, useT, type Lang } from '../../i18n';
import { routes } from '../../lib/routes';
import { useFavorites } from '../../store/slices/favorites';
import { tap } from '../../components/ui';

const INK = '#241B2F';

/** Kart yüksekliği oranı (referans: dikey poster) */
export const CARD_RATIO = 1.45;

export function FavHeart({ id, size = 28, bg = 'rgba(255,255,255,0.85)' }: { id: string; size?: number; bg?: string }) {
  const fav = useFavorites((s) => s.favorites.includes(id));
  const toggle = useFavorites((s) => s.toggleFavorite);
  return (
    <Pressable
      hitSlop={8}
      accessibilityRole="button"
      onPress={() => {
        tap();
        toggle(id);
      }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={fav ? 'heart' : 'heart-outline'} size={size * 0.62} color={fav ? '#E0245E' : INK} />
    </Pressable>
  );
}

function PosterBody({ tpl, w, lang, t }: { tpl: Template; w: number; lang: Lang; t: ReturnType<typeof useT> }) {
  const accent = PALETTES[tpl.c][1];
  const k = w / 168;
  const fs = Math.max(9, Math.round(10.5 * k));
  const name = (i: TemplateItem) => L(i.name, lang);

  if (tpl.layout === 'grid') {
    const items = tpl.items.slice(0, 6);
    const cw = (w - 24) / 2;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((i, idx) => (
          <View key={idx} style={{ width: cw, alignItems: 'center', marginBottom: 5 * k }}>
            <Text style={{ fontSize: 20 * k }}>{i.emoji}</Text>
            <Text numberOfLines={2} style={{ fontSize: fs - 0.5, fontWeight: '700', color: INK, textAlign: 'center', paddingHorizontal: 2 }}>
              {name(i)}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  if (tpl.layout === 'list') {
    return (
      <View>
        {tpl.items.slice(0, 7).map((i, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 * k }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent, marginTop: 4, marginRight: 6 }} />
            <Text numberOfLines={2} style={{ flex: 1, fontSize: fs, fontWeight: '600', color: INK, lineHeight: fs + 3 }}>
              {name(i)}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  if (tpl.layout === 'checklist') {
    return (
      <View>
        {tpl.items.slice(0, 6).map((i, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 * k }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: accent,
                backgroundColor: idx < 2 ? accent : 'rgba(255,255,255,0.7)',
                marginRight: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {idx < 2 ? <Ionicons name="checkmark" size={9} color="#fff" /> : null}
            </View>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: fs, fontWeight: '600', color: INK }}>
              {name(i)}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  // schedule: zaman dilimine göre gruplar
  const order = ['morning', 'afternoon', 'evening', 'anytime'] as const;
  const groups = order
    .map((s) => ({ s, items: tpl.items.filter((i) => i.slot === s) }))
    .filter((g) => g.items.length)
    .slice(0, 3);
  return (
    <View>
      {groups.map((g) => (
        <View key={g.s} style={{ marginBottom: 6 * k }}>
          <Text style={{ fontSize: fs - 1.5, fontWeight: '800', color: accent, letterSpacing: 0.6 }}>{t(`task.slot.${g.s}`).toUpperCase()}</Text>
          {g.items.slice(0, 2).map((i, idx) => (
            <Text key={idx} numberOfLines={1} style={{ fontSize: fs, fontWeight: '600', color: INK, marginTop: 1 }}>
              {i.emoji} {name(i)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Referanstaki poster hissini kodla üretir: renkli zemin + kalın başlık + şablon düzenine göre gövde. */
export function TemplateCard({ tpl, width, onPress }: { tpl: Template; width: number; onPress?: () => void }) {
  const lang = useLang();
  const t = useT();
  const [bg, accent] = PALETTES[tpl.c];
  const h = Math.round(width * CARD_RATIO);
  const k = width / 168;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        (onPress ?? (() => router.push(routes.inspireTemplate(tpl.id))))();
      }}
      style={({ pressed }) => ({
        width,
        height: h,
        borderRadius: 22,
        backgroundColor: bg,
        overflow: 'hidden',
        padding: 12 * k,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View style={{ position: 'absolute', right: -30, top: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: accent, opacity: 0.22 }} />
      <Text style={{ position: 'absolute', right: -4, bottom: -10, fontSize: 64 * k, opacity: 0.18 }}>{tpl.emoji}</Text>
      <View style={{ paddingRight: 30 }}>
        <Text numberOfLines={3} style={{ fontSize: Math.round(17 * k), lineHeight: Math.round(20 * k), fontWeight: '900', color: INK }}>
          {L(tpl.title, lang)}
        </Text>
      </View>
      <View style={{ height: 2, borderRadius: 1, backgroundColor: accent, marginVertical: 8 * k, width: '40%' }} />
      <PosterBody tpl={tpl} w={width} lang={lang} t={t} />
      <View style={{ position: 'absolute', right: 8, top: 8 }}>
        <FavHeart id={tpl.id} size={Math.round(28 * Math.max(0.85, k))} />
      </View>
    </Pressable>
  );
}

export function QuizCard({ quiz, width }: { quiz: Quiz; width: number }) {
  const lang = useLang();
  const t = useT();
  const [bg, accent] = PALETTES[quiz.c];
  const h = Math.round(width * CARD_RATIO);
  const k = width / 168;
  const done = useFavorites((s) => !!s.quizResults[quiz.id]);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        router.push(routes.inspireQuiz(quiz.id));
      }}
      style={({ pressed }) => ({ width, height: h, borderRadius: 22, backgroundColor: bg, overflow: 'hidden', padding: 14 * k, opacity: pressed ? 0.9 : 1 })}
    >
      <View style={{ position: 'absolute', left: -40, bottom: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: accent, opacity: 0.2 }} />
      <Text style={{ fontSize: 46 * k }}>{quiz.emoji}</Text>
      <Text numberOfLines={3} style={{ fontSize: Math.round(19 * k), lineHeight: Math.round(23 * k), fontWeight: '900', color: INK, marginTop: 8 }}>
        {L(quiz.title, lang)}
      </Text>
      <Text numberOfLines={3} style={{ fontSize: Math.round(11.5 * k), fontWeight: '600', color: INK, opacity: 0.75, marginTop: 6 }}>
        {L(quiz.desc, lang)}
      </Text>
      <View style={{ flex: 1 }} />
      <View style={{ alignSelf: 'flex-start', backgroundColor: INK, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{done ? t('inspire.quiz.again') : t('inspire.quiz.start')}</Text>
      </View>
    </Pressable>
  );
}
