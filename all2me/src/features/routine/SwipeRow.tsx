/**
 * Sola kaydırarak silme satırı (ek paket yok: React Native PanResponder + Animated; Expo Go ve web'de çalışır).
 * Yatay sürükleme dikeyden belirgin büyükse jesti üstlenir; eşik aşılırsa `onDelete` çağrılır, aşılmazsa geri yaylanır.
 * Dokunma / uzun basma alttaki karta kalır (yalnız yatay sürüklemede devralınır).
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';
import { radius, useTheme } from '../../theme';

const THRESHOLD = 96;

/**
 * Son yatay sürüklemenin zamanı. Web'de sürükleme bitince tarayıcı yine "click" üretir ve alttaki kart
 * dokunulmuş sayılırdı; kartın dokunma işleyicisi `swipedRecently()` ise yok sayar.
 */
let lastSwipeAt = 0;
export const swipedRecently = (ms = 450) => Date.now() - lastSwipeAt < ms;

export function SwipeRow({ children, onDelete, label, enabled = true, gap = 12 }: { children: React.ReactNode; onDelete: () => void; label: string; enabled?: boolean; gap?: number }) {
  const t = useTheme();
  const x = useRef(new Animated.Value(0)).current;
  /** kırmızı "Sil" zemini yalnız sürüklerken çizilir (erişilebilirlik ağacında / metin aramasında görünmesin) */
  const [active, setActive] = useState(false);
  const del = useRef(onDelete);
  del.current = onDelete;
  const on = useRef(enabled);
  on.current = enabled;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_e, g) => on.current && g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onMoveShouldSetPanResponder: (_e, g) => on.current && g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          lastSwipeAt = Date.now();
          setActive(true);
        },
        onPanResponderMove: (_e, g) => {
          lastSwipeAt = Date.now();
          x.setValue(Math.min(0, g.dx));
        },
        onPanResponderRelease: (_e, g) => {
          lastSwipeAt = Date.now();
          if (g.dx < -THRESHOLD) {
            Animated.timing(x, { toValue: -600, duration: 160, useNativeDriver: false }).start(() => {
              del.current();
              x.setValue(0);
              setActive(false);
            });
          } else Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 6 }).start(() => setActive(false));
        },
        onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: false }).start(() => setActive(false)),
      }),
    [x],
  );

  const reveal = x.interpolate({ inputRange: [-40, -6, 0], outputRange: [1, 0, 0], extrapolate: 'clamp' });
  return (
    <View>
      {active ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            top: 0,
            bottom: gap,
            left: 0,
            right: 0,
            borderRadius: radius.lg,
            backgroundColor: t.danger,
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingRight: 22,
            opacity: reveal,
          }}
        >
          <Text style={{ color: t.onDanger, fontWeight: '800', fontSize: 16 }}>🗑 {label}</Text>
        </Animated.View>
      ) : null}
      <Animated.View style={{ transform: [{ translateX: x }] }} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}
