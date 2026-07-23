import 'react-native-get-random-values';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import { seedCategoriesIfEmpty } from '@/db/categoryRepository';
import { removeSampleStoresIfPresent } from '@/db/storeRepository';
import { useSettingsStore } from '@/store/settingsStore';
import { fetchProStatus } from '@/services/purchases';

mobileAds().initialize();

export default function RootLayout() {
  const setProUnlocked = useSettingsStore((s) => s.setProUnlocked);

  useEffect(() => {
    (async () => {
      await seedCategoriesIfEmpty();
      await removeSampleStoresIfPresent();
    })();
  }, []);

  useEffect(() => {
    // RevenueCat 尚未設定（沒有 API Key）時回傳 null，維持本機既有的 Pro 狀態，不要用 null 蓋掉。
    fetchProStatus().then(isPro => {
      if (isPro != null) setProUnlocked(isPro);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="store/add" />
          <Stack.Screen name="store/[id]" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="main" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
