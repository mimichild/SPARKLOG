import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getLowRatedStores } from '@/db/storeRepository';
import { getSettings } from '@/storage/settingsStorage';
import { haversineMeters } from '@/utils/haversine';

const LOCATION_TASK_NAME = 'SPARKNOTES_LOCATION';
const notifiedAt: Record<string, number> = {};
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour per store

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error || !data?.locations?.length) return;
  const { latitude, longitude } = data.locations[0].coords;

  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const lowRated = await getLowRatedStores(settings.alertRatingThreshold);
  const now = Date.now();

  for (const store of lowRated) {
    const dist = haversineMeters(latitude, longitude, store.latitude, store.longitude);
    if (dist <= settings.alertRadiusMeters) {
      if (!notifiedAt[store.id] || now - notifiedAt[store.id] > COOLDOWN_MS) {
        notifiedAt[store.id] = now;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ 雷店就在附近！',
            body: `${store.name}（${store.rating}心）距離你只有 ${Math.round(dist)}m，小心別踩雷`,
          },
          trigger: null,
        });
      }
    }
  }
});

export async function registerBackgroundTask(): Promise<void> {
  const { status: notifStatus } = await Notifications.requestPermissionsAsync();
  if (notifStatus !== 'granted') return;

  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5 * 60 * 1000,  // 5 minutes
      distanceInterval: 100,          // or 100m moved
      foregroundService: {
        notificationTitle: 'SPARKNOTES',
        notificationBody: '正在監測附近的雷店',
      },
    });
  }
}
