/**
 * SVG halka gösterge (referans s01).
 * <RingGauge value={0.6} size={120} color={t.coral} label="İyi" />  // ortada label veya children
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';
import { Txt } from './ui';

export function RingGauge({
  value,
  size = 120,
  stroke = 12,
  color,
  track,
  label,
  sublabel,
  children,
  style,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sublabel?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? t.cardAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? t.coral}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children ?? (
        <View style={{ alignItems: 'center', paddingHorizontal: stroke }}>
          {label ? (
            <Txt variant="bodyBold" center numberOfLines={1}>
              {label}
            </Txt>
          ) : null}
          {sublabel ? (
            <Txt variant="caption" dim center numberOfLines={1}>
              {sublabel}
            </Txt>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default RingGauge;
