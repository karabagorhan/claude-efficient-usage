/**
 * Harekete Geç (SPEC §3.5, referans s04). İki mod (CONTRACTS §8):
 *  A) habitId  -> gerçek görev, Tamamlandı = complete(habitId)
 *  B) bonusId  -> görev dışı bonus (çark / şanslı görev), Tamamlandı = awardBonus(...)
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Confetti } from '../src/components/Confetti';
import { GradientScreen } from '../src/components/GradientScreen';
import { Mascot } from '../src/components/Mascot';
import { Header, PillButton, Row, Txt, success } from '../src/components/ui';
import { CONFIG } from '../src/engine/config';
import { PASTEL_KEYS, type PastelKey } from '../src/engine/types';
import { useT } from '../src/i18n';
import { useCore, today } from '../src/store/core';
import { completionId } from '../src/lib/id';
import { pastelColor, useTheme } from '../src/theme';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const INK = '#14171A';
const DELAY_MS = 1400;

function Sparkle({ size, style }: { size: number; style: object }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0 C12.8 7 17 11.2 24 12 C17 12.8 12.8 17 12 24 C11.2 17 7 12.8 0 12 C7 11.2 11.2 7 12 0 Z" fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

export default function Action() {
  const tr = useT();
  const th = useTheme();
  const params = useLocalSearchParams<Record<string, string>>();
  const habitId = one(params.habitId);
  const habit = useCore((s) => (habitId ? s.habits[habitId] : undefined));
  const alreadyDone = useCore((s) => (habitId ? Boolean(s.completions[completionId(habitId, today())]) : false));

  const bonusId = one(params.bonusId);
  const isBonus = !habitId && !!bonusId;
  const group = one(params.group) === 'lucky' ? 'lucky' : 'wheel';
  const pastelParam = one(params.pastel) as PastelKey | undefined;

  const title = habit?.title ?? one(params.title) ?? '';
  const emoji = habit?.icon ?? one(params.emoji) ?? '✨';
  const pastel: PastelKey = habit?.pastel ?? (pastelParam && PASTEL_KEYS.includes(pastelParam) ? pastelParam : 'pink');
  const bonusPoints = Number(one(params.points)) || 0;
  const valid = habit ? !habit.archived : isBonus && title.length > 0;

  const [earned, setEarned] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const finishLater = () => {
    timer.current = setTimeout(close, DELAY_MS);
  };

  const done = () => {
    if (earned !== null || note) return;
    const core = useCore.getState();
    if (habit) {
      if (habit.kind === 'counter' && habit.target) {
        const cur = core.progress[`${habit.id}|${today()}`] ?? 0;
        if (cur < habit.target) core.addProgress(habit.id, today(), habit.target - cur);
      }
      const c = core.complete(habit.id);
      if (!c) return setNote(tr('routine.action.alreadyDone'));
      success();
      setEarned(c.points);
      setBurst((b) => b + 1);
      finishLater();
      return;
    }
    if (isBonus && bonusId) {
      const res = core.awardBonus({ id: bonusId, points: bonusPoints, label: title, group, perDay: CONFIG.bonus[group].perDay });
      if (res.ok) {
        success();
        setEarned(res.event.points);
        setBurst((b) => b + 1);
        finishLater();
      } else if (res.reason === 'cap') {
        core.pushToast('toast.bonusCap', { n: CONFIG.bonus[group].perDay });
        close();
      } else {
        setNote(tr('routine.action.alreadyDone'));
      }
    }
  };

  const bg = pastelColor(pastel, false);
  const finished = earned !== null;

  return (
    <GradientScreen colors="action" header={<Header left="close" color="#FFFFFF" />} contentStyle={{ paddingTop: 0 }}>
      <Txt variant="display" size={40} weight="900" color="#FFFFFF" center style={{ lineHeight: 46, marginTop: 4 }}>
        {tr('routine.action.title')}
      </Txt>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        {valid ? (
          <View style={{ marginVertical: 20 }}>
            <View
              style={{
                transform: [{ rotate: '-3deg' }],
                backgroundColor: bg,
                borderRadius: 30,
                borderWidth: 6,
                borderColor: '#FFFFFF',
                shadowColor: '#FFFFFF',
                shadowOpacity: 0.7,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Row gap={16} style={{ paddingHorizontal: 20, paddingVertical: 22, minHeight: 104 }}>
                <Text style={{ fontSize: 44, width: 54, textAlign: 'center' }}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                  {isBonus ? (
                    <Txt variant="small" color={INK}>
                      {tr('routine.action.bonusLabel')} · {tr('routine.action.points', { n: bonusPoints })}
                    </Txt>
                  ) : null}
                  <Txt variant="h2" color={INK} numberOfLines={3}>
                    {title}
                  </Txt>
                </View>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    borderWidth: 2,
                    borderColor: INK,
                    backgroundColor: finished ? INK : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {finished ? <Ionicons name="checkmark" size={20} color={bg} /> : null}
                </View>
              </Row>
            </View>
            <Sparkle size={42} style={{ left: -4, top: -26 }} />
            <Sparkle size={50} style={{ right: -2, bottom: -30 }} />
            <Sparkle size={22} style={{ right: 48, bottom: -26 }} />
          </View>
        ) : (
          <Txt variant="h3" color="#FFFFFF" center>
            {tr('routine.action.missing')}
          </Txt>
        )}
      </View>

      {finished ? (
        <View style={{ alignItems: 'center', minHeight: 130, justifyContent: 'center' }}>
          <Txt variant="h1" color={INK} center>
            {tr('routine.action.wellDone')}
          </Txt>
          <Txt variant="h3" color={th.purple} center style={{ marginTop: 4 }}>
            {tr('routine.action.earned', { n: earned ?? 0 })}
          </Txt>
        </View>
      ) : (
        <View style={{ minHeight: 130, gap: 12 }}>
          {note ? (
            <Txt color={INK} center>
              {note}
            </Txt>
          ) : null}
          <PillButton label={tr('common.btn.done')} onPress={done} disabled={!valid || alreadyDone} />
          <PillButton label={tr('common.btn.later')} kind="outline" onPress={close} style={{ backgroundColor: '#FFFFFFDD' }} />
          {alreadyDone ? (
            <Txt variant="small" color={INK} center>
              {tr('routine.action.alreadyDone')}
            </Txt>
          ) : null}
        </View>
      )}

      <View pointerEvents="none" style={{ height: 120 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: -70, alignItems: 'center' }}>
        <Mascot mood={finished ? 'cheer' : 'happy'} size={210} />
      </View>
      <Confetti fire={burst} />
    </GradientScreen>
  );
}
