import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '../src/components/ui';
import { rescheduleReminders } from '../src/lib/notifications';
import { startSync } from '../src/lib/sync';
import { useStore } from '../src/store/store';
import { useTheme } from '../src/theme';

function Boot() {
  const me = useStore((s) => s.me);
  const pairId = useStore((s) => s.pairId);
  const habits = useStore((s) => s.habits);
  const notif = useStore((s) => s.settings.notifications);

  useEffect(() => {
    if (!me || !pairId) return;
    return startSync();
  }, [me?.id, pairId]);

  useEffect(() => {
    if (!me) return;
    const mine = Object.values(habits).filter((h) => h.ownerId === me.id);
    void rescheduleReminders(mine, notif);
  }, [me?.id, habits, notif]);

  useEffect(() => {
    if (me) {
      useStore.getState().settleChampions();
      useStore.getState().checkBadges();
    }
  }, [me?.id]);

  return null;
}

export default function RootLayout() {
  const t = useTheme();
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.me);
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: t.bg }} />;
  return (
    <SafeAreaProvider>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <Boot />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Protected guard={Boolean(me)}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="habit/[id]" options={{ title: 'Görev', presentation: 'modal' }} />
          <Stack.Screen name="templates" options={{ title: 'Şablonlar ve Paketler' }} />
          <Stack.Screen name="focus" options={{ title: 'Odak Zamanlayıcı', presentation: 'modal' }} />
          <Stack.Screen name="breathe" options={{ title: 'Nefes Egzersizi', presentation: 'modal' }} />
          <Stack.Screen name="mood" options={{ title: 'Ruh Hali ve Günlük', presentation: 'modal' }} />
          <Stack.Screen name="library" options={{ title: 'Kütüphane' }} />
          <Stack.Screen name="pairing" options={{ title: 'Partner Eşleştirme', presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!me}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}
