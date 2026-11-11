/**
 * Çekirdek store'daki toast kuyruğunu (Msg = {key, params}) çevirip üstte gösterir.
 * Kökte bir kez render edilir (app/_layout.tsx). Toast eklemek: useCore.getState().pushToast('toast.saved').
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tMsg, useT } from '../i18n';
import { useCore } from '../store/core';
import { radius, useTheme } from '../theme';
import { success } from './ui';

export function ToastHost() {
  const t = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const toast = useCore((s) => s.toasts[0]);
  // kuyrukta bekleyen varsa daha kısa göster (art arda 6 toast 13 sn sürmesin)
  const waiting = useCore((s) => s.toasts.length > 1);
  const pop = useCore((s) => s.popToast);
  const y = useRef(new Animated.Value(-140)).current;
  useEffect(() => {
    if (!toast) return;
    success();
    const a = Animated.sequence([
      Animated.timing(y, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.delay(waiting ? 1100 : 2200),
      Animated.timing(y, { toValue: -140, duration: 250, useNativeDriver: true }),
    ]);
    a.start(() => pop());
    return () => a.stop();
  }, [toast, y, pop]);
  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        transform: [{ translateY: y }],
        backgroundColor: t.primary,
        borderRadius: radius.pill,
        paddingVertical: 14,
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ color: t.onPrimary, fontWeight: '700', textAlign: 'center', fontSize: 15 }}>{tMsg(tr, toast)}</Text>
    </Animated.View>
  );
}

export default ToastHost;
