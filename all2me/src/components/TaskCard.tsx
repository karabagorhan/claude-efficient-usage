/**
 * Görev kartı (Rutin listesi, Harekete Geç vb.).
 * <TaskCard habit={h} done={done} progress={p} streak={3} points={12} onPress={...} onLongPress={...} />
 * Alt bilgi (overline) önceliği: overline prop > sayaç "p/target" > zaman dilimi etiketi.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Habit } from '../engine/types';
import { useT } from '../i18n';
import { radius, useTheme } from '../theme';
import { Bar, Row, Txt, tap } from './ui';

export function TaskCard({
  habit,
  done,
  progress,
  streak,
  points,
  overline,
  masked,
  readOnly,
  onPress,
  onLongPress,
  onToggle,
  style,
}: {
  habit: Pick<Habit, 'title' | 'icon' | 'pastel' | 'kind' | 'target' | 'slot'> & Partial<Pick<Habit, 'id' | 'link'>>;
  done: boolean;
  /** Sayaç/süre ilerlemesi (kind !== 'check' iken gösterilir) */
  progress?: number;
  /** Görev serisi (gün). 2+ ise 🔥 gösterilir */
  streak?: number;
  /** Kazanılan puan (tamamlandıysa "+n") */
  points?: number;
  overline?: string;
  /** Partnerin özel görevi: başlık gizlenir */
  masked?: boolean;
  readOnly?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Onay dairesine dokunma (verilmezse onPress kullanılır) */
  onToggle?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const tr = useT();
  const target = habit.target ?? 1;
  const showProgress = habit.kind !== 'check' && target > 0;
  const sub =
    overline ??
    (showProgress ? tr('task.progress', { done: Math.min(progress ?? 0, target), target }) : tr(`task.slot.${habit.slot ?? 'anytime'}`));
  const bg = t.pastel[habit.pastel ?? 'blue'];
  return (
    <Pressable
      disabled={readOnly && !onLongPress}
      onPress={readOnly ? undefined : onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        { backgroundColor: bg, borderRadius: radius.lg, marginBottom: 12, opacity: done ? 0.75 : 1 },
        pressed && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      <Row style={{ minHeight: 76, paddingHorizontal: 18, paddingVertical: 14 }} gap={14}>
        <Text style={{ fontSize: 36, width: 44, textAlign: 'center' }}>{masked ? '🔒' : habit.icon}</Text>
        <View style={{ flex: 1 }}>
          <Row gap={8}>
            <Txt variant="small" color={t.onPastel} numberOfLines={1} style={{ flexShrink: 1 }}>
              {sub}
            </Txt>
            {streak && streak >= 2 ? (
              <Txt variant="caption" color={t.onPastel}>
                🔥 {streak}
              </Txt>
            ) : null}
            {done && points ? (
              <Txt variant="caption" weight="800" color={t.onPastel}>
                +{points}
              </Txt>
            ) : null}
          </Row>
          <Txt
            variant="h3"
            color={t.onPastel}
            numberOfLines={2}
            style={done ? { textDecorationLine: 'line-through' } : undefined}
          >
            {masked ? tr('task.privateTask') : habit.title}
          </Txt>
          {showProgress && !done ? (
            <View style={{ marginTop: 8 }}>
              <Bar value={(progress ?? 0) / target} color={t.onPastel} bg={t.isDark ? '#ffffff22' : '#ffffff99'} height={6} />
            </View>
          ) : null}
        </View>
        <Pressable
          hitSlop={10}
          disabled={readOnly}
          onPress={() => {
            tap();
            (onToggle ?? onPress)?.();
          }}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            borderWidth: 2,
            borderColor: t.onPastel,
            backgroundColor: done ? t.onPastel : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? <Ionicons name="checkmark" size={20} color={bg} /> : null}
        </Pressable>
      </Row>
    </Pressable>
  );
}

export default TaskCard;
