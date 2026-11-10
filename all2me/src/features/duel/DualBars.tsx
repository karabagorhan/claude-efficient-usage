import React from 'react';
import { View } from 'react-native';
import { Txt } from '../../components/ui';
import { weekdayOf } from '../../engine/dates';
import { DAYS_SHORT, useLang } from '../../i18n';

/** Gün gün (ve partner varsa çift) çubuk grafik. */
export function DualBars({
  days,
  mine,
  theirs,
  myColor,
  theirColor,
  height = 100,
  labels = true,
}: {
  days: string[];
  mine: Record<string, number>;
  theirs?: Record<string, number> | null;
  myColor: string;
  theirColor?: string;
  height?: number;
  /** Gün adlarını göster (haftalık görünüm) */
  labels?: boolean;
}) {
  const lang = useLang();
  const max = Math.max(10, ...days.map((d) => Math.max(mine[d] ?? 0, theirs?.[d] ?? 0)));
  const dense = days.length > 10;
  const w = dense ? (theirs ? 3 : 5) : theirs ? 10 : 18;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {days.map((d) => (
        <View key={d} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 1 }}>
            <View style={{ width: w, height: Math.max(2, ((mine[d] ?? 0) / max) * height), backgroundColor: myColor, borderRadius: 3 }} />
            {theirs ? (
              <View style={{ width: w, height: Math.max(2, ((theirs[d] ?? 0) / max) * height), backgroundColor: theirColor, borderRadius: 3 }} />
            ) : null}
          </View>
          {labels ? (
            <Txt size={10} dim style={{ marginTop: 4 }}>
              {DAYS_SHORT[lang][weekdayOf(d)].slice(0, 3)}
            </Txt>
          ) : null}
        </View>
      ))}
    </View>
  );
}
