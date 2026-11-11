/** SVG çark: turkuaz dalgalı çerçeve, beyaz halka, pastel dilimler, merkez maskot, sabit işaretçi. */
import React, { useMemo } from 'react';
import { Animated, Platform, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { Mascot } from '../../components/Mascot';
import type { WheelSlice } from '../../data/wheels';
import { L, type Lang } from '../../i18n';
import { alpha, pastelFor, type PastelKey, type Palette } from '../../theme';

/** Çark çerçevesi (All2Me turkuazı; orkide zeminle tamamlayıcı). */
export const WHEEL_FRAME = '#17A398';

export const sliceName = (s: WheelSlice, lang: Lang): string => (s.label?.trim() ? s.label : L(s.name, lang));

/** Dilim rengi (komşu dilimler farklı olsun diye kıyıda kaydırılır). */
export const slicePastel = (i: number, n: number): PastelKey => (i === n - 1 && n > 1 && (n - 1) % 7 === 0 ? pastelFor(i + 1) : pastelFor(i));

/** En çok 2 satır, satır başına 10 karakter; uzun ad kısaltılır. */
export function wrapName(name: string): string[] {
  const clip = (s: string) => (s.length > 10 ? `${s.slice(0, 9)}…` : s);
  const text = name.trim();
  if (text.length <= 9) return [text];
  const words = text.split(/\s+/);
  if (words.length === 1) return [clip(text)];
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').length;
    const b = words.slice(i).join(' ').length;
    const d = Math.abs(a - b);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return [clip(words.slice(0, best).join(' ')), clip(words.slice(best).join(' '))];
}

const pt = (c: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
};

const scallop = (c: number, r: number, amp: number, lobes: number) => {
  const pts: string[] = [];
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r + amp * Math.cos(lobes * a);
    pts.push(`${i === 0 ? 'M' : 'L'}${(c + rr * Math.sin(a)).toFixed(2)} ${(c - rr * Math.cos(a)).toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
};

export function WheelView({
  slices,
  size,
  rotation,
  lang,
  t,
}: {
  slices: WheelSlice[];
  size: number;
  /** derece cinsinden animasyon değeri */
  rotation: Animated.Value;
  lang: Lang;
  t: Palette;
}) {
  const c = size / 2;
  const n = slices.length;
  const sa = 360 / n;
  const R = size * 0.385; // dilim yarıçapı
  const frame = useMemo(
    () => ({
      outer: scallop(c, size * 0.465, size * 0.022, 12),
      inner: scallop(c, size * 0.44, size * 0.016, 12),
    }),
    [c, size],
  );
  const fsBase = n > 10 ? 10.5 : 12;
  const badge = size * 0.095;
  // Yazı ve emoji için ayrı halkalar (çakışmasın): emoji kenara yakın, yazı rozet ile emoji arasında.
  const emo = size * (n > 10 ? 0.062 : 0.07);
  const rEmoji = R - emo * 0.78;
  const rIn = badge + 6;
  const rOut = rEmoji - emo * 0.62 - 3;
  const rText = (rIn + rOut) / 2;
  const avail = rOut - rIn;
  const spin = rotation.interpolate({ inputRange: [0, 360000], outputRange: ['0deg', '360000deg'] });
  const font = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image">
      {/* sabit çerçeve */}
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Path d={frame.outer} fill={WHEEL_FRAME} />
        <Path d={frame.inner} fill={alpha('#FFFFFF', 0.18)} />
        <Circle cx={c} cy={c} r={size * 0.405} fill="#FFFFFF" />
      </Svg>
      {/* dönen dilimler */}
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size}>
          {slices.map((s, i) => {
            const a0 = i * sa;
            const a1 = (i + 1) * sa;
            const p0 = pt(c, R, a0);
            const p1 = pt(c, R, a1);
            const mid = (i + 0.5) * sa;
            const lines = wrapName(sliceName(s, lang));
            const longest = Math.max(...lines.map((l) => l.length), 1);
            // kalın sistem yazısında karakter genişliği ≈ 0.6 × punto; satır halkaya sığacak kadar küçülür
            const fs = Math.max(8, Math.min(fsBase, avail / (longest * 0.6)));
            const tp = pt(c, rText, mid);
            const ep = pt(c, rEmoji, mid);
            return (
              <G key={s.id}>
                <Path
                  d={`M${c} ${c} L${p0.x} ${p0.y} A${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`}
                  fill={t.pastel[slicePastel(i, n)]}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <G rotation={mid - 90} origin={`${tp.x}, ${tp.y}`}>
                  {lines.map((ln, li) => (
                    <SvgText
                      key={li}
                      x={tp.x}
                      y={tp.y + (li - (lines.length - 1) / 2) * fs * 1.12 + fs * 0.35}
                      fontSize={fs}
                      fontWeight="700"
                      fontFamily={font}
                      fill={t.onPastel}
                      textAnchor="middle"
                    >
                      {ln}
                    </SvgText>
                  ))}
                </G>
                <G rotation={mid} origin={`${ep.x}, ${ep.y}`}>
                  <SvgText x={ep.x} y={ep.y + emo * 0.36} fontSize={emo} textAnchor="middle">
                    {s.emoji}
                  </SvgText>
                </G>
              </G>
            );
          })}
          <Circle cx={c} cy={c} r={R} fill="none" stroke={alpha('#000000', 0.08)} strokeWidth={2} />
        </Svg>
      </Animated.View>
      {/* merkez rozet */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: c - badge,
          top: c - badge,
          width: badge * 2,
          height: badge * 2,
          borderRadius: badge,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Mascot mood="cheer" size={badge * 1.9} />
      </View>
      {/* sabit işaretçi */}
      <Svg width={size} height={size} style={{ position: 'absolute' }} pointerEvents="none">
        <Path
          d={`M${c - 15} ${size * 0.045} Q${c - 15} ${size * 0.1} ${c} ${size * 0.145} Q${c + 15} ${size * 0.1} ${c + 15} ${size * 0.045} Z`}
          fill="#14171A"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Circle cx={c} cy={size * 0.07} r={4} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}
