/**
 * Şanslı görevini çevir: kendine bakım havuzundan kart karıştırma/çevirme animasyonuyla rastgele görev.
 */
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Header, PillButton, Screen, Txt } from '../src/components/ui';
import { CONFIG } from '../src/engine/config';
import { LUCKY_POOL, type LuckyTask } from '../src/data/suggestions';
import { L, useLang, useT } from '../src/i18n';
import { uuid } from '../src/lib/id';
import { routes } from '../src/lib/routes';
import { PASTEL_KEYS } from '../src/engine/types';
import { radius, useTheme } from '../src/theme';

const CARD_W = 250;
const CARD_H = 300;

export default function Lucky() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const [phase, setPhase] = useState<'spinning' | 'revealed'>('spinning');
  const [shown, setShown] = useState<LuckyTask>(LUCKY_POOL[0]);
  const [pastelIdx, setPastelIdx] = useState(0);
  const last = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);
  const shuffle = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(1)).current;

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (iv.current) clearInterval(iv.current);
  };

  const spin = useCallback(() => {
    clear();
    setPhase('spinning');
    flip.setValue(1);
    shuffle.setValue(0);
    Animated.timing(shuffle, { toValue: 1, duration: 1300, easing: Easing.linear, useNativeDriver: false }).start();
    iv.current = setInterval(() => {
      setShown(LUCKY_POOL[Math.floor(Math.random() * LUCKY_POOL.length)]);
      setPastelIdx((i) => i + 1);
    }, 110);
    timers.current.push(
      setTimeout(() => {
        if (iv.current) clearInterval(iv.current);
        let pick = LUCKY_POOL[Math.floor(Math.random() * LUCKY_POOL.length)];
        while (pick.id === last.current && LUCKY_POOL.length > 1) pick = LUCKY_POOL[Math.floor(Math.random() * LUCKY_POOL.length)];
        last.current = pick.id;
        // çevirme: kart daralır, içerik değişir, genişler
        Animated.timing(flip, { toValue: 0, duration: 160, useNativeDriver: false }).start(() => {
          setShown(pick);
          setPastelIdx(Math.floor(Math.random() * PASTEL_KEYS.length));
          Animated.timing(flip, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.4)), useNativeDriver: false }).start();
          setPhase('revealed');
        });
      }, 1400),
    );
  }, [flip, shuffle]);

  useEffect(() => {
    spin();
    return clear;
  }, [spin]);

  const spinning = phase === 'spinning';
  const pastel = PASTEL_KEYS[pastelIdx % PASTEL_KEYS.length];
  const wobble = shuffle.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-8deg', '7deg', '-6deg', '0deg'] });
  const shift = shuffle.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -18, 16, -10, 0] });

  const doIt = () => {
    router.push(
      routes.actionBonus({
        bonusId: `lucky:${uuid()}`,
        title: L(shown.title, lang),
        emoji: shown.emoji,
        points: CONFIG.bonus.lucky.points,
        group: 'lucky',
        pastel: PASTEL_KEYS[pastelIdx % PASTEL_KEYS.length],
        source: 'lucky',
      }),
    );
  };

  return (
    <Screen header={<Header left="close" />} padBottom={32}>
      <Txt variant="h1" center style={{ marginTop: 4 }}>
        {tr('newtask.lucky.title')}
      </Txt>
      <Txt dim center style={{ marginTop: 4 }}>
        {spinning ? tr('newtask.lucky.spinning') : tr('newtask.lucky.subtitle')}
      </Txt>

      <View style={{ alignItems: 'center', justifyContent: 'center', height: CARD_H + 50, marginTop: 16 }}>
        {/* arkadaki kartlar */}
        <Animated.View style={{ position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: radius.xl, backgroundColor: t.pastel.purple, transform: [{ rotate: '-7deg' }, { translateX: shift }], opacity: 0.8 }} />
        <Animated.View style={{ position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: radius.xl, backgroundColor: t.pastel.blue, transform: [{ rotate: '6deg' }, { translateX: Animated.multiply(shift, -1) }], opacity: 0.8 }} />
        <Animated.View
          style={{
            width: CARD_W,
            height: CARD_H,
            borderRadius: radius.xl,
            backgroundColor: t.pastel[pastel],
            borderWidth: 5,
            borderColor: t.card,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            transform: [{ rotate: wobble }, { scaleX: flip }],
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <Text style={{ fontSize: 76 }}>{shown.emoji}</Text>
          <Txt variant="h2" color={t.onPastel} center style={{ marginTop: 16 }} numberOfLines={4}>
            {L(shown.title, lang)}
          </Txt>
        </Animated.View>
      </View>

      <Txt dim center style={{ marginBottom: 16, opacity: spinning ? 0 : 1 }}>
        {tr('newtask.lucky.reward', { n: CONFIG.bonus.lucky.points })}
      </Txt>
      <View style={{ gap: 12 }}>
        <PillButton label={tr('newtask.lucky.doIt')} onPress={doIt} disabled={spinning} />
        <PillButton label={tr('newtask.lucky.again')} kind="outline" onPress={spin} disabled={spinning} />
      </View>
    </Screen>
  );
}
