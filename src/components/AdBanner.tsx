import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useIsPro } from '@/hooks/useIsPro';
import { BANNER_AD_UNIT_ID } from '@/constants/monetization';

/** Pro 使用者無廣告，免費使用者顯示橫幅廣告；放在畫面最下方。Android 一律視為 Pro，不顯示廣告。 */
export function AdBanner() {
  const isProUnlocked = useIsPro();
  if (isProUnlocked) return null;

  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}
