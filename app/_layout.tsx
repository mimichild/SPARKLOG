import 'react-native-get-random-values';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { seedCategoriesIfEmpty } from '@/db/categoryRepository';
import { removeSampleStoresIfPresent } from '@/db/storeRepository';
export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await seedCategoriesIfEmpty();
      await removeSampleStoresIfPresent();
    })();
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
