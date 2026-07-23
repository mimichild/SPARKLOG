import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settingsStore';
import { useIsPro } from '@/hooks/useIsPro';
import { AdBanner } from '@/components/AdBanner';

const TAB_BAR_BASE_HEIGHT = 50;

export default function MainTabsLayout() {
  const themeColor = useSettingsStore((s) => s.themeColor);
  const isPro = useIsPro();
  const insets = useSafeAreaInsets();
  // 有廣告時分頁列下方接的是 AdBanner，不用留安全區；沒有廣告（Android 全部、iOS Pro）
  // 時分頁列才是螢幕真正的底部，要補回安全區高度。
  const bottomInset = isPro ? insets.bottom : 0;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          // lineHeight 跟高度對齊才能把文字垂直置中（react-navigation 預設版面
          // 會保留給圖示的空間，光靠 tabBarItemStyle 的 justifyContent 頂不掉）。
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
            height: TAB_BAR_BASE_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 0,
          },
          tabBarActiveTintColor: themeColor,
          tabBarInactiveTintColor: '#94a3b8',
          tabBarItemStyle: { height: TAB_BAR_BASE_HEIGHT, paddingVertical: 0 },
          tabBarLabelStyle: { fontSize: 17, fontWeight: '700', includeFontPadding: false, lineHeight: TAB_BAR_BASE_HEIGHT, margin: 0 },
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
