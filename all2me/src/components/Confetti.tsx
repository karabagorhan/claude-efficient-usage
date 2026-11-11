/**
 * Animated tabanlı konfeti (native modül yok, Expo Go + web).
 * Tetiklemek için `fire` değerini değiştir (ör. sayaç): <Confetti fire={n} />
 * Ekranın üstüne mutlak konumlanır, dokunmaları engellemez.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLORS = ['#EE4D7E', '#7C5CFC', '#A93BC9', '#3B6CF6', '#FF8A1F', '#FFE28F', '#34D399', '#BBDDF7'];

export function Confetti({
  fire,
  count = 48,
  duration = 2400,
  onDone,
}: {
  /** Değiştiğinde (0 dışı) bir patlama başlar */
  fire: number | boolean;
  count?: number;
  duration?: number;
  onDone?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 160,
        delay: Math.random() * 0.25,
        size: 6 + Math.random() * 8,
        round: Math.random() < 0.3,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720),
        color: COLORS[i % COLORS.length],
      })),
    // her patlamada yeni dağılım
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fire, count, width],
  );

  useEffect(() => {
    if (!fire) return;
    setVisible(true);
    progress.setValue(0);
    const anim = Animated.timing(progress, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: true });
    anim.start(({ finished }) => {
      if (finished) {
        setVisible(false);
        onDone?.();
      }
    });
    return () => anim.stop();
  }, [fire, duration, progress, onDone]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const local = progress.interpolate({
          inputRange: [0, p.delay, 1],
          outputRange: [0, 0, 1],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: -20,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: local.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: local.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
                { translateX: local.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: local.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

export default Confetti;
