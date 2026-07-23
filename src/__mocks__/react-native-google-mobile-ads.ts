export const TestIds = {
  BANNER: 'test-banner-id',
};

export const BannerAdSize = {
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
};

export function BannerAd() {
  return null;
}

export default function mobileAds() {
  return { initialize: jest.fn().mockResolvedValue(undefined) };
}
