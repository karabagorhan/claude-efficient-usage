import React from 'react';
import { View } from 'react-native';
import { Txt } from '../../components/ui';
import { alpha, radius, useTheme } from '../../theme';

export interface BarDatum {
  label: string;
  value: number;
  /** etiket altında küçük metin ya da üstte değer */
  valueLabel?: string;
  highlight?: boolean;
}

/** Basit çubuk grafik (View tabanlı). goal verilirse kesik hedef çizgisi çizer. */
export function BarChart({
  data,
  color,
  goal,
  height = 130,
}: {
  data: BarDatum[];
  color: string;
  goal?: number;
  height?: number;
}) {
  const t = useTheme();
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1) * 1.1;
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        {goal ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: (goal / max) * height,
              borderTopWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: t.textFaint,
            }}
          />
        ) : null}
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(6, (d.value / max) * height) : 0;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
              {d.value > 0 && d.valueLabel ? (
                <Txt variant="caption" dim style={{ marginBottom: 3 }} numberOfLines={1}>
                  {d.valueLabel}
                </Txt>
              ) : null}
              <View
                style={{
                  width: '100%',
                  height: h || 4,
                  borderRadius: radius.xs,
                  backgroundColor: d.value > 0 ? (d.highlight ? color : alpha(color, 0.55)) : t.cardAlt,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="caption" dim={!d.highlight} weight={d.highlight ? '800' : '500'}>
              {d.label}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
