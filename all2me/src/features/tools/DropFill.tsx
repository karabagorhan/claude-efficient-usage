import React, { useId } from 'react';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { alpha, useTheme } from '../../theme';
import { useAnimatedNumber } from './useAnimatedNumber';

const DROP = 'M60 8 C60 8 18 62 18 100 a42 42 0 0 0 84 0 C102 62 60 8 60 8 Z';

/** Dolum göstergesi: damla biçimi, su seviyesi animasyonlu (0..1). */
export function DropFill({ value, size = 200, color }: { value: number; size?: number; color?: string }) {
  const t = useTheme();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const level = useAnimatedNumber(Math.max(0, Math.min(1, value)));
  const c = color ?? t.blue;
  const top = 144 - level * 136; // damla alt 142, üst 8
  return (
    <Svg width={size} height={(size * 150) / 120} viewBox="0 0 120 150">
      <Defs>
        <ClipPath id={`clip${id}`}>
          <Path d={DROP} />
        </ClipPath>
      </Defs>
      <Path d={DROP} fill={alpha(c, t.isDark ? 0.22 : 0.18)} />
      <Rect x={0} y={top} width={120} height={150} fill={c} clipPath={`url(#clip${id})`} opacity={0.95} />
      {level > 0.03 && level < 0.98 ? (
        <Path
          d={`M0 ${top} Q15 ${top - 5} 30 ${top} T60 ${top} T90 ${top} T120 ${top} L120 ${top + 8} L0 ${top + 8} Z`}
          fill={alpha('#FFFFFF', 0.25)}
          clipPath={`url(#clip${id})`}
        />
      ) : null}
      <Path d={DROP} fill="none" stroke={c} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}
