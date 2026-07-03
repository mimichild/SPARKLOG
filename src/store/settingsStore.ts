import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

interface SettingsState extends AppSettings {
  setThemeColor: (color: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeColor: '#6c63ff',
      setThemeColor: (color) => set({ themeColor: color }),
    }),
    {
      name: 'app_settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
