/**
 * Alt sekmeler: Rutin · İlham · Çark · Araçlar · Profil.
 * Etkin sekme siyah (koyu temada beyaz), pasif gri; ortadaki Çark sekmesi renkli çark simgesi + pembe hap etiket.
 */
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useT } from '../../src/i18n';
import { useTheme } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const WHEEL_SLICES = ['#A93BC9', '#FF8A1F', '#FFE28F', '#9BE15D', '#4FD1C5', '#3B6CF6', '#7C5CFC', '#EE4D7E'];

/** Renkli çark simgesi (sekme çubuğu için, özgün çizim). */
export function WheelIcon({ size = 30 }: { size?: number }) {
  const r = 12;
  const c = 16;
  const n = WHEEL_SLICES.length;
  const pt = (a: number) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={c} cy={c} r={15} fill="#17A398" />
      <Circle cx={c} cy={c} r={13.2} fill="#fff" />
      {WHEEL_SLICES.map((col, i) => {
        const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
        const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
        return <Path key={i} d={`M${c} ${c} L${pt(a0)} A${r} ${r} 0 0 1 ${pt(a1)} Z`} fill={col} />;
      })}
      <Circle cx={c} cy={c} r={3.4} fill="#14171A" />
      <Circle cx={c} cy={c} r={1.3} fill="#fff" />
    </Svg>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const tr = useT();
  const icon =
    (on: IconName, off: IconName) =>
    ({ color, focused }: { color: unknown; focused: boolean }) => <Ionicons name={focused ? on : off} size={26} color={color as string} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.tabActive,
        tabBarInactiveTintColor: t.tabInactive,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopColor: t.border,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: tr('tabs.routine'), tabBarIcon: icon('checkmark-circle', 'checkmark-circle-outline') }} />
      <Tabs.Screen name="inspire" options={{ title: tr('tabs.inspire'), tabBarIcon: icon('reader', 'reader-outline') }} />
      <Tabs.Screen
        name="wheel"
        options={{
          title: tr('tabs.wheel'),
          tabBarIcon: () => <WheelIcon size={30} />,
          tabBarLabel: ({ focused }) => (
            <View
              style={{
                backgroundColor: t.pink,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 1,
                marginTop: 2,
                borderWidth: focused ? 1.5 : 0,
                borderColor: t.tabActive,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tr('tabs.wheel')}</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="tools" options={{ title: tr('tabs.tools'), tabBarIcon: icon('color-wand', 'color-wand-outline') }} />
      <Tabs.Screen name="profile" options={{ title: tr('tabs.profile'), tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
