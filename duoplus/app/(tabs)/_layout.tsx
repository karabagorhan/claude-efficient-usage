import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (title: string, icon: IconName, iconOff: IconName) => ({
  title,
  tabBarIcon: ({ color, focused, size }: { color: unknown; focused: boolean; size: number }) => (
    <Ionicons name={focused ? icon : iconOff} size={size} color={color as string} />
  ),
});

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textDim,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
      }}
    >
      <Tabs.Screen name="index" options={tab('Bugün', 'today', 'today-outline')} />
      <Tabs.Screen name="duel" options={tab('Yarış', 'trophy', 'trophy-outline')} />
      <Tabs.Screen name="habits" options={tab('Rutinler', 'list', 'list-outline')} />
      <Tabs.Screen name="stats" options={tab('İstatistik', 'stats-chart', 'stats-chart-outline')} />
      <Tabs.Screen name="me" options={tab('Profil', 'person', 'person-outline')} />
    </Tabs>
  );
}
