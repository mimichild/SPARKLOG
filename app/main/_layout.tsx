import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

export default function MainTabsLayout() {
  const themeColor = useSettingsStore((s) => s.themeColor);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb' },
        tabBarActiveTintColor: themeColor,
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tabs.Screen name="records" options={{ tabBarLabel: '紀錄', tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text> }} />
      <Tabs.Screen name="categories" options={{ tabBarLabel: '分類', tabBarIcon: ({ color }) => <Text style={{ color }}>📂</Text> }} />
      <Tabs.Screen name="rankings" options={{ tabBarLabel: '排行', tabBarIcon: ({ color }) => <Text style={{ color }}>🏆</Text> }} />
    </Tabs>
  );
}
