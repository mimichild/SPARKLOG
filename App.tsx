import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/context/ThemeContext';
import RootNavigator from '@/navigation/RootNavigator';
import { seedCategoriesIfEmpty } from '@/db/categoryRepository';
import { registerBackgroundTask } from '@/tasks/locationTask';

export default function App() {
  useEffect(() => {
    seedCategoriesIfEmpty();
    registerBackgroundTask();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
