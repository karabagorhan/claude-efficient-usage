/**
 * All2Me maskotu "Puf": özgün, basit bir bulut karakteri; başında küçük bir yıldız.
 * <Mascot mood="happy" | "cheer" | "sleepy" size={120} />
 */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';

export type MascotMood = 'happy' | 'cheer' | 'sleepy';

export function Mascot({
  mood = 'happy',
  size = 120,
  color = '#D9CCFF',
  shade = '#C3B1FF',
}: {
  mood?: MascotMood;
  size?: number;
  /** gövde rengi */
  color?: string;
  /** alt gölge tonu */
  shade?: string;
}) {
  const ink = '#2B2340';
  const eyes =
    mood === 'sleepy' ? (
      <G stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none">
        <Path d="M43 66 Q48 70 53 66" />
        <Path d="M67 66 Q72 70 77 66" />
      </G>
    ) : (
      <G>
        <Circle cx={48} cy={65} r={mood === 'cheer' ? 5.5 : 5} fill={ink} />
        <Circle cx={72} cy={65} r={mood === 'cheer' ? 5.5 : 5} fill={ink} />
        <Circle cx={49.8} cy={63.2} r={1.7} fill="#fff" />
        <Circle cx={73.8} cy={63.2} r={1.7} fill="#fff" />
      </G>
    );
  const mouth =
    mood === 'cheer' ? (
      <Path d="M52 75 Q60 88 68 75 Z" fill="#E2557B" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
    ) : mood === 'sleepy' ? (
      <Ellipse cx={60} cy={78} rx={3.2} ry={2.6} fill={ink} />
    ) : (
      <Path d="M53 75 Q60 82 67 75" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    );
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* yıldız sapı + yıldız */}
      <Path d="M60 34 Q57 26 60 20" stroke={shade} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path
        d="M60 6 L63.5 13.5 L71.5 14.5 L65.5 20 L67 28 L60 24 L53 28 L54.5 20 L48.5 14.5 L56.5 13.5 Z"
        fill="#FFD34E"
        stroke="#F2B705"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* kollar */}
      {mood === 'cheer' ? (
        <G fill={color}>
          <Ellipse cx={18} cy={50} rx={8} ry={12} transform="rotate(-30 18 50)" />
          <Ellipse cx={102} cy={50} rx={8} ry={12} transform="rotate(30 102 50)" />
        </G>
      ) : (
        <G fill={shade}>
          <Ellipse cx={20} cy={80} rx={7} ry={10} transform="rotate(25 20 80)" />
          <Ellipse cx={100} cy={80} rx={7} ry={10} transform="rotate(-25 100 80)" />
        </G>
      )}
      {/* gövde: bulut */}
      <G fill={color}>
        <Circle cx={38} cy={66} r={24} />
        <Circle cx={60} cy={52} r={28} />
        <Circle cx={83} cy={66} r={23} />
        <Ellipse cx={60} cy={80} rx={42} ry={24} />
      </G>
      <Ellipse cx={60} cy={98} rx={34} ry={6} fill={shade} opacity={0.55} />
      {/* yanaklar */}
      <Ellipse cx={39} cy={75} rx={6.5} ry={4} fill="#FF9DCB" opacity={0.75} />
      <Ellipse cx={81} cy={75} rx={6.5} ry={4} fill="#FF9DCB" opacity={0.75} />
      {eyes}
      {mouth}
      {mood === 'sleepy' ? (
        <SvgText x={92} y={36} fontSize={14} fontWeight="bold" fill={shade}>
          z z
        </SvgText>
      ) : null}
    </Svg>
  );
}

export default Mascot;
