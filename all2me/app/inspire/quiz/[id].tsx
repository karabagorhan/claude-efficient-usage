import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bar, Card, EmptyState, Header, PastelCard, PillButton, Screen, Txt, tap } from '../../../src/components/ui';
import { getQuiz, getTemplate, PALETTES, type Template } from '../../../src/data/inspire';
import { L, useLang, useT } from '../../../src/i18n';
import { routes } from '../../../src/lib/routes';
import { useFavorites } from '../../../src/store/slices/favorites';
import { pastelFor, radius, useTheme } from '../../../src/theme';

const INK = '#241B2F';

export default function InspireQuiz() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const lang = useLang();
  const th = useTheme();
  const setResult = useFavorites((s) => s.setQuizResult);
  const quiz = getQuiz(id);
  const [answers, setAnswers] = useState<number[]>([]);
  const [resultIdx, setResultIdx] = useState<number | null>(null);

  if (!quiz) {
    return (
      <Screen header={<Header left="close" />}>
        <EmptyState emoji="🧩" title={t('inspire.quiz.notFound')} />
      </Screen>
    );
  }
  const n = quiz.questions.length;
  const step = answers.length;
  const [bg, accent] = PALETTES[quiz.c];

  const pick = (opt: number) => {
    const next = [...answers, opt];
    if (next.length < n) {
      setAnswers(next);
      return;
    }
    const counts = quiz.results.map(() => 0);
    next.forEach((o) => (counts[o] = (counts[o] ?? 0) + 1));
    let best = 0;
    counts.forEach((c, i) => {
      if (c > counts[best]) best = i;
    });
    setAnswers(next);
    setResultIdx(best);
    setResult(quiz.id, quiz.results[best].id);
  };
  const restart = () => {
    setAnswers([]);
    setResultIdx(null);
  };

  if (resultIdx !== null) {
    const r = quiz.results[resultIdx];
    const tpls = r.templates.map((x) => getTemplate(x)).filter((x): x is Template => !!x);
    return (
      <Screen header={<Header left="close" title={L(quiz.title, lang)} />} padBottom={40}>
        <View style={{ backgroundColor: bg, borderRadius: radius.xl, padding: 22, alignItems: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: accent, opacity: 0.22 }} />
          <Txt variant="caption" color={INK} style={{ opacity: 0.7 }}>
            {t('inspire.quiz.result')}
          </Txt>
          <Text style={{ fontSize: 72, marginVertical: 6 }}>{r.emoji}</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: INK, textAlign: 'center' }}>{L(r.title, lang)}</Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: INK, textAlign: 'center', marginTop: 10, opacity: 0.85 }}>{L(r.desc, lang)}</Text>
        </View>
        <Card style={{ marginTop: 12 }}>
          <Txt variant="bodyBold">💡 {t('inspire.quiz.tip')}</Txt>
          <Txt dim style={{ marginTop: 4 }}>
            {L(r.tip, lang)}
          </Txt>
        </Card>
        <Txt variant="h3" style={{ marginTop: 22, marginBottom: 10 }}>
          {t('inspire.quiz.suggested')}
        </Txt>
        {tpls.map((tp, i) => (
          <PastelCard
            key={tp.id}
            emoji={tp.emoji}
            title={L(tp.title, lang)}
            overline={t('inspire.itemsCount', { n: tp.items.length })}
            pastel={pastelFor(i + 2)}
            onPress={() => router.push(routes.inspireTemplate(tp.id))}
          />
        ))}
        <Txt variant="caption" faint center style={{ marginVertical: 12 }}>
          {t('inspire.quiz.notDiagnosis')}
        </Txt>
        <PillButton label={t('inspire.quiz.again')} kind="outline" onPress={restart} />
        <View style={{ height: 10 }} />
        <PillButton label={t('common.btn.close')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/inspire'))} />
      </Screen>
    );
  }

  const qu = quiz.questions[step];
  return (
    <Screen header={<Header left="close" title={L(quiz.title, lang)} subtitle={t('inspire.quiz.question', { i: step + 1, n })} />} padBottom={40}>
      <Bar value={(step + 1) / n} color={accent} height={8} />
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
        <Text style={{ fontSize: 44 }}>{quiz.emoji}</Text>
        <Txt variant="h1" center style={{ marginTop: 10 }}>
          {L(qu.q, lang)}
        </Txt>
      </View>
      {qu.options.map((o, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          onPress={() => {
            tap();
            pick(i);
          }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? bg : th.card,
            borderWidth: 1.5,
            borderColor: pressed ? accent : th.border,
            borderRadius: radius.lg,
            padding: 16,
            marginBottom: 10,
          })}
        >
          <Txt variant="bodyBold">{L(o, lang)}</Txt>
        </Pressable>
      ))}
      {step > 0 ? <PillButton label={t('common.btn.back')} kind="ghost" onPress={() => setAnswers(answers.slice(0, -1))} /> : null}
    </Screen>
  );
}
