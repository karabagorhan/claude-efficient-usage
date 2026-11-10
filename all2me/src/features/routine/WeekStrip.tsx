/** Rutin: haftalık tarih şeridi (gün seçimi). */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { addDays } from '../../engine/dates';
import { DAYS_SHORT, useLang, useT } from '../../i18n';
import { parseDayKey } from '../../engine/dates';
import { radius, useTheme } from '../../theme';
import { Txt, tap } from '../../components/ui';

export function WeekStrip({
  weekStart,
  selected,
  today,
  active,
  onSelect,
  onShift,
}: {
  weekStart: string;
  selected: string;
  today: string;
  /** Tamamlaması olan günler */
  active: Set<string>;
  onSelect: (day: string) => void;
  onShift: (weeks: number) => void;
}) {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Pressable accessibilityLabel={tr('routine.prevWeek')} hitSlop={8} onPress={() => { tap(); onShift(-1); }} style={{ padding: 2 }}>
        <Ionicons name="chevron-back" size={18} color={t.textDim} />
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
        {days.map((d, i) => {
          const sel = d === selected;
          const isToday = d === today;
          const fg = sel ? t.onPrimary : t.text;
          return (
            <Pressable
              key={d}
              onPress={() => { tap(); onSelect(d); }}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: radius.md,
                backgroundColor: sel ? t.primary : t.card,
                borderWidth: isToday && !sel ? 1.5 : 1,
                borderColor: isToday ? t.primary : t.border,
              }}
            >
              <Txt variant="caption" color={sel ? t.onPrimary : undefined} dim={!sel} style={{ opacity: sel ? 0.8 : 1 }}>
                {DAYS_SHORT[lang][i]}
              </Txt>
              <Txt variant="bodyBold" color={fg} style={{ marginTop: 2 }}>
                {parseDayKey(d).getDate()}
              </Txt>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 4,
                  backgroundColor: active.has(d) ? (sel ? t.onPrimary : t.success) : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityLabel={tr('routine.nextWeek')} hitSlop={8} onPress={() => { tap(); onShift(1); }} style={{ padding: 2 }}>
        <Ionicons name="chevron-forward" size={18} color={t.textDim} />
      </Pressable>
    </View>
  );
}
