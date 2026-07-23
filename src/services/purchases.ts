import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { REVENUECAT_API_KEY, PRO_ENTITLEMENT_ID } from '@/constants/monetization';

let configured = false;

function hasApiKey(): boolean {
  return REVENUECAT_API_KEY.length > 0;
}

async function ensureConfigured(): Promise<void> {
  if (configured) return;
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  configured = true;
}

export function hasProEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT_ID] != null;
}

/**
 * 回傳 null 代表 RevenueCat 還沒設定好（沒有 API Key，例如 Android 目前不開放
 * 訂閱購買，或還沒申請好 RevenueCat 帳號），呼叫端應該保留原本的本機狀態，
 * 不要用 null 覆蓋掉使用者既有的 Pro 狀態。
 */
export async function fetchProStatus(): Promise<boolean | null> {
  if (!hasApiKey()) return null;
  try {
    await ensureConfigured();
    const info = await Purchases.getCustomerInfo();
    return hasProEntitlement(info);
  } catch (e) {
    console.warn('RevenueCat getCustomerInfo failed:', e);
    return null;
  }
}

export async function purchasePro(): Promise<boolean> {
  if (!hasApiKey()) throw new Error('RevenueCat 尚未設定，無法購買');
  await ensureConfigured();
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];
  if (!pkg) throw new Error('目前沒有可購買的方案');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return hasProEntitlement(customerInfo);
}

export async function restorePurchases(): Promise<boolean> {
  if (!hasApiKey()) throw new Error('RevenueCat 尚未設定，無法還原購買');
  await ensureConfigured();
  const info = await Purchases.restorePurchases();
  return hasProEntitlement(info);
}
