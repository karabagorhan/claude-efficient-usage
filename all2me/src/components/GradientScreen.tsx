/**
 * Gradyan zeminli tam ekran sarmalayıcı.
 * <GradientScreen colors="action" header={<Header left="close" color="#fff" />}>...</GradientScreen>
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GRADIENTS, GUTTER } from '../theme';

type Grad = readonly [string, string, ...string[]];

export function GradientScreen({
  colors,
  children,
  header,
  scroll = false,
  padBottom = 24,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  contentStyle,
}: {
  /** GRADIENTS anahtarı ya da en az 2 renk */
  colors: keyof typeof GRADIENTS | Grad;
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  padBottom?: number;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const cs = (typeof colors === 'string' ? GRADIENTS[colors] : colors) as Grad;
  const body: ViewStyle = { paddingHorizontal: GUTTER, paddingBottom: padBottom + insets.bottom };
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={cs} start={start} end={end} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {header}
        {scroll ? (
          <ScrollView contentContainerStyle={[body, contentStyle]} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, body, contentStyle]}>{children}</View>
        )}
      </View>
    </View>
  );
}

export default GradientScreen;
