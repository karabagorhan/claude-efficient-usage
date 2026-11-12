/**
 * Çekirdek store'daki toast kuyruğunu (Msg = {key, params}) çevirip üstte gösterir.
 * Kökte bir kez render edilir (app/_layout.tsx). Toast eklemek: useCore.getState().pushToast('toast.saved').
 * `action` taşıyan toast (ör. "Geri al") dokunulabilir bir düğme gösterir ve daha uzun kalır.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tMsg, useT } from '../i18n';
import { useCore } from '../store/core';
import { radius, useTheme } from '../theme';
import { success, tap } from './ui';

/** Eylemli toast'ın ekranda kalma süresi (ms). */
export const ACTION_TOAST_MS = 5000;

export function ToastHost() {
  const t = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const toast = useCore((s) => s.toasts[0]);
  // kuyrukta bekleyen varsa daha kısa göster (art arda 6 toast 13 sn sürmesin)
  const waiting = useCore((s) => s.toasts.length > 1);
  const pop = useCore((s) => s.popToast);
  const y = useRef(new Animated.Value(-140)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (!toast) return;
    if (!toast.action) success();
    const hold = toast.action ? ACTION_TOAST_MS : waiting ? 1100 : 2200;
    const a = Animated.sequence([
      Animated.timing(y, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.delay(hold),
      Animated.timing(y, { toValue: -140, duration: 250, useNativeDriver: true }),
    ]);
    anim.current = a;
    // durdurulunca (Geri al'a basıldı) burada tekrar çıkarma: düğme zaten çıkardı
    a.start(({ finished }) => {
      if (finished) pop();
    });
    return () => a.stop();
  }, [toast, y, pop]);
  if (!toast) return null;
  const action = toast.action;
  return (
    <Animated.View
      pointerEvents={action ? 'box-none' : 'none'}
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        transform: [{ translateY: y }],
        backgroundColor: t.primary,
        borderRadius: radius.pill,
        paddingVertical: action ? 8 : 14,
        paddingLeft: 20,
        paddingRight: action ? 8 : 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: t.onPrimary, fontWeight: '700', textAlign: action ? 'left' : 'center', fontSize: 15, flex: 1 }} numberOfLines={2}>
          {tMsg(tr, toast)}
        </Text>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr(action.labelKey)}
            hitSlop={8}
            onPress={() => {
              tap();
              anim.current?.stop();
              y.setValue(-140);
              pop();
              action.run();
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              height: 38,
              borderRadius: radius.pill,
              backgroundColor: t.onPrimary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: t.primary, fontWeight: '800', fontSize: 15 }}>{tr(action.labelKey)}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default ToastHost;
