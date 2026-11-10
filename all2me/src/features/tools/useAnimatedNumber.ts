import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** Hedef değere yumuşakça ilerleyen sayı (SVG gibi Animated desteklemeyen yerler için). */
export function useAnimatedNumber(target: number, duration = 700): number {
  const v = useRef(new Animated.Value(target)).current;
  const [n, setN] = useState(target);
  useEffect(() => {
    const id = v.addListener(({ value }) => setN(value));
    return () => v.removeListener(id);
  }, [v]);
  useEffect(() => {
    Animated.timing(v, { toValue: target, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [target, duration, v]);
  return n;
}
