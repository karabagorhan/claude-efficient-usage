import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { GradientScreen } from '../src/components/GradientScreen';
import { Card, Header, Row, Txt } from '../src/components/ui';
import { Flame } from '../src/features/streak/Flame';
import { longestStreak, monthCells, shiftMonth } from '../src/features/streak/calendar';
import { DAYS_LETTER, fmtDay, useLang, useT } from '../src/i18n';
import { today, useActiveDays, useDayStreak } from '../src/store/core';
import { GRADIENTS, alpha, radius, useTheme } from '../src/theme';

function bannerKey(n: number): string {
  if (n === 0) return 'zero';
  if (n < 3) return 'low';
  if (n < 7) return 'mid';
  if (n < 14) return 'good';
  if (n < 30) return 'great';
  return 'epic';
}

export default function StreakScreen() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const streak = useDayStreak();
  const days = useActiveDays();
  const todayKey = today();
  const [month, setMonth] = useState(shiftMonth(todayKey, 0));
  const cells = monthCells(month);
  const atCurrent = month >= shiftMonth(todayKey, 0);
  const weeks: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const colors = t.isDark ? (['#B85A10', '#6B3A12', '#241810', t.bg] as const) : GRADIENTS.streak;
  const light = '#FFFFFF';
  // Kontrast (contrast.md #13-15): açık temada turuncu/krem zeminde koyu turuncu sayı, kahve-amber birim, koyu başlık.
  const INK = '#14171A';

  return (
    <GradientScreen colors={colors} scroll padBottom={32} header={<Header left="back" title={tr('streak.title')} color={t.isDark ? light : INK} />}>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <Flame size={156} />
        <Txt size={96} weight="900" color={t.isDark ? t.orange : '#C2410C'} style={{ lineHeight: 104, marginTop: -6 }}>
          {String(streak)}
        </Txt>
        <Txt size={24} weight="800" color={t.isDark ? '#FFC37A' : '#B45309'}>
          {tr('streak.unit', { n: streak })}
        </Txt>
      </View>

      <View
        style={{
          marginTop: 22,
          backgroundColor: '#FF8A1F',
          borderRadius: radius.lg,
          paddingVertical: 20,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          overflow: 'hidden',
        }}
      >
        <Txt size={44}>🏆</Txt>
        <Txt variant="h3" color={INK} style={{ flex: 1 }}>
          {tr(`streak.banner.${bannerKey(streak)}`)}
        </Txt>
      </View>

      <Txt variant="h2" style={{ marginTop: 26, marginBottom: 12 }}>
        {tr('streak.calendar')}
      </Txt>
      <Card padding={14}>
        <Row between style={{ marginBottom: 10 }}>
          <Pressable accessibilityLabel={tr('streak.prev')} hitSlop={10} onPress={() => setMonth(shiftMonth(month, -1))} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={22} color={t.text} />
          </Pressable>
          <Txt variant="bodyBold">{fmtDay(month, lang, 'month')}</Txt>
          <Pressable
            accessibilityLabel={tr('streak.next')}
            hitSlop={10}
            disabled={atCurrent}
            onPress={() => setMonth(shiftMonth(month, 1))}
            style={{ padding: 6, opacity: atCurrent ? 0.25 : 1 }}
          >
            <Ionicons name="chevron-forward" size={22} color={t.text} />
          </Pressable>
        </Row>
        <Row style={{ marginBottom: 6 }}>
          {DAYS_LETTER[lang].map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Txt variant="caption" dim weight="700">
                {d}
              </Txt>
            </View>
          ))}
        </Row>
        {weeks.map((w, wi) => (
          <Row key={wi} style={{ marginBottom: 4 }}>
            {w.map((k, ci) => {
              const active = k ? days.has(k) : false;
              const isToday = k === todayKey;
              const future = k ? k > todayKey : false;
              return (
                <View key={ci} style={{ flex: 1, alignItems: 'center' }}>
                  {k ? (
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? t.orange : 'transparent',
                        borderWidth: isToday ? 2 : 0,
                        borderColor: active ? alpha(t.text, 0.85) : t.orange,
                      }}
                    >
                      <Txt weight={active || isToday ? '800' : '500'} color={active ? '#FFFFFF' : future ? t.textFaint : t.text}>
                        {String(Number(k.slice(8)))}
                      </Txt>
                    </View>
                  ) : (
                    <View style={{ width: 38, height: 38 }} />
                  )}
                </View>
              );
            })}
          </Row>
        ))}
      </Card>

      <Row gap={12} style={{ marginTop: 14 }}>
        <Card style={{ flex: 1 }}>
          <Txt variant="small" dim>
            {tr('streak.longest')}
          </Txt>
          <Txt variant="h2" style={{ marginTop: 4 }}>
            {tr('streak.days', { n: Math.max(longestStreak(days), streak) })}
          </Txt>
        </Card>
        <Card style={{ flex: 1 }}>
          <Txt variant="small" dim>
            {tr('streak.totalDays')}
          </Txt>
          <Txt variant="h2" style={{ marginTop: 4 }}>
            {tr('streak.days', { n: days.size })}
          </Txt>
        </Card>
      </Row>
      <Txt variant="small" dim center style={{ marginTop: 14 }}>
        {tr('streak.rule')}
      </Txt>
    </GradientScreen>
  );
}
