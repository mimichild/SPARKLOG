import { useSettingsStore } from '@/store/settingsStore';

test('has correct default values', () => {
  const state = useSettingsStore.getState();
  expect(state.themeColor).toBe('#6c63ff');
  expect(state.radarEnabled).toBe(true);
  expect(state.radarRatingThreshold).toBe(2);
  expect(state.radarRadiusMeters).toBe(500);
});

test('setThemeColor updates themeColor', () => {
  useSettingsStore.getState().setThemeColor('#ef4444');
  expect(useSettingsStore.getState().themeColor).toBe('#ef4444');
});

test('setRadarEnabled updates radarEnabled', () => {
  useSettingsStore.getState().setRadarEnabled(false);
  expect(useSettingsStore.getState().radarEnabled).toBe(false);
});

test('setRadarRatingThreshold updates radarRatingThreshold', () => {
  useSettingsStore.getState().setRadarRatingThreshold(1);
  expect(useSettingsStore.getState().radarRatingThreshold).toBe(1);
});

test('setRadarRadiusMeters updates radarRadiusMeters', () => {
  useSettingsStore.getState().setRadarRadiusMeters(300);
  expect(useSettingsStore.getState().radarRadiusMeters).toBe(300);
});
