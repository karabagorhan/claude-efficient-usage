/**
 * Ortak arayüz parçaları. İmzalar ve örnekler: docs/CONTRACTS.md §5.
 * Bu dosyada sabit kullanıcı metni yok; etiketler çağırandan (t(...)) gelir.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { BUTTON_H, GUTTER, radius, type, useTheme, type PastelKey, type TypeVariant } from '../theme';
import { Mascot, type MascotMood } from './Mascot';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------- Haptik ----------
const safe = (fn: () => Promise<unknown>) => {
  if (Platform.OS === 'web') return;
  try {
    void fn().catch(() => {});
  } catch {}
};
export const tap = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const press = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const success = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warn = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
export const haptics = { tap, press, success, warn };

// ---------- Düzen ----------
export function Screen({
  children,
  scroll = true,
  padBottom = 32,
  insetTop = true,
  bg,
  header,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padBottom?: number;
  /** Üst güvenli alan boşluğu (modal sayfalarda false yapılabilir) */
  insetTop?: boolean;
  /** Zemin rengi; varsayılan tema bg. GradientScreen içinde 'transparent' ver. */
  bg?: string;
  /** Kaydırılmayan üst bölüm (ör. <Header/>) */
  header?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const top = insetTop ? insets.top : 0;
  const body: ViewStyle = { paddingHorizontal: GUTTER, paddingBottom: padBottom + insets.bottom };
  return (
    <View style={[{ flex: 1, backgroundColor: bg ?? t.bg, paddingTop: top }, style]}>
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[body, { paddingTop: header ? 4 : 8 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, body, { paddingTop: header ? 4 : 8 }, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

export function Row({
  children,
  style,
  gap,
  between,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
  /** justifyContent: space-between */
  between?: boolean;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap, justifyContent: between ? 'space-between' : undefined }, style]}>
      {children}
    </View>
  );
}

export const Spacer = ({ h = 12, w }: { h?: number; w?: number }) => <View style={{ height: h, width: w }} />;

// ---------- Metin ----------
export function Txt({
  children,
  variant = 'body',
  size,
  weight,
  dim,
  faint,
  color,
  center,
  numberOfLines,
  role,
  style,
}: {
  children: React.ReactNode;
  variant?: TypeVariant;
  size?: number;
  weight?: TextStyle['fontWeight'];
  dim?: boolean;
  faint?: boolean;
  color?: string;
  center?: boolean;
  numberOfLines?: number;
  /** 'header': ekran okuyucuya başlık olarak bildirilir */
  role?: 'header';
  style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  const v = type[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      accessibilityRole={role}
      style={[
        v,
        size ? { fontSize: size, lineHeight: Math.round(size * 1.3) } : null,
        weight ? { fontWeight: weight } : null,
        { color: color ?? (faint ? t.textFaint : dim ? t.textDim : t.text) },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ---------- Butonlar ----------
export function PillButton({
  label,
  onPress,
  kind = 'primary',
  arrow,
  icon,
  disabled,
  loading,
  small,
  color,
  textColor,
  style,
}: {
  label: string;
  onPress: () => void;
  /** primary: siyah dolu · outline: beyaz zemin + 1.5px çerçeve · ghost: zeminsiz */
  kind?: 'primary' | 'outline' | 'ghost';
  /** Sağda ok (›) */
  arrow?: boolean;
  /** Solda Ionicons ikonu */
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  /** primary zemin rengini değiştir (ör. t.coral) */
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = kind === 'primary' ? (color ?? t.primary) : kind === 'outline' ? t.card : 'transparent';
  const fg = textColor ?? (kind === 'primary' ? t.onPrimary : t.text);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          height: small ? 40 : BUTTON_H,
          paddingHorizontal: small ? 16 : 24,
          borderRadius: radius.pill,
          backgroundColor: bg,
          borderWidth: kind === 'outline' ? 1.5 : 0,
          borderColor: t.text,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 20} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 14 : 17 }}>{label}</Text>
      {arrow ? <Ionicons name="arrow-forward" size={small ? 16 : 20} color={fg} /> : null}
    </Pressable>
  );
}

/** Yuvarlak ikon butonu (başlık aksiyonları için). */
export function IconButton({
  icon,
  onPress,
  color,
  bg,
  size = 24,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  bg?: string;
  size?: number;
  /** erişilebilirlik etiketi */
  label?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        width: size + 16,
        height: size + 16,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg ?? 'transparent',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={size} color={color ?? t.text} />
    </Pressable>
  );
}

// ---------- Başlık ----------
export function Header({
  title,
  subtitle,
  left = 'back',
  onLeft,
  right,
  color,
  large,
  style,
}: {
  title?: string;
  subtitle?: string;
  /** 'back' (‹), 'close' (✕) ya da 'none' */
  left?: 'back' | 'close' | 'none';
  /** Varsayılan: router.back() (geçmiş yoksa '/') */
  onLeft?: () => void;
  /** Sağ aksiyonlar (ör. <IconButton/>'lar) */
  right?: React.ReactNode;
  /** Yazı/ikon rengi (gradyan ekranlarda '#fff') */
  color?: string;
  /** Büyük ortalanmış başlık yerine sola hizalı büyük başlık */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const tr = useT();
  const c = color ?? t.text;
  const goBack = onLeft ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={[{ paddingHorizontal: GUTTER - 8, paddingVertical: 6 }, style]}>
      <Row between style={{ minHeight: 48 }}>
        <View style={{ width: 88, alignItems: 'flex-start' }}>
          {left !== 'none' ? <IconButton
              icon={left === 'close' ? 'close' : 'chevron-back'}
              color={c}
              size={26}
              label={tr(left === 'close' ? 'common.btn.close' : 'common.btn.back')}
              onPress={goBack}
            /> : null}
        </View>
        {!large && title ? (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="h3" color={c} numberOfLines={1} role="header">
              {title}
            </Txt>
            {subtitle ? (
              <Txt variant="caption" color={color} dim={!color} numberOfLines={1}>
                {subtitle}
              </Txt>
            ) : null}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Row style={{ width: 88, justifyContent: 'flex-end' }}>{right}</Row>
      </Row>
      {large && title ? (
        <View style={{ paddingHorizontal: 8, marginTop: 4 }}>
          <Txt variant="h1" color={c}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt color={color} dim={!color}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function SectionHeader({
  title,
  onSeeAll,
  seeAllLabel,
  style,
}: {
  title: string;
  /** Verilirse sağda "Tümü ›" görünür */
  onSeeAll?: () => void;
  seeAllLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const tr = useT();
  return (
    <Row between style={[{ marginTop: 24, marginBottom: 12 }, style]}>
      <Txt variant="h2" style={{ flex: 1 }} numberOfLines={2} role="header">
        {title}
      </Txt>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title}: ${seeAllLabel ?? tr('common.btn.seeAll')}`}>
          <Row gap={2}>
            <Txt variant="bodyBold">{seeAllLabel ?? tr('common.btn.seeAll')}</Txt>
            <Ionicons name="chevron-forward" size={18} color={t.text} />
          </Row>
        </Pressable>
      ) : null}
    </Row>
  );
}

// ---------- Kartlar ----------
export function Card({
  children,
  onPress,
  onLongPress,
  bg,
  padding = 16,
  role,
  label,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  bg?: string;
  padding?: number;
  /** Dokunulabilir kart içinde başka düğme yoksa 'button' ver (iç içe düğme erişilebilirlik hatasıdır) */
  role?: 'button';
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const base: ViewStyle = { backgroundColor: bg ?? t.card, borderRadius: radius.lg, padding };
  if (onPress || onLongPress) {
    return (
      <Pressable
        accessibilityRole={role}
        accessibilityLabel={label}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [base, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

/** Referans s10: pastel zemin, solda büyük emoji, üstte küçük bilgi, altta kalın başlık, sağda › veya özel aksesuar. */
export function PastelCard({
  emoji,
  overline,
  title,
  pastel = 'blue',
  bg,
  right = 'chevron',
  onPress,
  onLongPress,
  style,
}: {
  emoji?: string;
  overline?: string;
  title: string;
  pastel?: PastelKey;
  /** pastel yerine doğrudan renk */
  bg?: string;
  /** 'chevron' (›), 'none' ya da özel düğüm (ör. onay dairesi) */
  right?: 'chevron' | 'none' | React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Card
      onPress={onPress}
      onLongPress={onLongPress}
      role={onPress || onLongPress ? 'button' : undefined}
      bg={bg ?? t.pastel[pastel]}
      padding={0}
      style={[{ marginBottom: 12 }, style]}
    >
      <Row style={{ minHeight: 76, paddingHorizontal: 18, paddingVertical: 14 }} gap={14}>
        {emoji ? <Text style={{ fontSize: 36, width: 44, textAlign: 'center' }}>{emoji}</Text> : null}
        <View style={{ flex: 1 }}>
          {overline ? (
            <Txt variant="small" color={t.onPastel} numberOfLines={1}>
              {overline}
            </Txt>
          ) : null}
          <Txt variant="h3" color={t.onPastel} numberOfLines={2}>
            {title}
          </Txt>
        </View>
        {right === 'chevron' ? (
          <Ionicons name="chevron-forward" size={22} color={t.onPastel} />
        ) : right === 'none' ? null : (
          right
        )}
      </Row>
    </Card>
  );
}

/** Referans s05: renkli yuvarlak köşeli kutu + emoji, altında etiket. */
export function IconTile({
  emoji,
  label,
  pastel,
  bg,
  size = 76,
  onPress,
  style,
}: {
  emoji: string;
  label: string;
  pastel?: PastelKey;
  bg?: string;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [{ width: size + 12, alignItems: 'center', opacity: pressed ? 0.8 : 1 }, style]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: bg ?? t.pastel[pastel ?? 'blue'],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
      </View>
      <Txt variant="small" weight="600" center numberOfLines={2} style={{ marginTop: 8 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

// ---------- Seçim ----------
export function Chip({
  label,
  active,
  onPress,
  emoji,
  color,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  emoji?: string;
  /** etkin zemin rengi (varsayılan t.primary) */
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const on = color ?? t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          backgroundColor: active ? on : t.card,
          borderWidth: 1,
          borderColor: active ? on : t.borderInput,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        style,
      ]}
    >
      {emoji ? <Text style={{ fontSize: 15 }}>{emoji}</Text> : null}
      <Text style={{ color: active ? (color ? t.onAccent : t.onPrimary) : t.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: t.cardAlt, borderRadius: radius.pill, padding: 4 }, style]}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onChange(o.id);
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radius.pill,
              backgroundColor: on ? t.card : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: on ? '700' : '500', color: on ? t.text : t.textDim }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Göstergeler ----------
export function Bar({ value, color, height = 8, bg }: { value: number; color?: string; height?: number; bg?: string }) {
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
          backgroundColor: color ?? t.primary,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

export function Avatar({ emoji, color, size = 44 }: { emoji: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + '33',
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

// ---------- Form ----------
export function Field(props: TextInputProps & { label?: string; containerStyle?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const { label, style, containerStyle, ...rest } = props;
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? (
        <Txt variant="small" weight="600" dim style={{ marginBottom: 6 }}>
          {label}
        </Txt>
      ) : null}
      <TextInput
        placeholderTextColor={t.textFaint}
        accessibilityLabel={rest.accessibilityLabel ?? label ?? rest.placeholder}
        style={[
          {
            backgroundColor: t.card,
            color: t.text,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: t.borderInput,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

// ---------- Boş durum ----------
export function EmptyState({
  title,
  body,
  mood = 'happy',
  emoji,
  action,
  style,
}: {
  title: string;
  body?: string;
  /** Maskot ruh hali; emoji verilirse maskot yerine emoji */
  mood?: MascotMood;
  emoji?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }, style]}>
      {emoji ? <Text style={{ fontSize: 64 }}>{emoji}</Text> : <Mascot mood={mood} size={120} />}
      <Txt variant="h3" center style={{ marginTop: 16 }}>
        {title}
      </Txt>
      {body ? (
        <Txt dim center style={{ marginTop: 6 }}>
          {body}
        </Txt>
      ) : null}
      {action ? <PillButton label={action.label} onPress={action.onPress} style={{ marginTop: 20, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}
