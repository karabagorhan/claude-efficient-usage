/** Özgün "önce / sonra" kompozisyonu: organik bir form çapraz ikiye bölünür; emoji + pastel şekiller. */
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Line, Path, Polygon } from 'react-native-svg';
import { alpha, pastelColor, useTheme } from '../../theme';
import type { QuestionDef } from './questions';

const W = 300;
const H = 280;
const BLOB = 'M40 60 C 70 10, 210 0, 262 50 C 300 90, 296 190, 250 238 C 200 280, 90 276, 46 236 C 4 196, 8 100, 40 60 Z';

const star = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;

export function QuestionArt({ q }: { q: QuestionDef }) {
  const t = useTheme();
  const left = alpha(t.textDim, t.isDark ? 0.3 : 0.2);
  const right = pastelColor(q.pastel, t.isDark);
  const spark = t.isDark ? alpha('#FFFFFF', 0.5) : '#FFFFFF';
  const E = (s: string, size: number, x: number, y: number, o = 1, rot = 0) => (
    <Text key={`${s}${x}${y}`} style={{ position: 'absolute', left: x, top: y, fontSize: size, opacity: o, transform: [{ rotate: `${rot}deg` }] }}>
      {s}
    </Text>
  );
  return (
    <View style={{ width: W, height: H }} accessible={false}>
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        <Defs>
          <ClipPath id="blob">
            <Path d={BLOB} />
          </ClipPath>
        </Defs>
        <Polygon points="0,0 156,0 130,280 0,280" fill={left} clipPath="url(#blob)" />
        <Polygon points="156,0 300,0 300,280 130,280" fill={right} clipPath="url(#blob)" />
        <Line x1="156" y1="0" x2="130" y2="280" stroke={t.bg} strokeWidth={7} clipPath="url(#blob)" />
        <Path d={star(232, 70, 14)} fill={spark} />
        <Path d={star(262, 150, 8)} fill={spark} />
        <Path d={star(200, 226, 10)} fill={spark} />
      </Svg>
      {E(q.before.tag, 34, 34, 24, 0.9)}
      {E(q.after.tag, 34, 214, 2)}
      {E(q.before.main, 84, 28, 100, 0.8, -8)}
      {E(q.after.main, 100, 170, 98, 1, 6)}
      {E(q.before.bits[0], 28, 24, 192, 0.55, -14)}
      {E(q.before.bits[1], 26, 92, 214, 0.55, 10)}
      {E(q.before.bits[2], 26, 78, 62, 0.5, 14)}
      {E(q.after.bits[0], 32, 168, 34, 1, -6)}
      {E(q.after.bits[1], 30, 252, 104, 1, 12)}
      {E(q.after.bits[2], 30, 178, 204, 1, -8)}
    </View>
  );
}
