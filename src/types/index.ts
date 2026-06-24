export interface Store {
  id: string;
  name: string;
  categoryId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  latitude: number;
  longitude: number;
  address: string;        // auto-derived via reverse geocoding, never typed by the user
  photos: string[];       // local file URIs
  event: string;          // free text: what happened on this visit
  notes: string;
  createdAt: string;      // ISO 8601
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  order: number;
}

export interface AppSettings {
  themeColor: string;              // hex, accent color only — never background/dark mode
  radarEnabled: boolean;
  radarRatingThreshold: number;    // stores with rating <= this trigger the radar
  radarRadiusMeters: number;
}
