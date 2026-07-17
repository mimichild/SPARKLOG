import { useSettingsStore } from '@/store/settingsStore';

// 雷達（心級雷達/雷店預警）功能已於 0c60085 整個移除，store 只剩 themeColor

test('has correct default values', () => {
  const state = useSettingsStore.getState();
  expect(state.themeColor).toBe('#6c63ff');
});

test('setThemeColor updates themeColor', () => {
  useSettingsStore.getState().setThemeColor('#ef4444');
  expect(useSettingsStore.getState().themeColor).toBe('#ef4444');
});

test('store does not expose removed radar settings', () => {
  const state = useSettingsStore.getState() as Record<string, unknown>;
  expect(state.radarEnabled).toBeUndefined();
  expect(state.radarRatingThreshold).toBeUndefined();
  expect(state.radarRadiusMeters).toBeUndefined();
});
