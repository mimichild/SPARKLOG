import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

const KEY = 'app_settings';

const DEFAULTS: AppSettings = {
  themeColor: '#6c63ff',
  notificationsEnabled: true,
  alertRatingThreshold: 2,
  alertRadiusMeters: 500,
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...DEFAULTS };
  return { ...DEFAULTS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
