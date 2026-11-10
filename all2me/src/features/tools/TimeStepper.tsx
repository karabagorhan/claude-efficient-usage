import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { fmtTime, useLang } from '../../i18n';
import { Txt, tap } from '../../components/ui';
import { radius, useTheme } from '../../theme';

const pad = (n: number) => String(n).padStart(2, '0');
const parse = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
};

function Arrow({ up, onPress }: { up: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.5 : 1 })}
    >
      <Ionicons name={up ? 'chevron-up' : 'chevron-down'} size={22} color={t.textDim} />
    </Pressable>
  );
}

/** Saat seçici: saat ve dakika için yukarı/aşağı oklar (dakika 5'er). value 'HH:MM'. */
export function TimeStepper({ value, onChange, step = 5 }: { value: string; onChange: (v: string) => void; step?: number }) {
  const t = useTheme();
  const lang = useLang();
  const { h, m } = parse(value);
  const setH = (d: number) => onChange(`${pad((h + d + 24) % 24)}:${pad(m)}`);
  const setM = (d: number) => {
    let nm = m + d * step;
    let nh = h;
    if (nm >= 60) {
      nm -= 60;
      nh = (nh + 1) % 24;
    } else if (nm < 0) {
      nm += 60;
      nh = (nh + 23) % 24;
    }
    onChange(`${pad(nh)}:${pad(nm)}`);
  };
  const box = { backgroundColor: t.cardAlt, borderRadius: radius.md, minWidth: 64, paddingVertical: 8, alignItems: 'center' as const };
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ alignItems: 'center' }}>
          <Arrow up onPress={() => setH(1)} />
          <View style={box}>
            <Txt variant="h1">{pad(h)}</Txt>
          </View>
          <Arrow up={false} onPress={() => setH(-1)} />
        </View>
        <Txt variant="h1">:</Txt>
        <View style={{ alignItems: 'center' }}>
          <Arrow up onPress={() => setM(1)} />
          <View style={box}>
            <Txt variant="h1">{pad(m)}</Txt>
          </View>
          <Arrow up={false} onPress={() => setM(-1)} />
        </View>
      </View>
      {lang === 'en' ? (
        <Txt variant="caption" dim>
          {fmtTime(value, lang)}
        </Txt>
      ) : null}
    </View>
  );
}
