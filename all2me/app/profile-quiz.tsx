/** "Rutin tipin" profil testi (modal): 8 soru → tip sonucu; sonuç profil dilimine kaydedilir. */
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Header, PillButton, Screen } from '../src/components/ui';
import { QUIZ, quizResult } from '../src/features/onboarding/quiz';
import { QuizQuestionView, TypeResultView } from '../src/features/onboarding/QuizParts';
import { useT } from '../src/i18n';
import { useProfile } from '../src/store/slices/profile';

export default function ProfileQuizScreen() {
  const tr = useT();
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<number[]>([]);
  const type = idx >= QUIZ.length ? quizResult(ans) : null;

  const answer = (v: 0 | 1) => {
    const n = [...ans];
    n[idx] = v;
    setAns(n);
    if (idx === QUIZ.length - 1) {
      const res = quizResult(n);
      if (res) useProfile.getState().save({ routineType: res, quizAnswers: n });
    }
    setIdx(idx + 1);
  };
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const header = (
    <Header
      title={tr('onboarding.quizPage.title')}
      left={idx > 0 && !type ? 'back' : 'close'}
      onLeft={idx > 0 && !type ? () => setIdx(idx - 1) : close}
    />
  );

  if (type) {
    return (
      <Screen header={header}>
        <TypeResultView type={type} />
        <View style={{ height: 16 }} />
        <PillButton label={tr('onboarding.quizPage.done')} onPress={close} />
        <PillButton
          kind="ghost"
          label={tr('onboarding.quizPage.retake')}
          onPress={() => {
            setAns([]);
            setIdx(0);
          }}
        />
      </Screen>
    );
  }
  return (
    <Screen header={header}>
      <QuizQuestionView index={idx} value={ans[idx]} onAnswer={answer} />
    </Screen>
  );
}
