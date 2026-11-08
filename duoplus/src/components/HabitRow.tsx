import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CONFIG } from '../engine/config';
import type { Completion, Habit } from '../engine/types';
import { useTheme } from '../theme';
import { Bar, success, tap, Txt } from './ui';

const DIFF_LABEL: Record<string, string> = { mini: 'Mini', easy: 'Kolay', medium: 'Orta', hard: 'Zor', epic: 'Efsane' };

export function HabitRow({
  habit,
  completion,
  progress,
  streak,
  weekCount,
  readOnly,
  onComplete,
  onUndo,
  onStep,
  dayKey,
  maskPrivate,
}: {
  habit: Habit;
  completion?: Completion;
  progress: number;
  streak: number;
  /** kotalı görevlerde bu hafta kaç kez yapıldı */
  weekCount?: number;
  readOnly?: boolean;
  onComplete?: () => void;
  onUndo?: () => void;
  onStep?: () => void;
  dayKey: string;
  maskPrivate?: boolean;
}) {
  const t = useTheme();
  const done = Boolean(completion);
  const masked = maskPrivate && habit.isPrivate;
  const title = masked ? 'Özel görev' : habit.title;
  const icon = masked ? '🔒' : habit.icon;
  const color = masked ? t.textDim : habit.color;
  const base = CONFIG.basePoints[habit.difficulty];

  const sub: string[] = [`${DIFF_LABEL[habit.difficulty]} · ${base} SP`];
  if (habit.schedule.weeklyQuota) sub.push(`Hafta ${weekCount ?? 0}/${habit.schedule.weeklyQuota}`);
  if (habit.kind === 'counter' && habit.target) sub.push(`${progress}/${habit.target}`);
  if (habit.kind === 'timer' && habit.target) sub.push(`${habit.target} dk`);
  if (habit.together && !masked) sub.push('💞 Birlikte');
  if (habit.reminderTime && !masked) sub.push(`⏰ ${habit.reminderTime}`);

  const ratio = habit.kind === 'counter' && habit.target ? Math.min(1, progress / habit.target) : done ? 1 : 0;

  const onPressMain = () => {
    if (readOnly || masked) return;
    if (done) return onUndo?.();
    if (habit.kind === 'counter') return onStep?.();
    if (habit.kind === 'timer') {
      return router.push({ pathname: '/focus', params: { habitId: habit.id, day: dayKey } });
    }
    success();
    onComplete?.();
  };

  return (
    <Pressable
      onPress={onPressMain}
      onLongPress={() => {
        if (!readOnly && !masked) {
          tap();
          router.push({ pathname: '/habit/[id]', params: { id: habit.id } });
        }
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.card,
        borderRadius: 18,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: done ? color + '66' : t.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color + '26', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Txt weight="700" style={done ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined} numberOfLines={1}>
          {title}
        </Txt>
        {!masked ? <Txt size={12} dim numberOfLines={1} style={{ marginTop: 2 }}>{sub.join(' · ')}</Txt> : null}
        {habit.kind === 'counter' && !done && !masked ? (
          <View style={{ marginTop: 6 }}>
            <Bar value={ratio} color={color} height={5} />
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
        {streak >= 2 ? <Txt size={12} weight="700" color={t.warn}>🔥 {streak}</Txt> : null}
        {done ? (
          <Txt size={13} weight="800" color={t.success}>+{completion!.points}</Txt>
        ) : null}
        <View
          style={{
            marginTop: 2,
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: done ? t.success : 'transparent',
            borderWidth: done ? 0 : 2,
            borderColor: t.border,
          }}
        >
          {done ? (
            <Ionicons name="checkmark" size={18} color="#fff" />
          ) : habit.kind === 'timer' ? (
            <Ionicons name="play" size={14} color={t.textDim} />
          ) : habit.kind === 'counter' ? (
            <Ionicons name="add" size={18} color={t.textDim} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
