/**
 * Kök düzen: hydrate kapısı, onboarding koruması, senkron + hatırlatıcı başlatma, bildirim yönlendirme,
 * ToastHost ve tüm Stack ekranları. Rota sözleşmesi: docs/CONTRACTS.md §8.
 */
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '../src/components/ToastHost';
import { onNotificationOpen, rescheduleReminders } from '../src/lib/notifications';
import { cancelAllReminders, resyncAllReminders } from '../src/lib/reminders';
import { startSync } from '../src/lib/sync';
import { installTabSync } from '../src/lib/tabSync';
import { myHabits, useCore } from '../src/store/core';
import { useSettings } from '../src/store/settings';
import { useTheme } from '../src/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function Boot() {
  const me = useCore((s) => s.me);
  const pairId = useCore((s) => s.pairId);
  const habits = useCore((s) => s.habits);
  const notif = useSettings((s) => s.notifications);
  const lang = useSettings((s) => s.lang);

  useEffect(() => {
    if (!me || !pairId) return;
    return startSync();
  }, [me?.id, pairId]);

  // web: başka sekmenin yazdığı durumu yeniden yükle (çok sekmede kayıp olmasın)
  useEffect(() => installTabSync(), []);

  useEffect(() => {
    if (!me) return;
    void rescheduleReminders(myHabits(useCore.getState()));
  }, [me?.id, habits, notif, lang]);

  // Bildirim ana anahtarı ya da dil değişince diğer bütün gruplar: kapalıysa hepsi iptal, açıksa
  // (yeni dilde) yeniden kurulur. İlk açılışta dokunulmaz (planlı bildirimler zaten cihazda).
  const prev = useRef<{ notif: boolean; lang: string } | null>(null);
  useEffect(() => {
    const p = prev.current;
    prev.current = { notif, lang };
    if (!me || !p || (p.notif === notif && p.lang === lang)) return;
    if (!notif) void cancelAllReminders();
    else void resyncAllReminders();
  }, [me?.id, notif, lang]);

  useEffect(() => {
    if (!me) return;
    useCore.getState().settleChampions();
    useCore.getState().checkBadges();
  }, [me?.id]);

  useEffect(() => onNotificationOpen((url) => router.push(url as any)), []);

  return null;
}

export default function RootLayout() {
  const t = useTheme();
  const coreReady = useCore((s) => s.hydrated);
  const settingsReady = useSettings((s) => s.hydrated);
  const me = useCore((s) => s.me);
  const onboarded = useSettings((s) => s.onboarded);
  const hydrated = coreReady && settingsReady;
  const ready = Boolean(me) && onboarded;

  useEffect(() => {
    if (hydrated) void SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const modal = { presentation: 'modal' as const };
  return (
    <SafeAreaProvider>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <Boot />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Protected guard={ready}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-task" options={modal} />
          <Stack.Screen name="task/[id]" options={modal} />
          <Stack.Screen name="action" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="lucky" options={modal} />
          <Stack.Screen name="planner" options={modal} />
          <Stack.Screen name="streak" options={modal} />
          <Stack.Screen name="duel" />
          <Stack.Screen name="pairing" options={modal} />
          <Stack.Screen name="stats" />
          <Stack.Screen name="badges" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="wheel-edit" options={modal} />
          <Stack.Screen name="inspire/[id]" />
          <Stack.Screen name="inspire/category/[id]" />
          <Stack.Screen name="inspire/favorites" />
          <Stack.Screen name="inspire/search" />
          <Stack.Screen name="inspire/quiz/[id]" options={modal} />
          <Stack.Screen name="tools/timer" />
          <Stack.Screen name="tools/drink" />
          <Stack.Screen name="tools/sleep" />
          <Stack.Screen name="tools/reflection" />
          <Stack.Screen name="tools/reflection-write" options={modal} />
          <Stack.Screen name="tools/meditate" />
          <Stack.Screen name="tools/workout" />
          <Stack.Screen name="tools/motivation" />
          <Stack.Screen name="tools/soundscape" />
          <Stack.Screen name="tools/alarm" />
          <Stack.Screen name="tools/mood" options={modal} />
          <Stack.Screen name="tools/love" />
          <Stack.Screen name="life/index" />
          <Stack.Screen name="life/smoke" />
          <Stack.Screen name="life/meals" />
          <Stack.Screen name="life/chores" />
          <Stack.Screen name="study/index" />
          <Stack.Screen name="study/course/[id]" />
          <Stack.Screen name="study/item/[id]" options={modal} />
          <Stack.Screen name="growth/index" />
          <Stack.Screen name="growth/goal/[id]" options={modal} />
        </Stack.Protected>
        <Stack.Protected guard={!ready}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}
