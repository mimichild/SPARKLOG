import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

interface SettingsState extends AppSettings {
  isProUnlocked: boolean;
  setThemeColor: (color: string) => void;
  setProUnlocked: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeColor: '#6c63ff',
      isProUnlocked: false,
      setThemeColor: (color) => set({ themeColor: color }),
      setProUnlocked: (isProUnlocked) => set({ isProUnlocked }),
    }),
    {
      name: 'app_settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
