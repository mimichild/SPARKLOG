import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// ── AdMob ────────────────────────────────────────────────────────
// 目前用 Google 官方公開的測試廣告單元 ID（react-native-google-mobile-ads 的
// TestIds），申請到正式 AdMob 帳號、拿到真正的廣告單元 ID 後，把下面這組
// BANNER_AD_UNIT_ID 換成正式 ID 即可，其餘程式碼不用改。
export const BANNER_AD_UNIT_ID = TestIds.BANNER;

// ── RevenueCat ───────────────────────────────────────────────────
// 申請好 RevenueCat 帳號、建立好 App 之後，把下面這個 Public API Key 換成
// 專案設定裡拿到的正式金鑰（iOS 用 App Store 專案的 key；Android 目前不開放
// 訂閱購買，這個 key 留空字串）。
export const REVENUECAT_API_KEY = Platform.select({
  ios: '', // TODO: 換成 RevenueCat 專案設定裡的 Apple API Key
  android: '', // Android 目前不開放訂閱購買（見 monetization_spec_5_apps 記憶），留空即可
  default: '',
}) ?? '';

// Pro 版對應的 RevenueCat Entitlement 識別碼（在 RevenueCat 後台設定 Entitlement 時要用同一個名字）
export const PRO_ENTITLEMENT_ID = 'pro';
