import React from 'react';
import { View } from 'react-native';
import { Txt } from '../../components/ui';
import { alpha, radius, useTheme } from '../../theme';
import { MEAL_KIND_EMOJI, MEAL_SLOTS, type MealKind, type MealSlot } from './types';

export interface DayBar {
  label: string;
  value: number;
  /** o günün limiti (işaret çizgisi) */
  limit?: number;
  /** bugün */
  highlight?: boolean;
}

/** Günlük çubuklar; her çubukta o günün limiti kısa bir çizgiyle gösterilir. Aşan çubuk mercan renkli. */
export function DayBars({ data, color, over, height = 130, showLabels = true }: { data: DayBar[]; color: string; over: string; height?: number; showLabels?: boolean }) {
  const t = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.limit ?? 0))) * 1.15;
  const gap = data.length > 14 ? 2 : 6;
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap }}>
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(5, (d.value / max) * height) : 3;
          const isOver = d.limit !== undefined && d.value > d.limit;
          return (
            <View key={i} style={{ flex: 1, height, justifyContent: 'flex-end', alignItems: 'center' }}>
              {d.limit !== undefined ? (
                <View style={{ position: 'absolute', left: -1, right: -1, bottom: (d.limit / max) * height, height: 2, backgroundColor: t.textFaint, borderRadius: 1 }} />
              ) : null}
              <View
                style={{
                  width: '100%',
                  height: h,
                  borderRadius: data.length > 14 ? 3 : radius.xs,
                  backgroundColor: d.value === 0 ? t.cardAlt : isOver ? over : d.highlight ? color : alpha(color, 0.6),
                }}
              />
            </View>
          );
        })}
      </View>
      {showLabels ? (
        <View style={{ flexDirection: 'row', gap, marginTop: 6 }}>
          {data.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              {data.length <= 14 || i % 5 === 0 ? (
                <Txt variant="caption" dim={!d.highlight} weight={d.highlight ? '700' : undefined} numberOfLines={1}>
                  {d.label}
                </Txt>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** 24 saatlik mini histogram; en yüksek saatler vurgulanır. */
export function HourBars({ hist, top, color }: { hist: number[]; top: number[]; color: string }) {
  const t = useTheme();
  const max = Math.max(1, ...hist);
  return (
    <View>
      <View style={{ height: 70, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {hist.map((c, h) => (
          <View key={h} style={{ flex: 1, height: c > 0 ? Math.max(5, (c / max) * 70) : 3, borderRadius: 2, backgroundColor: c === 0 ? t.cardAlt : top.includes(h) ? color : alpha(color, 0.45) }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {['00', '06', '12', '18', '23'].map((x) => (
          <Txt key={x} variant="caption" dim>
            {x}
          </Txt>
        ))}
      </View>
    </View>
  );
}

/** Haftalık öğün ızgarası: 7 gün (sütun) × 4 öğün (satır). */
export function MealWeekGrid({
  grid,
  dayLabels,
  slotLabels,
  todayKey,
}: {
  grid: Array<{ day: string; cells: Partial<Record<MealSlot, MealKind>> }>;
  dayLabels: string[];
  slotLabels: Record<MealSlot, string>;
  todayKey: string;
}) {
  const t = useTheme();
  const colorOf = (k?: MealKind): string => {
    switch (k) {
      case 'home':
        return t.pastel.green;
      case 'healthy':
        return t.pastel.mint;
      case 'fast':
        return t.pastel.peach;
      case 'skipped':
        return t.cardAlt;
      default:
        return 'transparent';
    }
  };
  return (
    <View>
      <View style={{ flexDirection: 'row', marginLeft: 0, gap: 4, paddingLeft: 30 }}>
        {grid.map((g, i) => (
          <View key={g.day} style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="caption" dim={g.day !== todayKey} weight={g.day === todayKey ? '800' : undefined}>
              {dayLabels[i]}
            </Txt>
          </View>
        ))}
      </View>
      {MEAL_SLOTS.map((slot) => (
        <View key={slot} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <View style={{ width: 26 }} accessibilityLabel={slotLabels[slot]}>
            <Txt size={14}>{slot === 'breakfast' ? '🌅' : slot === 'lunch' ? '☀️' : slot === 'dinner' ? '🌙' : '🍎'}</Txt>
          </View>
          {grid.map((g) => {
            const k = g.cells[slot];
            return (
              <View
                key={g.day}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colorOf(k),
                  borderWidth: k ? 0 : 1.5,
                  borderStyle: 'dashed',
                  borderColor: t.border,
                }}
              >
                {k ? <Txt size={15}>{MEAL_KIND_EMOJI[k]}</Txt> : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
