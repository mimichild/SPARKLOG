type MockPurchases = {
  configure: jest.Mock;
  getCustomerInfo: jest.Mock;
  getOfferings: jest.Mock;
  purchasePackage: jest.Mock;
  restorePurchases: jest.Mock;
};

/**
 * REVENUECAT_API_KEY is a module-level constant, so to test both the
 * "configured" and "not configured" branches we re-mock the constants
 * module and re-require the service (and its react-native-purchases
 * dependency) fresh for each scenario, rather than mutating an
 * already-imported binding (which Babel may have inlined at import time).
 */
function loadPurchasesWith(apiKey: string) {
  jest.resetModules();
  jest.doMock('../../constants/monetization', () => ({
    REVENUECAT_API_KEY: apiKey,
    PRO_ENTITLEMENT_ID: 'pro',
  }));
  return {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ...(require('../../services/purchases') as typeof import('../../services/purchases')),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mockPurchases: require('react-native-purchases').default as MockPurchases,
  };
}

describe('purchases service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasProEntitlement', () => {
    it('returns true when the pro entitlement is active', () => {
      const { hasProEntitlement } = loadPurchasesWith('');
      const info = { entitlements: { active: { pro: {} } } } as never;
      expect(hasProEntitlement(info)).toBe(true);
    });

    it('returns false when the pro entitlement is not active', () => {
      const { hasProEntitlement } = loadPurchasesWith('');
      const info = { entitlements: { active: {} } } as never;
      expect(hasProEntitlement(info)).toBe(false);
    });
  });

  describe('fetchProStatus', () => {
    it('returns null without calling RevenueCat when no API key is configured', async () => {
      const { fetchProStatus, mockPurchases } = loadPurchasesWith('');

      const got = await fetchProStatus();

      expect(got).toBeNull();
      expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled();
    });

    it('returns true when the pro entitlement is active', async () => {
      const { fetchProStatus, mockPurchases } = loadPurchasesWith('test-key');
      mockPurchases.getCustomerInfo.mockResolvedValue({ entitlements: { active: { pro: {} } } });

      const got = await fetchProStatus();

      expect(got).toBe(true);
      expect(mockPurchases.configure).toHaveBeenCalledWith({ apiKey: 'test-key' });
    });

    it('returns false when the pro entitlement is not active', async () => {
      const { fetchProStatus, mockPurchases } = loadPurchasesWith('test-key');
      mockPurchases.getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });

      const got = await fetchProStatus();

      expect(got).toBe(false);
    });

    it('returns null if the RevenueCat call throws', async () => {
      const { fetchProStatus, mockPurchases } = loadPurchasesWith('test-key');
      mockPurchases.getCustomerInfo.mockRejectedValue(new Error('network error'));

      const got = await fetchProStatus();

      expect(got).toBeNull();
    });
  });

  describe('purchasePro', () => {
    it('throws when no API key is configured', async () => {
      const { purchasePro } = loadPurchasesWith('');
      await expect(purchasePro()).rejects.toThrow('RevenueCat 尚未設定');
    });

    it('purchases the first available package and returns the resulting entitlement', async () => {
      const { purchasePro, mockPurchases } = loadPurchasesWith('test-key');
      mockPurchases.getOfferings.mockResolvedValue({
        current: { availablePackages: [{ identifier: 'pro_monthly' }] },
      });
      mockPurchases.purchasePackage.mockResolvedValue({
        customerInfo: { entitlements: { active: { pro: {} } } },
      });

      const got = await purchasePro();

      expect(got).toBe(true);
      expect(mockPurchases.purchasePackage).toHaveBeenCalledWith({ identifier: 'pro_monthly' });
    });

    it('throws when there is no available package', async () => {
      const { purchasePro, mockPurchases } = loadPurchasesWith('test-key');
      mockPurchases.getOfferings.mockResolvedValue({ current: null });

      await expect(purchasePro()).rejects.toThrow('沒有可購買的方案');
    });
  });

  describe('restorePurchases', () => {
    it('throws when no API key is configured', async () => {
      const { restorePurchases } = loadPurchasesWith('');
      await expect(restorePurchases()).rejects.toThrow('RevenueCat 尚未設定');
    });

    it('restores purchases and returns the resulting entitlement', async () => {
      const { restorePurchases, mockPurchases } = loadPurchasesWith('test-key');
      mockPurchases.restorePurchases.mockResolvedValue({ entitlements: { active: { pro: {} } } });

      const got = await restorePurchases();

      expect(got).toBe(true);
    });
  });
});
