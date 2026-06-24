import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { getLowRatedStores } from '@/db/storeRepository';
import { haversineMeters } from '@/utils/haversine';
import { useSettingsStore } from '@/store/settingsStore';

const LOCATION_TASK_NAME = 'sparknotes-radar-task';
const lastNotifiedAt: Record<string, number> = {};
const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const { radarEnabled, radarRatingThreshold, radarRadiusMeters } = useSettingsStore.getState();
  if (!radarEnabled) return;

  const locations = (data as { locations: Location.LocationObject[] } | undefined)?.locations;
  const current = locations?.[locations.length - 1];
  if (!current) return;

  const lowRatedStores = await getLowRatedStores(radarRatingThreshold);
  const now = Date.now();

  for (const store of lowRatedStores) {
    const distance = haversineMeters(
      current.coords.latitude, current.coords.longitude,
      store.latitude, store.longitude,
    );
    if (distance > radarRadiusMeters) continue;
    const lastNotified = lastNotifiedAt[store.id] ?? 0;
    if (now - lastNotified < NOTIFY_COOLDOWN_MS) continue;

    lastNotifiedAt[store.id] = now;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ 雷店就在附近！',
        body: `${store.name}（${store.rating}心）距離你只有 ${Math.round(distance)}m，小心別踩雷`,
      },
      trigger: null,
    });
  }
});

export async function registerBackgroundTask(): Promise<void> {
  await Notifications.requestPermissionsAsync();

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;
  const bgStatus = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus.status !== 'granted') return;

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5 * 60 * 1000, // every 5 minutes
    distanceInterval: 100,
  });
}
