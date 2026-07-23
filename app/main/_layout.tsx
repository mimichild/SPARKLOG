import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { AdBanner } from '@/components/AdBanner';

export default function MainTabsLayout() {
  const themeColor = useSettingsStore((s) => s.themeColor);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          // 分頁列下方接了 AdBanner，不是螢幕最底部，所以固定高度不用另外加安全區；
          // lineHeight 跟高度對齊才能把文字垂直置中（react-navigation 預設版面
          // 會保留給圖示的空間，光靠 tabBarItemStyle 的 justifyContent 頂不掉）。
          tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb', height: 50, paddingBottom: 0, paddingTop: 0 },
          tabBarActiveTintColor: themeColor,
          tabBarInactiveTintColor: '#94a3b8',
          tabBarItemStyle: { height: 50, paddingVertical: 0 },
          tabBarLabelStyle: { fontSize: 17, fontWeight: '700', includeFontPadding: false, lineHeight: 50, margin: 0 },
          tabBarIcon: () => null,
          tabBarIconStyle: { display: 'none', width: 0, height: 0 },
        }}
      >
        <Tabs.Screen name="records" options={{ tabBarLabel: '紀錄' }} />
        <Tabs.Screen name="categories" options={{ tabBarLabel: '分類' }} />
        <Tabs.Screen name="rankings" options={{ tabBarLabel: '排行' }} />
      </Tabs>

      <AdBanner />
    </View>
  );
}
