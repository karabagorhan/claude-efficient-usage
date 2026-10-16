import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { Analysis, compact, pad } from './lib';
import { Theme } from './theme';

export function Chip({ label, active, color, onPress, t }: { label: string; active: boolean; color?: string; onPress: () => void; t: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        s.chip,
        { backgroundColor: active ? t.accent : t.bg, borderColor: active ? t.accent : t.line, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {color ? <View style={[s.chipDot, { backgroundColor: color }]} /> : null}
      <Text style={{ color: active ? t.accentFg : t.fg, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ kind, label, t }: { kind: 'up' | 'down' | 'flat'; label: string; t: Theme }) {
  const bg = kind === 'up' ? t.warnSoft : kind === 'down' ? t.goodSoft : t.bg;
  const fg = kind === 'up' ? t.warn : kind === 'down' ? t.good : t.muted;
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', t, style, disabled }: {
  label: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger' | 'dark'; t: Theme; style?: ViewStyle; disabled?: boolean;
}) {
  const bg = kind === 'primary' ? t.accent : kind === 'danger' ? t.warn : kind === 'dark' ? t.fg : t.surface;
  const fg = kind === 'primary' ? t.accentFg : kind === 'danger' ? t.surface : kind === 'dark' ? t.bg : t.fg;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: kind === 'ghost' ? t.line : bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={{ color: fg, fontWeight: '600', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Label({ children, t, color }: { children: string; t: Theme; color?: string }) {
  return <Text style={[s.label, { color: color ?? t.muted }]}>{children.toLocaleUpperCase('tr-TR')}</Text>;
}

/** Seçili ayın günlük harcama çubukları; ortalama ve günlük bütçe kesikli çizgi. */
export function DailyChart({ a, ym, budget, selected, onSelect, t }: {
  a: Analysis; ym: string; budget: number; selected: string | null; onSelect: (day: string) => void; t: Theme;
}) {
  const [w, setW] = useState(0);
  const H = 160, L = 34, R = 4, T = 8, B = 20;
  const iw = Math.max(0, w - L - R), ih = H - T - B, n = a.dim;
  const budgetDay = budget ? budget / a.dim : 0;
  const vals = Array.from({ length: n }, (_, i) => a.perDay[`${ym}-${pad(i + 1)}`] || 0);
  const raw = Math.max(...vals, a.avg, budgetDay, 1) * 1.05;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  const max = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  const y = (v: number) => T + ih - (v / max) * ih;
  const slot = iw / n, bw = Math.max(2, slot * 0.68);
  const todayD = a.isCur ? new Date().getDate() : 0;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
      {w > 0 && (
        <>
          <Svg width={w} height={H}>
            {[0, 0.5, 1].map((f) => (
              <Line key={f} x1={L} x2={w - R} y1={y(max * f)} y2={y(max * f)} stroke={t.line} strokeWidth={1} />
            ))}
            {[0, 0.5, 1].map((f) => (
              <SvgText key={'l' + f} x={L - 6} y={y(max * f) + 3} fontSize={10} fill={t.muted} textAnchor="end">
                {compact(max * f)}
              </SvgText>
            ))}
            {vals.map((v, i) => {
              if (!v) return null;
              const d = i + 1;
              const h = Math.max(2, (v / max) * ih);
              const day = `${ym}-${pad(d)}`;
              const fill = selected === day ? t.fg : budgetDay && v > budgetDay ? t.warn : d === todayD ? t.accent : t.accentSoft;
              return <Rect key={d} x={L + i * slot + (slot - bw) / 2} y={T + ih - h} width={bw} height={h} rx={1.5} fill={fill} />;
            })}
            {vals.map((_, i) => {
              const d = i + 1;
              if (!(d === 1 || (d % 5 === 0 && n - d >= 2) || d === n)) return null;
              return (
                <SvgText key={'x' + d} x={L + i * slot + slot / 2} y={H - 5} fontSize={10} fill={t.muted} textAnchor="middle">
                  {String(d)}
                </SvgText>
              );
            })}
            {a.avg > 0 && <Line x1={L} x2={w - R} y1={y(a.avg)} y2={y(a.avg)} stroke={t.muted} strokeWidth={1.5} strokeDasharray="4 3" />}
            {budgetDay > 0 && <Line x1={L} x2={w - R} y1={y(budgetDay)} y2={y(budgetDay)} stroke={t.warn} strokeWidth={1.5} strokeDasharray="4 3" />}
          </Svg>
          <View style={[StyleSheet.absoluteFill, { left: L, right: R, flexDirection: 'row' }]}>
            {vals.map((_, i) => (
              <Pressable
                key={i}
                style={{ flex: 1 }}
                onPress={() => onSelect(`${ym}-${pad(i + 1)}`)}
                accessibilityLabel={`${i + 1}. gün`}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export type IconName = ComponentProps<typeof Ionicons>['name'];
export { Ionicons };

export type MenuItem = { key: string; label: string; icon: IconName; hint?: string };

/** Sağdan kayarak açılan menü. */
export function SideMenu({ open, onClose, items, current, onSelect, top, bottom, t }: {
  open: boolean; onClose: () => void; items: MenuItem[]; current: string; onSelect: (key: string) => void; top: number; bottom: number; t: Theme;
}) {
  const x = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(x, { toValue: 1, duration: 180, useNativeDriver: true }).start(({ finished }) => finished && setMounted(false));
    }
  }, [open, x]);
  if (!mounted) return null;
  const W = 290;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.scrim, opacity: x.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Menüyü kapat" />
      </Animated.View>
      <Animated.View
        style={[s.menu, { width: W, backgroundColor: t.surface, borderColor: t.line, paddingTop: top + 16, paddingBottom: bottom + 16,
          transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, W + 20] }) }] }]}
      >
        <View style={s.menuHead}>
          <Text style={{ color: t.fg, fontSize: 20, fontWeight: '800' }}>Harcama Defteri</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Kapat">
            <Ionicons name="close" size={26} color={t.muted} />
          </Pressable>
        </View>
        {items.map((it) => {
          const active = it.key === current;
          return (
            <Pressable
              key={it.key}
              onPress={() => onSelect(it.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [s.menuItem, { backgroundColor: active ? t.accentSoft : pressed ? t.bg : 'transparent' }]}
            >
              <Ionicons name={it.icon} size={22} color={active ? t.accent : t.fg} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.fg, fontSize: 17, fontWeight: active ? '700' : '500' }}>{it.label}</Text>
                {it.hint ? <Text style={{ color: t.muted, fontSize: 13 }}>{it.hint}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

/** Son aylar için toplam çubukları (raporlar). */
export function MonthBars({ data, selected, onSelect, t }: {
  data: { ym: string; label: string; total: number }[]; selected: string; onSelect: (ym: string) => void; t: Theme;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 150 }}>
      {data.map((d) => {
        const on = d.ym === selected;
        return (
          <Pressable key={d.ym} onPress={() => onSelect(d.ym)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}
            accessibilityLabel={`${d.label}: ${compact(d.total)}`}>
            <Text style={{ fontSize: 11, color: on ? t.fg : t.muted, fontWeight: on ? '700' : '400' }}>{d.total ? compact(d.total) : ''}</Text>
            <View style={{ width: '100%', maxWidth: 34, height: d.total ? Math.max(4, (d.total / max) * 100) : 3, borderRadius: 6, backgroundColor: on ? t.accent : t.accentSoft }} />
            <Text style={{ fontSize: 12, color: on ? t.fg : t.muted, fontWeight: on ? '700' : '400' }}>{d.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  menu: { position: 'absolute', top: 0, bottom: 0, right: 0, borderLeftWidth: 1, paddingHorizontal: 12, gap: 4, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  menuHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  pill: { alignSelf: 'flex-start', borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8 },
  btn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1 },
  label: { fontSize: 12, letterSpacing: 0.8, fontWeight: '600' },
});
