import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * 訂閱只在 iOS 開放（見 monetization_spec_5_apps 記憶）。Android 沒有付費入口，
 * 所以 Android 一律視為 Pro，全部功能開放使用、不顯示廣告；iOS 才看 RevenueCat
 * 同步回來的真實 isProUnlocked 狀態。
 */
export function useIsPro(): boolean {
  const storedIsProUnlocked = useSettingsStore(s => s.isProUnlocked);
  return Platform.OS === 'android' ? true : storedIsProUnlocked;
}
