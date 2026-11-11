/** Profil testi parçaları: soru görünümü, tip sonucu kartı ve 15 dk'lık saat seçici (onboarding + profil testi ortak). */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Txt, tap } from '../../components/ui';
import { fmtTime, useLang, useT } from '../../i18n';
import type { RoutineType } from '../../store/slices/profile';
import { radius, useTheme } from '../../theme';
import { QUIZ, TYPE_ART } from './quiz';

/** Tek soru: iki büyük seçenek; seçime dokununca `onAnswer(0 | 1)`. */
export function QuizQuestionView({ index, value, onAnswer }: { index: number; value?: number | null; onAnswer: (v: 0 | 1) => void }) {
  const t = useTheme();
  const tr = useT();
  const q = QUIZ[index];
  if (!q) return null;
  return (
    <View style={{ flex: 1 }}>
      <Txt variant="caption" dim center style={{ marginBottom: 6 }}>
        {tr('onboarding.quiz.step', { n: index + 1, total: QUIZ.length })}
      </Txt>
      <Txt variant="h1" center role="header" style={{ marginBottom: 22 }}>
        {tr(`onboarding.quiz.${q.id}.q`)}
      </Txt>
      {([0, 1] as const).map((k) => {
        const on = value === k;
        return (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onAnswer(k);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 18,
              minHeight: 92,
              marginBottom: 14,
              borderRadius: radius.lg,
              backgroundColor: t.card,
              borderWidth: 2,
              borderColor: on ? t.text : 'transparent',
            }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Txt weight="800" size={15}>
                {k === 0 ? 'A' : 'B'}
              </Txt>
            </View>
            <Txt variant="bodyBold" style={{ flex: 1 }}>
              {tr(`onboarding.quiz.${q.id}.${k === 0 ? 'a' : 'b'}`)}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const BULLET = ['s1', 's2', 's3'] as const;

/** Sonuç: tip kartı + güçlü yanlar + tuzaklar + ipuçları + "eğlence" notu. */
export function TypeResultView({ type }: { type: RoutineType }) {
  const t = useTheme();
  const tr = useT();
  const art = TYPE_ART[type];
  const sections: Array<{ key: 'strengths' | 'traps' | 'tips'; prefix: 's' | 't' | 'p'; icon: string }> = [
    { key: 'strengths', prefix: 's', icon: '💪' },
    { key: 'traps', prefix: 't', icon: '⚠️' },
    { key: 'tips', prefix: 'p', icon: '💡' },
  ];
  return (
    <View>
      <View style={{ backgroundColor: t.pastel[art.pastel], borderRadius: radius.xl, padding: 22, alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 56 }}>{art.emoji}</Text>
        <Txt variant="small" color={t.onPastel} style={{ marginTop: 6 }}>
          {tr('onboarding.type.overline')}
        </Txt>
        <Txt variant="display" color={t.onPastel} center role="header">
          {tr(`onboarding.type.${type}.name`)}
        </Txt>
        <Txt variant="bodyBold" color={t.onPastel} center style={{ marginTop: 6 }}>
          {tr(`onboarding.type.${type}.tag`)}
        </Txt>
      </View>
      {sections.map((sec) => (
        <Card key={sec.key} style={{ marginBottom: 12 }} padding={16}>
          <Txt variant="h3" style={{ marginBottom: 8 }}>
            {sec.icon} {tr(`onboarding.type.${sec.key}`)}
          </Txt>
          {BULLET.map((b, i) => (
            <View key={b} style={{ flexDirection: 'row', gap: 10, marginTop: i === 0 ? 0 : 8 }}>
              <Text style={{ color: t.textDim, fontSize: 16, lineHeight: 22 }}>•</Text>
              <Txt style={{ flex: 1 }}>{tr(`onboarding.type.${type}.${sec.prefix}${i + 1}`)}</Txt>
            </View>
          ))}
        </Card>
      ))}
      <Txt variant="small" dim center style={{ marginTop: 6 }}>
        {tr('onboarding.type.note')}
      </Txt>
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
export const stepTime = (hhmm: string, deltaMin: number): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const v = (((h * 60 + m + deltaMin) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
};

/** ±15 dk'lık kendi saat seçicimiz (yerel picker yok). */
export function TimeStepper({ label, icon, value, onChange }: { label: string; icon: string; value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const btn = (name: 'remove' | 'add', delta: number, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${a11y}`}
      onPress={() => {
        tap();
        onChange(stepTime(value, delta));
      }}
      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, backgroundColor: t.cardAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
    >
      <Ionicons name={name === 'remove' ? 'remove' : 'add'} size={24} color={t.text} />
    </Pressable>
  );
  return (
    <Card style={{ marginBottom: 12 }} padding={14}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Txt variant="small" dim>
            {label}
          </Txt>
          <Txt size={28} weight="800" numberOfLines={1}>
            {fmtTime(value, lang)}
          </Txt>
        </View>
        {btn('remove', -15, tr('onboarding.rhythm.earlier'))}
        {btn('add', 15, tr('onboarding.rhythm.later'))}
      </View>
    </Card>
  );
}
