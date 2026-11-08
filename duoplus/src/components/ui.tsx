import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, useTheme } from '../theme';
import { useStore } from '../store/store';

export const tap = () => {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};
export const success = () => {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

export function Screen({
  children,
  scroll = true,
  padBottom = 24,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padBottom?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const body = { paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: padBottom };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: t.bg }, body, style]}>{children}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[body, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Txt({
  children,
  size = 15,
  weight = '400',
  dim,
  color,
  style,
  numberOfLines,
  center,
}: {
  children: React.ReactNode;
  size?: number;
  weight?: TextStyle['fontWeight'];
  dim?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  center?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontSize: size, fontWeight: weight, color: color ?? (dim ? t.textDim : t.text) }, center && { textAlign: 'center' }, style]}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.card,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  disabled,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger' | 'soft';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? t.danger : kind === 'soft' ? t.primarySoft : 'transparent';
  const fg = kind === 'primary' || kind === 'danger' ? '#fff' : kind === 'soft' ? t.primary : t.text;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: small ? 8 : 14,
          paddingHorizontal: small ? 12 : 18,
          borderRadius: radius.md,
          alignItems: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          borderWidth: kind === 'ghost' ? 1 : 0,
          borderColor: t.border,
        },
        style,
      ]}
    >
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
  emoji,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  emoji?: string;
}) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={{
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? c : t.cardAlt,
        marginRight: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {emoji ? <Text style={{ marginRight: 5 }}>{emoji}</Text> : null}
      <Text style={{ color: active ? '#fff' : t.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.cardAlt, borderRadius: radius.md, padding: 3 }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              tap();
              onChange(o.id);
            }}
            style={{ flex: 1, paddingVertical: 9, borderRadius: radius.md - 3, backgroundColor: on ? t.card : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontWeight: on ? '700' : '500', color: on ? t.text : t.textDim }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Bar({ value, color, height = 8, bg }: { value: number; color: string; height?: number; bg?: string }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: Math.max(0, Math.min(1, value)), duration: 350, useNativeDriver: false }).start();
  }, [value, v]);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: bg ?? t.cardAlt, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height,
          borderRadius: height,
          backgroundColor: color,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

export function Avatar({ emoji, color, size = 44 }: { emoji: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33', borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }}>
      <Txt size={13} weight="700" dim style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {children}
      </Txt>
      {right}
    </View>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const t = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Txt size={13} dim weight="600" style={{ marginBottom: 6 }}>{label}</Txt> : null}
      <TextInput
        placeholderTextColor={t.textDim}
        style={[{ backgroundColor: t.card, color: t.text, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 }, style]}
        {...rest}
      />
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

/** Rozet / şampiyonluk bildirimleri için üstte kayan toast. */
export function ToastHost() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useStore((s) => s.toasts[0]);
  const pop = useStore((s) => s.popToast);
  const y = useRef(new Animated.Value(-120)).current;
  useEffect(() => {
    if (!toast) return;
    success();
    Animated.sequence([
      Animated.timing(y, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(y, { toValue: -120, duration: 250, useNativeDriver: true }),
    ]).start(() => pop());
  }, [toast, y, pop]);
  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + 6, left: 16, right: 16, transform: [{ translateY: y }], backgroundColor: t.text, borderRadius: radius.md, padding: 14 }}
    >
      <Text style={{ color: t.bg, fontWeight: '700', textAlign: 'center' }}>{toast}</Text>
    </Animated.View>
  );
}
