import React from 'react';
import { Text, View } from 'react-native';
import { MOOD_COLORS, alpha } from '../../theme';

export const MOOD_EMOJI = ['😞', '🙁', '😐', '🙂', '😄'] as const;
export const moodColor = (level: number) => MOOD_COLORS[Math.max(1, Math.min(5, level)) - 1];

/** Renkli daire içinde ruh hali yüzü (level 1..5). */
export function MoodFace({ level, size = 44, ring }: { level: number; size?: number; ring?: string }) {
  const c = moodColor(level);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: alpha(c, 0.9),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: ring,
      }}
    >
      <Text style={{ fontSize: size * 0.56 }}>{MOOD_EMOJI[Math.max(1, Math.min(5, level)) - 1]}</Text>
    </View>
  );
}
