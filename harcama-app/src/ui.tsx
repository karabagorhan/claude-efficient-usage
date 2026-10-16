import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
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

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  pill: { alignSelf: 'flex-start', borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8 },
  btn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1 },
  label: { fontSize: 12, letterSpacing: 0.8, fontWeight: '600' },
});
