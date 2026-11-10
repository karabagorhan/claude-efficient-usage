/** Özgün alev çizimi (SVG). */
import React from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

export function Flame({ size = 168 }: { size?: number }) {
  const h = size * 1.12;
  return (
    <Svg width={size} height={h} viewBox="0 0 160 180">
      <Defs>
        <LinearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFA02E" />
          <Stop offset="1" stopColor="#F2550A" />
        </LinearGradient>
        <LinearGradient id="fi" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE2B8" />
          <Stop offset="1" stopColor="#FFB867" />
        </LinearGradient>
      </Defs>
      <Path
        d="M82 6 C98 40 152 62 152 120 C152 158 120 176 80 176 C40 176 8 158 8 120 C8 88 32 72 44 52 C50 70 60 76 66 68 C76 50 68 26 82 6 Z"
        fill="url(#fl)"
      />
      <Ellipse cx={80} cy={128} rx={30} ry={38} fill="url(#fi)" />
      <Circle cx={34} cy={34} r={9} fill="#FF8A1F" />
      <Circle cx={120} cy={22} r={4} fill="#FFD28A" />
    </Svg>
  );
}
