import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, View } from 'react-native';
import { Btn, Chip, Screen, Txt, success } from '../src/components/ui';
import { useStore } from '../src/store/store';
import { useTheme } from '../src/theme';

type Phase = { label: string; secs: number; scale: number };
const PATTERNS: Record<string, { name: string; phases: Phase[] }> = {
  box: {
    name: 'Kutu 4-4-4-4',
    phases: [
      { label: 'Nefes al', secs: 4, scale: 1 },
      { label: 'Tut', secs: 4, scale: 1 },
      { label: 'Nefes ver', secs: 4, scale: 0.55 },
      { label: 'Bekle', secs: 4, scale: 0.55 },
    ],
  },
  relax: {
    name: 'Rahatlatıcı 4-7-8',
    phases: [
      { label: 'Nefes al', secs: 4, scale: 1 },
      { label: 'Tut', secs: 7, scale: 1 },
      { label: 'Nefes ver', secs: 8, scale: 0.55 },
    ],
  },
};
const ROUNDS = 5;

export default function Breathe() {
  const t = useTheme();
  const bump = useStore((s) => s.bumpCounter);
  const [key, setKey] = useState<'box' | 'relax'>('box');
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [left, setLeft] = useState(0);
  const scale = useRef(new Animated.Value(0.55)).current;
  const phases = PATTERNS[key].phases;

  useEffect(() => {
    if (!running) return;
    const ph = phases[phaseIdx];
    setLeft(ph.secs);
    Animated.timing(scale, { toValue: ph.scale, duration: ph.secs * 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
    let s = ph.secs;
    const id = setInterval(() => {
      s -= 1;
      setLeft(s);
      if (s <= 0) {
        clearInterval(id);
        const next = phaseIdx + 1;
        if (next >= phases.length) {
          if (round >= ROUNDS) {
            setRunning(false);
            success();
            bump('breath');
            Alert.alert('Tamamlandı 🌿', `${ROUNDS} tur nefes egzersizini bitirdin.`, [{ text: 'Tamam', onPress: () => router.back() }]);
          } else {
            setRound((r) => r + 1);
            setPhaseIdx(0);
          }
        } else setPhaseIdx(next);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, phaseIdx, round]);

  const start = () => {
    setRound(1);
    setPhaseIdx(0);
    scale.setValue(0.55);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    scale.stopAnimation();
    scale.setValue(0.55);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
        {(Object.keys(PATTERNS) as Array<'box' | 'relax'>).map((k) => (
          <Chip key={k} label={PATTERNS[k].name} active={key === k} onPress={() => !running && setKey(k)} />
        ))}
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <Animated.View style={{ width: 240, height: 240, borderRadius: 120, backgroundColor: t.primary + '55', borderWidth: 4, borderColor: t.primary, transform: [{ scale }] }} />
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Txt size={22} weight="800">{running ? phases[phaseIdx].label : 'Hazır mısın?'}</Txt>
          {running ? <Txt size={40} weight="800">{left}</Txt> : null}
        </View>
      </View>
      <Txt center dim>{running ? `Tur ${round}/${ROUNDS}` : `${ROUNDS} tur · yaklaşık ${Math.round((phases.reduce((a, p) => a + p.secs, 0) * ROUNDS) / 60)} dk`}</Txt>
      <Btn label={running ? 'Durdur' : 'Başla'} kind={running ? 'ghost' : 'primary'} onPress={running ? stop : start} style={{ marginTop: 20 }} />
    </Screen>
  );
}
