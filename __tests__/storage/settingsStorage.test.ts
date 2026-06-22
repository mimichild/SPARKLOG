jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { getSettings, saveSettings } from '@/storage/settingsStorage';
import type { AppSettings } from '@/types';

test('getSettings returns defaults when nothing saved', async () => {
  const s = await getSettings();
  expect(s.themeColor).toBe('#6c63ff');
  expect(s.notificationsEnabled).toBe(true);
  expect(s.alertRatingThreshold).toBe(2);
  expect(s.alertRadiusMeters).toBe(500);
});

test('saveSettings persists and getSettings retrieves', async () => {
  const settings: AppSettings = {
    themeColor: '#ef4444',
    notificationsEnabled: false,
    alertRatingThreshold: 1,
    alertRadiusMeters: 300,
  };
  await saveSettings(settings);
  const loaded = await getSettings();
  expect(loaded).toEqual(settings);
});
