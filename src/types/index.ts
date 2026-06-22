export interface Store {
  id: string;
  name: string;
  categoryId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  address: string;
  latitude: number;
  longitude: number;
  photos: string[];       // local file URIs
  notes: string;
  priceRange: string;     // '' | '$' | '$$' | '$$$'
  createdAt: string;      // ISO 8601
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  order: number;
}

export interface AppSettings {
  themeColor: string;              // hex, default '#6c63ff'
  notificationsEnabled: boolean;
  alertRatingThreshold: number;    // stores with rating <= this trigger alerts
  alertRadiusMeters: number;
}

export type RootStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
  AddStore: { storeId?: string };  // storeId present = edit mode
  StoreDetail: { storeId: string };
  CategoryDetail: { categoryId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Evaluation: undefined;
  Categories: undefined;
  Rankings: undefined;
};
