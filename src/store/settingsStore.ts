import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

interface SettingsState extends AppSettings {
  setThemeColor: (color: string) => void;
  setRadarEnabled: (v: boolean) => void;
  setRadarRatingThreshold: (n: number) => void;
  setRadarRadiusMeters: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeColor: '#6c63ff',
      radarEnabled: true,
      radarRatingThreshold: 2,
      radarRadiusMeters: 500,
      setThemeColor: (color) => set({ themeColor: color }),
      setRadarEnabled: (v) => set({ radarEnabled: v }),
      setRadarRatingThreshold: (n) => set({ radarRatingThreshold: n }),
      setRadarRadiusMeters: (n) => set({ radarRadiusMeters: n }),
    }),
    {
      name: 'app_settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
