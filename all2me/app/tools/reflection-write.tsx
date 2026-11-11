import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Field, Header, IconButton, PillButton, Row, Screen, Txt, success } from '../../src/components/ui';
import { topicById } from '../../src/data/reflections';
import { L, fmtDay, useLang, useT } from '../../src/i18n';
import { useCore } from '../../src/store/core';
import { useReflection } from '../../src/store/slices/reflection';
import { alpha, radius, useTheme } from '../../src/theme';

export default function ReflectionWrite() {
  const t = useT();
  const th = useTheme();
  const lang = useLang();
  const { topicId, entryId } = useLocalSearchParams<{ topicId?: string; entryId?: string }>();
  const entry = useReflection((s) => (entryId ? s.entries[entryId] : undefined));
  const topic = topicById(entry ? entry.topicId : topicId);
  const n = topic ? topic.questions.length : 1;
  const [answers, setAnswers] = useState<string[]>(() => Array.from({ length: n }, (_, i) => entry?.answers[i] ?? ''));
  const [error, setError] = useState(false);
  const [askDel, setAskDel] = useState(false);

  const setAns = (i: number, v: string) => setAnswers((p) => p.map((x, j) => (j === i ? v : x)));

  const save = () => {
    if (!answers.some((a) => a.trim())) {
      setError(true);
      return;
    }
    const core = useCore.getState();
    const s = useReflection.getState();
    if (entry) {
      s.update(entry.id, answers);
      core.pushToast('reflection.updated');
    } else {
      s.add(topic?.id ?? null, answers);
      core.completeLinked('reflection');
      core.logActivity('reflection');
      core.pushToast('reflection.saved');
    }
    success();
    router.back();
  };

  // Silme iki adımlı (BUG-005): çöp kutusu onay sorar, "Evet, sil" siler.
  const del = () => {
    if (!entry) return;
    useReflection.getState().remove(entry.id);
    useCore.getState().pushToast('reflection.deleted');
    router.back();
  };

  return (
    <Screen
      insetTop={false}
      header={
        <Header
          left="close"
          title={topic ? L(topic.title, lang) : t('reflection.freeTitle')}
          right={entry ? <IconButton icon="trash-outline" onPress={() => setAskDel((v) => !v)} label={t('reflection.confirmDelete')} /> : undefined}
        />
      }
    >
      {askDel ? (
        <View style={{ backgroundColor: alpha(th.danger, 0.1), borderRadius: radius.lg, padding: 14, gap: 10, marginBottom: 12 }} accessibilityLiveRegion="polite">
          <Txt variant="bodyBold" center color={th.dangerText}>
            {t('reflection.deleteAsk')}
          </Txt>
          <Row gap={10}>
            <PillButton small label={t('common.btn.cancel')} kind="outline" onPress={() => setAskDel(false)} style={{ flex: 1 }} />
            <PillButton small label={t('reflection.deleteYes')} color={th.danger} textColor={th.onDanger} onPress={del} style={{ flex: 1 }} />
          </Row>
        </View>
      ) : null}
      {topic ? (
        <View style={{ backgroundColor: th.pastel[topic.pastel], borderRadius: 22, padding: 16, marginBottom: 6 }}>
          <Txt style={{ fontSize: 40 }}>{topic.emoji}</Txt>
          <Txt variant="h3" color={th.onPastel}>
            {L(topic.sub, lang)}
          </Txt>
        </View>
      ) : null}
      {entry ? (
        <Txt variant="caption" dim style={{ marginTop: 8 }}>
          {fmtDay(entry.dayKey, lang, 'long')}
        </Txt>
      ) : null}
      {(topic ? topic.questions : [null]).map((q, i) => (
        <Card key={i} style={{ marginTop: 14 }}>
          {q ? (
            <>
              <Txt variant="caption" dim>
                {t('reflection.questionOf', { i: i + 1, n })}
              </Txt>
              <Txt variant="bodyBold" style={{ marginTop: 2, marginBottom: 10 }}>
                {L(q, lang)}
              </Txt>
            </>
          ) : null}
          <Field
            value={answers[i] ?? ''}
            onChangeText={(v) => {
              setError(false);
              setAns(i, v);
            }}
            placeholder={q ? t('reflection.answerPlaceholder') : t('reflection.freePlaceholder')}
            multiline
            containerStyle={{ marginBottom: 0 }}
            style={{ minHeight: q ? 90 : 220, textAlignVertical: 'top' }}
          />
        </Card>
      ))}
      {error ? (
        <Txt color={th.dangerText} center style={{ marginTop: 10 }}>
          {t('reflection.needAnswer')}
        </Txt>
      ) : null}
      <View style={{ marginTop: 18 }}>
        <PillButton label={t('common.btn.save')} onPress={save} />
      </View>
    </Screen>
  );
}
