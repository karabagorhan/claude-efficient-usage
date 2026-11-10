import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Txt, tap } from '../../components/ui';
import type { ReflectionTopic } from '../../data/reflections';
import { L, useLang } from '../../i18n';
import { radius, useTheme } from '../../theme';

/** Yansıma konusu kartı: renkli kare görsel alanı + başlık + alt başlık. */
export function TopicCard({
  topic,
  onPress,
  width = 290,
}: {
  topic: ReflectionTopic;
  onPress: () => void;
  width?: number;
}) {
  const t = useTheme();
  const lang = useLang();
  const side = 110;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        width,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: side,
          height: side,
          borderRadius: radius.lg,
          backgroundColor: t.pastel[topic.pastel],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 52 }}>{topic.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyBold" numberOfLines={3}>
          {L(topic.title, lang)}
        </Txt>
        <Txt variant="small" dim numberOfLines={3} style={{ marginTop: 4 }}>
          {L(topic.sub, lang)}
        </Txt>
      </View>
    </Pressable>
  );
}
