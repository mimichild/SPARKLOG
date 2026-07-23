const configure = jest.fn();
const getCustomerInfo = jest.fn().mockResolvedValue({ entitlements: { active: {} } });
const getOfferings = jest.fn().mockResolvedValue({ current: null });
const purchasePackage = jest.fn().mockResolvedValue({ customerInfo: { entitlements: { active: {} } } });
const restorePurchases = jest.fn().mockResolvedValue({ entitlements: { active: {} } });

export default {
  configure,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
};
