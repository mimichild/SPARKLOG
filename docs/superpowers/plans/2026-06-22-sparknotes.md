# SPARKNOTES Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only iOS/Android mobile app for recording and rating stores, with category management, heart-based rankings, and background proximity alerts for low-rated stores.

**Architecture:** Expo managed workflow with React Native 0.76. All data lives in SQLite via expo-sqlite (stores + categories) and AsyncStorage (settings). A background expo-task-manager task runs Haversine distance checks and fires local notifications when the user is near a low-rated store. ThemeContext provides the user-chosen accent color to every screen.

**Tech Stack:** Expo SDK 52, React Native 0.76, TypeScript 5, React Navigation v7, expo-sqlite 14, AsyncStorage, expo-location 17, expo-task-manager 12, expo-notifications 0.29, expo-image-picker 15, expo-file-system 17, expo-sharing 12, expo-document-picker 12, Jest + React Native Testing Library.

---

## File Map

```
sparknotes/
├── App.tsx                              — root: ThemeProvider + NavigationContainer
├── app.json                             — Expo config (permissions, splash, icons)
├── babel.config.js
├── tsconfig.json
├── jest.config.js
├── src/
│   ├── types/index.ts                   — Store, Category, AppSettings interfaces
│   ├── utils/
│   │   ├── haversine.ts                 — distance in metres between two coords
│   │   ├── relativeTime.ts              — ISO → "2天前" formatter
│   │   └── exportImport.ts              — serialize/parse backup JSON
│   ├── db/
│   │   ├── database.ts                  — SQLite open + schema migrations
│   │   ├── storeRepository.ts           — CRUD + search for Store rows
│   │   └── categoryRepository.ts        — CRUD for Category rows + seed defaults
│   ├── storage/
│   │   └── settingsStorage.ts           — AsyncStorage get/set AppSettings
│   ├── context/
│   │   └── ThemeContext.tsx             — React context exposing themeColor + setter
│   ├── navigation/
│   │   └── RootNavigator.tsx            — Stack wrapping BottomTabs + modals
│   ├── components/
│   │   ├── HeartRating.tsx              — 5-heart row, tappable or read-only
│   │   ├── PhotoThumbnail.tsx           — 52×52 image or dashed placeholder
│   │   ├── StoreCard.tsx                — list row: thumbnail + name + hearts + time
│   │   └── FAB.tsx                      — floating action button (＋)
│   ├── screens/
│   │   ├── HomeScreen.tsx               — big title + settings button
│   │   ├── EvaluationScreen.tsx         — list + search + FAB
│   │   ├── AddStoreScreen.tsx           — modal form (add + edit)
│   │   ├── StoreDetailScreen.tsx        — full detail + photo carousel
│   │   ├── CategoriesScreen.tsx         — tag grid + add/edit/delete
│   │   ├── CategoryDetailScreen.tsx     — stores in one category + sort toggle
│   │   ├── RankingsScreen.tsx           — heart × category filter
│   │   └── SettingsScreen.tsx           — theme / notifications / export-import
│   └── tasks/
│       └── locationTask.ts              — background geofence + notification logic
└── __tests__/
    ├── utils/haversine.test.ts
    ├── utils/relativeTime.test.ts
    ├── utils/exportImport.test.ts
    ├── db/storeRepository.test.ts
    ├── db/categoryRepository.test.ts
    ├── storage/settingsStorage.test.ts
    └── components/HeartRating.test.tsx
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `App.tsx`, `app.json`, `babel.config.js`, `tsconfig.json`, `jest.config.js`

- [ ] **Step 1: Initialise Expo project**

```bash
cd /Users/mimi/Documents/SPARKNOTES
npx create-expo-app@latest . --template blank-typescript
```

Expected: `App.tsx`, `package.json`, `tsconfig.json` created.

- [ ] **Step 2: Install all dependencies**

```bash
npx expo install expo-sqlite expo-secure-store @react-native-async-storage/async-storage \
  expo-location expo-task-manager expo-notifications \
  expo-image-picker expo-file-system expo-sharing expo-document-picker \
  react-native-maps

npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack \
  react-native-screens react-native-safe-area-context \
  react-native-gesture-handler react-native-reanimated \
  uuid

npm install --save-dev jest @types/jest jest-expo \
  @testing-library/react-native @testing-library/jest-native \
  @types/uuid
```

- [ ] **Step 3: Configure jest.config.js**

```js
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
};
```

- [ ] **Step 4: Configure tsconfig.json (path aliases)**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 5: Create folder structure**

```bash
mkdir -p src/{types,utils,db,storage,context,navigation,components,screens,tasks}
mkdir -p __tests__/{utils,db,storage,components}
```

- [ ] **Step 6: Verify project runs**

```bash
npx expo start
```

Expected: Metro bundler starts, no errors.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Expo project with all dependencies"
```

---

## Task 2: Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types/index.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript types and navigation param lists"
```

---

## Task 3: Utility Functions (TDD)

**Files:**
- Create: `src/utils/haversine.ts`, `src/utils/relativeTime.ts`
- Test: `__tests__/utils/haversine.test.ts`, `__tests__/utils/relativeTime.test.ts`

- [ ] **Step 1: Write haversine test**

```typescript
// __tests__/utils/haversine.test.ts
import { haversineMeters } from '@/utils/haversine';

test('same point returns 0', () => {
  expect(haversineMeters(25.033, 121.564, 25.033, 121.564)).toBe(0);
});

test('Taipei to ~1km north is roughly 1000m', () => {
  const d = haversineMeters(25.033, 121.564, 25.042, 121.564);
  expect(d).toBeGreaterThan(900);
  expect(d).toBeLessThan(1100);
});

test('returns number type', () => {
  expect(typeof haversineMeters(0, 0, 0, 1)).toBe('number');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest __tests__/utils/haversine.test.ts
```

Expected: `Cannot find module '@/utils/haversine'`

- [ ] **Step 3: Implement haversine**

```typescript
// src/utils/haversine.ts
export function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest __tests__/utils/haversine.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Write relativeTime test**

```typescript
// __tests__/utils/relativeTime.test.ts
import { relativeTime } from '@/utils/relativeTime';

test('under 1 minute returns "剛剛"', () => {
  const now = new Date().toISOString();
  expect(relativeTime(now)).toBe('剛剛');
});

test('2 days ago returns "2天前"', () => {
  const d = new Date(Date.now() - 2 * 86_400_000).toISOString();
  expect(relativeTime(d)).toBe('2天前');
});

test('1 hour ago returns "1小時前"', () => {
  const d = new Date(Date.now() - 3_600_000).toISOString();
  expect(relativeTime(d)).toBe('1小時前');
});

test('30 days ago returns "1個月前"', () => {
  const d = new Date(Date.now() - 30 * 86_400_000).toISOString();
  expect(relativeTime(d)).toBe('1個月前');
});
```

- [ ] **Step 6: Run — expect FAIL**

```bash
npx jest __tests__/utils/relativeTime.test.ts
```

- [ ] **Step 7: Implement relativeTime**

```typescript
// src/utils/relativeTime.ts
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins}分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}個月前`;
  return `${Math.floor(months / 12)}年前`;
}
```

- [ ] **Step 8: Run — expect PASS**

```bash
npx jest __tests__/utils/relativeTime.test.ts
```

- [ ] **Step 9: Commit**

```bash
git add src/utils/ __tests__/utils/
git commit -m "feat: add haversine distance and relativeTime utils with tests"
```

---

## Task 4: Database Layer (TDD)

**Files:**
- Create: `src/db/database.ts`, `src/db/storeRepository.ts`, `src/db/categoryRepository.ts`
- Test: `__tests__/db/storeRepository.test.ts`, `__tests__/db/categoryRepository.test.ts`

- [ ] **Step 1: Write database.ts**

```typescript
// src/db/database.ts
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('sparknotes.db');
  await migrate(_db);
  return _db;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      rating INTEGER NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      photos TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      priceRange TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);
}
```

- [ ] **Step 2: Write categoryRepository.ts**

```typescript
// src/db/categoryRepository.ts
import { v4 as uuid } from 'uuid';
import { getDb } from './database';
import type { Category } from '@/types';

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '餐廳',         emoji: '🍽',  order: 0 },
  { name: '咖啡廳',       emoji: '☕',  order: 1 },
  { name: '飲料店',       emoji: '🧋',  order: 2 },
  { name: '服飾',         emoji: '👗',  order: 3 },
  { name: '甜點店',       emoji: '🍰',  order: 4 },
  { name: '運動用品專賣店', emoji: '🏋️', order: 5 },
];

export async function seedCategoriesIfEmpty(): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (rows[0].count > 0) return;
  for (const cat of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (id, name, emoji, "order") VALUES (?, ?, ?, ?)',
      [uuid(), cat.name, cat.emoji, cat.order],
    );
  }
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY "order" ASC');
}

export async function insertCategory(name: string, emoji: string): Promise<Category> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ max: number | null }>('SELECT MAX("order") as max FROM categories');
  const order = (rows[0].max ?? -1) + 1;
  const id = uuid();
  await db.runAsync(
    'INSERT INTO categories (id, name, emoji, "order") VALUES (?, ?, ?, ?)',
    [id, name, emoji, order],
  );
  return { id, name, emoji, order };
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function updateCategory(id: string, name: string, emoji: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE categories SET name = ?, emoji = ? WHERE id = ?', [name, emoji, id]);
}
```

- [ ] **Step 3: Write storeRepository.ts**

```typescript
// src/db/storeRepository.ts
import { v4 as uuid } from 'uuid';
import { getDb } from './database';
import type { Store } from '@/types';

function rowToStore(row: any): Store {
  return { ...row, photos: JSON.parse(row.photos) };
}

export async function getAllStores(): Promise<Store[]> {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM stores ORDER BY createdAt DESC');
  return rows.map(rowToStore);
}

export async function getStoreById(id: string): Promise<Store | null> {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM stores WHERE id = ?', [id]);
  return rows.length ? rowToStore(rows[0]) : null;
}

export async function searchStores(query: string): Promise<Store[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM stores WHERE name LIKE ? ORDER BY createdAt DESC',
    [`%${query}%`],
  );
  return rows.map(rowToStore);
}

export async function getStoresByCategory(categoryId: string, order: 'desc' | 'asc' = 'desc'): Promise<Store[]> {
  const db = await getDb();
  const dir = order === 'desc' ? 'DESC' : 'ASC';
  const rows = await db.getAllAsync(
    `SELECT * FROM stores WHERE categoryId = ? ORDER BY createdAt ${dir}`,
    [categoryId],
  );
  return rows.map(rowToStore);
}

export async function getStoresFiltered(ratings: number[], categoryIds: string[]): Promise<Store[]> {
  const db = await getDb();
  const rPlaceholders = ratings.map(() => '?').join(',');
  const params: any[] = [...ratings];
  let sql = `SELECT * FROM stores WHERE rating IN (${rPlaceholders})`;
  if (categoryIds.length > 0) {
    const cPlaceholders = categoryIds.map(() => '?').join(',');
    sql += ` AND categoryId IN (${cPlaceholders})`;
    params.push(...categoryIds);
  }
  sql += ' ORDER BY rating DESC, createdAt DESC';
  const rows = await db.getAllAsync(sql, params);
  return rows.map(rowToStore);
}

export async function getLowRatedStores(threshold: number): Promise<Store[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM stores WHERE rating <= ?',
    [threshold],
  );
  return rows.map(rowToStore);
}

export async function insertStore(data: Omit<Store, 'id' | 'createdAt'>): Promise<Store> {
  const db = await getDb();
  const id = uuid();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO stores (id, name, categoryId, rating, address, latitude, longitude, photos, notes, priceRange, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.categoryId, data.rating, data.address, data.latitude, data.longitude,
     JSON.stringify(data.photos), data.notes, data.priceRange, createdAt],
  );
  return { ...data, id, createdAt };
}

export async function updateStore(id: string, data: Omit<Store, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE stores SET name=?, categoryId=?, rating=?, address=?, latitude=?, longitude=?,
     photos=?, notes=?, priceRange=? WHERE id=?`,
    [data.name, data.categoryId, data.rating, data.address, data.latitude, data.longitude,
     JSON.stringify(data.photos), data.notes, data.priceRange, id],
  );
}

export async function deleteStore(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM stores WHERE id = ?', [id]);
}
```

- [ ] **Step 4: Write storeRepository tests**

```typescript
// __tests__/db/storeRepository.test.ts
jest.mock('expo-sqlite');
jest.mock('@/db/database', () => ({
  getDb: jest.fn(),
}));

import { getDb } from '@/db/database';
import {
  getAllStores, insertStore, deleteStore, searchStores, getLowRatedStores,
} from '@/db/storeRepository';

const mockDb = {
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockResolvedValue(mockDb);
});

const baseStore = {
  name: '路易莎', categoryId: 'cat-1', rating: 5 as const,
  address: '台北市', latitude: 25.03, longitude: 121.5,
  photos: [], notes: '', priceRange: '$',
};

test('getAllStores parses photos JSON', async () => {
  mockDb.getAllAsync.mockResolvedValue([
    { ...baseStore, id: '1', createdAt: '2026-01-01T00:00:00Z', photos: '[]' },
  ]);
  const stores = await getAllStores();
  expect(stores[0].photos).toEqual([]);
});

test('insertStore returns store with id and createdAt', async () => {
  mockDb.runAsync.mockResolvedValue(undefined);
  const store = await insertStore(baseStore);
  expect(store.id).toBeTruthy();
  expect(store.createdAt).toBeTruthy();
  expect(store.name).toBe('路易莎');
});

test('deleteStore calls DELETE with correct id', async () => {
  mockDb.runAsync.mockResolvedValue(undefined);
  await deleteStore('abc');
  expect(mockDb.runAsync).toHaveBeenCalledWith(
    'DELETE FROM stores WHERE id = ?', ['abc'],
  );
});

test('searchStores uses LIKE query', async () => {
  mockDb.getAllAsync.mockResolvedValue([]);
  await searchStores('路易莎');
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(
    expect.stringContaining('LIKE'), ['%路易莎%'],
  );
});

test('getLowRatedStores queries rating <= threshold', async () => {
  mockDb.getAllAsync.mockResolvedValue([]);
  await getLowRatedStores(2);
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(
    expect.stringContaining('rating <= ?'), [2],
  );
});
```

- [ ] **Step 5: Run — expect PASS**

```bash
npx jest __tests__/db/storeRepository.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/db/ __tests__/db/
git commit -m "feat: add SQLite database layer with store and category repositories"
```

---

## Task 5: Settings Storage (TDD)

**Files:**
- Create: `src/storage/settingsStorage.ts`
- Test: `__tests__/storage/settingsStorage.test.ts`

- [ ] **Step 1: Write test**

```typescript
// __tests__/storage/settingsStorage.test.ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { getSettings, saveSettings } from '@/storage/settingsStorage';
import type { AppSettings } from '@/types';

test('getSettings returns defaults when nothing saved', async () => {
  const s = await getSettings();
  expect(s.themeColor).toBe('#6c63ff');
  expect(s.notificationsEnabled).toBe(true);
  expect(s.alertRatingThreshold).toBe(2);
  expect(s.alertRadiusMeters).toBe(500);
});

test('saveSettings persists and getSettings retrieves', async () => {
  const settings: AppSettings = {
    themeColor: '#ef4444',
    notificationsEnabled: false,
    alertRatingThreshold: 1,
    alertRadiusMeters: 300,
  };
  await saveSettings(settings);
  const loaded = await getSettings();
  expect(loaded).toEqual(settings);
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest __tests__/storage/settingsStorage.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/storage/settingsStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/types';

const KEY = 'app_settings';

const DEFAULTS: AppSettings = {
  themeColor: '#6c63ff',
  notificationsEnabled: true,
  alertRatingThreshold: 2,
  alertRadiusMeters: 500,
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...DEFAULTS };
  return { ...DEFAULTS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest __tests__/storage/settingsStorage.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/storage/ __tests__/storage/
git commit -m "feat: add AsyncStorage settings persistence with tests"
```

---

## Task 6: Export/Import Utility (TDD)

**Files:**
- Create: `src/utils/exportImport.ts`
- Test: `__tests__/utils/exportImport.test.ts`

- [ ] **Step 1: Write test**

```typescript
// __tests__/utils/exportImport.test.ts
import { serializeBackup, parseBackup } from '@/utils/exportImport';
import type { Store, Category } from '@/types';

const cat: Category = { id: 'c1', name: '咖啡廳', emoji: '☕', order: 0 };
const store: Store = {
  id: 's1', name: '路易莎', categoryId: 'c1', rating: 5,
  address: '台北', latitude: 25.03, longitude: 121.5,
  photos: [], notes: '', priceRange: '$', createdAt: '2026-01-01T00:00:00Z',
};

test('serializeBackup produces valid JSON string', () => {
  const json = serializeBackup([store], [cat]);
  const parsed = JSON.parse(json);
  expect(parsed.version).toBe(1);
  expect(parsed.stores).toHaveLength(1);
  expect(parsed.categories).toHaveLength(1);
});

test('parseBackup round-trips correctly', () => {
  const json = serializeBackup([store], [cat]);
  const result = parseBackup(json);
  expect(result.stores[0].name).toBe('路易莎');
  expect(result.categories[0].emoji).toBe('☕');
});

test('parseBackup throws on invalid JSON', () => {
  expect(() => parseBackup('not json')).toThrow();
});

test('parseBackup throws on wrong version', () => {
  const bad = JSON.stringify({ version: 99, stores: [], categories: [] });
  expect(() => parseBackup(bad)).toThrow('Unsupported backup version');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest __tests__/utils/exportImport.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/utils/exportImport.ts
import type { Store, Category } from '@/types';

interface Backup {
  version: number;
  exportedAt: string;
  categories: Category[];
  stores: Store[];
}

export function serializeBackup(stores: Store[], categories: Category[]): string {
  const backup: Backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    stores,
  };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(json: string): { stores: Store[]; categories: Category[] } {
  const data = JSON.parse(json) as Backup;
  if (data.version !== 1) throw new Error('Unsupported backup version');
  return { stores: data.stores, categories: data.categories };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest __tests__/utils/exportImport.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/exportImport.ts __tests__/utils/exportImport.test.ts
git commit -m "feat: add export/import JSON serialization with tests"
```

---

## Task 7: Theme Context

**Files:**
- Create: `src/context/ThemeContext.tsx`

- [ ] **Step 1: Implement ThemeContext**

```typescript
// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSettings, saveSettings } from '@/storage/settingsStorage';

interface ThemeContextValue {
  themeColor: string;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeColor: '#6c63ff',
  setThemeColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState('#6c63ff');

  useEffect(() => {
    getSettings().then((s) => setThemeColorState(s.themeColor));
  }, []);

  const setThemeColor = async (color: string) => {
    setThemeColorState(color);
    const s = await getSettings();
    await saveSettings({ ...s, themeColor: color });
  };

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/ThemeContext.tsx
git commit -m "feat: add ThemeContext with AsyncStorage persistence"
```

---

## Task 8: Navigation

**Files:**
- Create: `src/navigation/RootNavigator.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Write RootNavigator**

```typescript
// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { RootStackParamList, MainTabParamList } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import HomeScreen from '@/screens/HomeScreen';
import EvaluationScreen from '@/screens/EvaluationScreen';
import CategoriesScreen from '@/screens/CategoriesScreen';
import RankingsScreen from '@/screens/RankingsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AddStoreScreen from '@/screens/AddStoreScreen';
import StoreDetailScreen from '@/screens/StoreDetailScreen';
import CategoryDetailScreen from '@/screens/CategoryDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { themeColor } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: themeColor,
        tabBarInactiveTintColor: '#475569',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarLabel: '首頁', tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }} />
      <Tab.Screen name="Evaluation" component={EvaluationScreen}
        options={{ tabBarLabel: '評選', tabBarIcon: ({ color }) => <Text style={{ color }}>📝</Text> }} />
      <Tab.Screen name="Categories" component={CategoriesScreen}
        options={{ tabBarLabel: '分類', tabBarIcon: ({ color }) => <Text style={{ color }}>📂</Text> }} />
      <Tab.Screen name="Rankings" component={RankingsScreen}
        options={{ tabBarLabel: '排行', tabBarIcon: ({ color }) => <Text style={{ color }}>🏆</Text> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AddStore" component={AddStoreScreen}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 2: Update App.tsx**

```typescript
// App.tsx
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/context/ThemeContext';
import RootNavigator from '@/navigation/RootNavigator';
import { seedCategoriesIfEmpty } from '@/db/categoryRepository';
import { registerBackgroundTask } from '@/tasks/locationTask';

export default function App() {
  useEffect(() => {
    seedCategoriesIfEmpty();
    registerBackgroundTask();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 3: Create placeholder screens** (so navigator compiles)

Create each of these with a minimal placeholder — will be replaced in later tasks:

```typescript
// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
export default function HomeScreen() {
  return <View style={{ flex: 1, backgroundColor: '#0f172a' }}><Text style={{ color: '#fff' }}>Home</Text></View>;
}
```

Repeat the same pattern for: `EvaluationScreen.tsx`, `CategoriesScreen.tsx`, `RankingsScreen.tsx`, `SettingsScreen.tsx`, `AddStoreScreen.tsx`, `StoreDetailScreen.tsx`, `CategoryDetailScreen.tsx`.

- [ ] **Step 4: Create placeholder locationTask**

```typescript
// src/tasks/locationTask.ts
export async function registerBackgroundTask() {
  // implemented in Task 14
}
```

- [ ] **Step 5: Verify app boots**

```bash
npx expo start
```

Expected: App loads, bottom tab bar visible with 4 tabs, no red errors.

- [ ] **Step 6: Commit**

```bash
git add src/navigation/ src/screens/ src/tasks/ App.tsx
git commit -m "feat: add navigation skeleton with 4-tab layout"
```

---

## Task 9: Shared Components (TDD)

**Files:**
- Create: `src/components/HeartRating.tsx`, `src/components/PhotoThumbnail.tsx`, `src/components/StoreCard.tsx`, `src/components/FAB.tsx`
- Test: `__tests__/components/HeartRating.test.tsx`

- [ ] **Step 1: Write HeartRating test**

```typescript
// __tests__/components/HeartRating.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HeartRating from '@/components/HeartRating';

test('renders 5 hearts', () => {
  const { getAllByText } = render(
    <HeartRating value={3} themeColor="#6c63ff" />,
  );
  expect(getAllByText('♥')).toHaveLength(5);
});

test('calls onPress with correct value when tapped', () => {
  const onPress = jest.fn();
  const { getAllByText } = render(
    <HeartRating value={1} themeColor="#6c63ff" onPress={onPress} />,
  );
  fireEvent.press(getAllByText('♥')[2]); // tap 3rd heart
  expect(onPress).toHaveBeenCalledWith(3);
});

test('does not call onPress when readOnly', () => {
  const onPress = jest.fn();
  const { getAllByText } = render(
    <HeartRating value={5} themeColor="#6c63ff" onPress={onPress} readOnly />,
  );
  fireEvent.press(getAllByText('♥')[0]);
  expect(onPress).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest __tests__/components/HeartRating.test.tsx
```

- [ ] **Step 3: Implement HeartRating**

```typescript
// src/components/HeartRating.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  value: number;
  themeColor: string;
  onPress?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

export default function HeartRating({ value, themeColor, onPress, readOnly, size = 16 }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const color = filled ? (value >= 3 ? themeColor : '#ffffff') : '#334155';
        const heart = (
          <Text key={n} style={{ color, fontSize: size }}>♥</Text>
        );
        if (readOnly || !onPress) return heart;
        return (
          <TouchableOpacity key={n} onPress={() => onPress(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            {heart}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest __tests__/components/HeartRating.test.tsx
```

- [ ] **Step 5: Implement PhotoThumbnail**

```typescript
// src/components/PhotoThumbnail.tsx
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface Props {
  uri?: string;
  size?: number;
}

export default function PhotoThumbnail({ uri, size = 52 }: Props) {
  const style = { width: size, height: size, borderRadius: 10 };
  if (uri) {
    return <Image source={{ uri }} style={style} resizeMode="cover" />;
  }
  return (
    <View style={[style, styles.placeholder]}>
      <Text style={styles.icon}>📷</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18, color: '#475569' },
});
```

- [ ] **Step 6: Implement StoreCard**

```typescript
// src/components/StoreCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Store, Category } from '@/types';
import PhotoThumbnail from './PhotoThumbnail';
import HeartRating from './HeartRating';
import { relativeTime } from '@/utils/relativeTime';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  store: Store;
  category?: Category;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function StoreCard({ store, category, onPress, onLongPress }: Props) {
  const { themeColor } = useTheme();
  const subtitle = [category?.name, store.address].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <PhotoThumbnail uri={store.photos[0]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        <HeartRating value={store.rating} themeColor={themeColor} readOnly size={14} />
      </View>
      <Text style={styles.time}>{relativeTime(store.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  info: { flex: 1, minWidth: 0 },
  name: { color: '#f1f5f9', fontWeight: '600', fontSize: 15 },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  time: { color: '#475569', fontSize: 11, flexShrink: 0 },
});
```

- [ ] **Step 7: Implement FAB**

```typescript
// src/components/FAB.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  onPress: () => void;
}

export default function FAB({ onPress }: Props) {
  const { themeColor } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: themeColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.plus}>＋</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plus: { color: '#fff', fontSize: 26, lineHeight: 30 },
});
```

- [ ] **Step 8: Commit**

```bash
git add src/components/ __tests__/components/
git commit -m "feat: add HeartRating, PhotoThumbnail, StoreCard, FAB components"
```

---

## Task 10: HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Implement HomeScreen**

```typescript
// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types';
import { useTheme } from '@/context/ThemeContext';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { themeColor } = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: themeColor }]}>SPARK{'\n'}NOTES</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsText}>⚙️  設定</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 56,
  },
  settingsBtn: {
    marginTop: 48,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsText: { color: '#94a3b8', fontSize: 15, fontWeight: '500' },
});
```

- [ ] **Step 2: Verify in app** — HomeScreen shows big title in theme color and settings button.

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: implement HomeScreen with theme-colored title"
```

---

## Task 11: EvaluationScreen

**Files:**
- Modify: `src/screens/EvaluationScreen.tsx`

- [ ] **Step 1: Implement EvaluationScreen**

```typescript
// src/screens/EvaluationScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, StyleSheet, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Store, Category } from '@/types';
import { getAllStores, searchStores, deleteStore } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import StoreCard from '@/components/StoreCard';
import FAB from '@/components/FAB';

type Nav = StackNavigationProp<RootStackParamList>;

export default function EvaluationScreen() {
  const navigation = useNavigation<Nav>();
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([getAllStores(), getAllCategories()]);
    setStores(s);
    setCategories(c);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!query) { load(); return; }
    searchStores(query).then(setStores);
  }, [query]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const handleLongPress = (store: Store) => {
    Alert.alert('刪除店家', `確定要刪除「${store.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: async () => {
        await deleteStore(store.id);
        load();
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>評選</Text>
        <TouchableOpacity onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSearchVisible((v) => !v);
          if (searchVisible) setQuery('');
        }}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {searchVisible && (
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋店家名稱..."
          placeholderTextColor="#475569"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      )}

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoreCard
            store={item}
            category={categoryMap[item.categoryId]}
            onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>還沒有記錄，點 ＋ 新增第一家店！</Text>}
      />

      <FAB onPress={() => navigation.navigate('AddStore', {})} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  searchIcon: { fontSize: 20 },
  searchInput: {
    backgroundColor: '#1e293b', color: '#f1f5f9',
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15,
  },
  list: { padding: 16, paddingBottom: 80 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
```

- [ ] **Step 2: Verify** — stores list renders, search icon toggles input, FAB floats above tab bar.

- [ ] **Step 3: Commit**

```bash
git add src/screens/EvaluationScreen.tsx
git commit -m "feat: implement EvaluationScreen with search and FAB"
```

---

## Task 12: AddStoreScreen

**Files:**
- Modify: `src/screens/AddStoreScreen.tsx`

- [ ] **Step 1: Implement AddStoreScreen**

```typescript
// src/screens/AddStoreScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { RootStackParamList, Category } from '@/types';
import { getAllCategories } from '@/db/categoryRepository';
import { insertStore, updateStore, getStoreById } from '@/db/storeRepository';
import HeartRating from '@/components/HeartRating';
import { useTheme } from '@/context/ThemeContext';

type RouteType = RouteProp<RootStackParamList, 'AddStore'>;

const PRICE_OPTIONS = ['', '$', '$$', '$$$'];

export default function AddStoreScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { themeColor } = useTheme();
  const isEdit = !!route.params?.storeId;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rating, setRating] = useState<1|2|3|4|5>(3);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    getAllCategories().then((cats) => {
      setCategories(cats);
      if (cats.length && !isEdit) setCategoryId(cats[0].id);
    });
    if (isEdit && route.params.storeId) {
      getStoreById(route.params.storeId).then((store) => {
        if (!store) return;
        setName(store.name);
        setCategoryId(store.categoryId);
        setRating(store.rating);
        setAddress(store.address);
        setLatitude(store.latitude);
        setLongitude(store.longitude);
        setPhotos(store.photos);
        setNotes(store.notes);
        setPriceRange(store.priceRange);
      });
    }
  }, []);

  const pickLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('需要定位權限'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      if (geo) setAddress(`${geo.city ?? ''}${geo.street ?? ''}`);
    } finally {
      setLocating(false);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('請輸入店家名稱'); return; }
    if (!categoryId) { Alert.alert('請選擇分類'); return; }
    if (!address.trim()) { Alert.alert('請輸入地址或使用目前位置'); return; }

    const data = { name: name.trim(), categoryId, rating, address, latitude, longitude, photos, notes, priceRange };
    if (isEdit && route.params.storeId) {
      await updateStore(route.params.storeId, data);
    } else {
      await insertStore(data);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? '編輯店家' : '新增店家'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.save, { color: themeColor }]}>儲存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.label}>店家名稱 *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName}
          placeholder="輸入店家名稱" placeholderTextColor="#475569" />

        <Text style={styles.label}>分類 *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id}
              style={[styles.catChip, categoryId === cat.id && { backgroundColor: themeColor }]}
              onPress={() => setCategoryId(cat.id)}>
              <Text style={styles.catText}>{cat.emoji} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>評分 *</Text>
        <View style={{ marginBottom: 16 }}>
          <HeartRating value={rating} themeColor={themeColor} onPress={(v) => setRating(v as 1|2|3|4|5)} size={28} />
        </View>

        <Text style={styles.label}>地址 *</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress}
          placeholder="輸入地址" placeholderTextColor="#475569" />
        <TouchableOpacity style={styles.locBtn} onPress={pickLocation} disabled={locating}>
          {locating ? <ActivityIndicator color={themeColor} /> :
            <Text style={[styles.locBtnText, { color: themeColor }]}>📍 使用目前位置</Text>}
        </TouchableOpacity>

        <Text style={styles.label}>照片（選填）</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
          <Text style={styles.photoBtnText}>＋ 從相簿選取</Text>
        </TouchableOpacity>
        <ScrollView horizontal style={{ marginBottom: 16 }}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} />
          ))}
        </ScrollView>

        <Text style={styles.label}>備註（選填）</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={notes} onChangeText={setNotes}
          placeholder="心得、注意事項..." placeholderTextColor="#475569" multiline />

        <Text style={styles.label}>價位（選填）</Text>
        <View style={styles.priceRow}>
          {PRICE_OPTIONS.map((p) => (
            <TouchableOpacity key={p}
              style={[styles.priceChip, priceRange === p && { backgroundColor: themeColor }]}
              onPress={() => setPriceRange(p)}>
              <Text style={styles.priceText}>{p || '不填'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  title: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  cancel: { color: '#64748b', fontSize: 16 },
  save: { fontSize: 16, fontWeight: '600' },
  form: { padding: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#1e293b', color: '#f1f5f9',
    borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16,
  },
  catChip: {
    backgroundColor: '#1e293b', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12, marginRight: 8,
  },
  catText: { color: '#f1f5f9', fontSize: 13 },
  locBtn: { alignItems: 'center', marginBottom: 16 },
  locBtnText: { fontSize: 14, fontWeight: '500' },
  photoBtn: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 10,
  },
  photoBtnText: { color: '#64748b', fontSize: 14 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 8 },
  priceRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  priceChip: {
    backgroundColor: '#1e293b', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  priceText: { color: '#f1f5f9', fontSize: 14 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/AddStoreScreen.tsx
git commit -m "feat: implement AddStoreScreen with location, photo picker, and heart rating"
```

---

## Task 13: StoreDetailScreen

**Files:**
- Modify: `src/screens/StoreDetailScreen.tsx`

- [ ] **Step 1: Implement StoreDetailScreen**

```typescript
// src/screens/StoreDetailScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Store, Category } from '@/types';
import { getStoreById } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import HeartRating from '@/components/HeartRating';
import PhotoThumbnail from '@/components/PhotoThumbnail';
import { useTheme } from '@/context/ThemeContext';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'StoreDetail'>;
const { width } = Dimensions.get('window');

export default function StoreDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const { themeColor } = useTheme();
  const [store, setStore] = useState<Store | null>(null);
  const [category, setCategory] = useState<Category | undefined>();

  useFocusEffect(useCallback(() => {
    Promise.all([getStoreById(route.params.storeId), getAllCategories()]).then(([s, cats]) => {
      setStore(s);
      setCategory(cats.find((c) => c.id === s?.categoryId));
    });
  }, [route.params.storeId]));

  if (!store) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AddStore', { storeId: store.id })}>
          <Text style={[styles.edit, { color: themeColor }]}>編輯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {store.photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled style={{ height: 220 }}>
            {store.photos.map((uri, i) => (
              <PhotoThumbnail key={i} uri={uri} size={width} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noPhoto}>
            <Text style={{ color: '#475569', fontSize: 14 }}>沒有照片</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.name}>{store.name}</Text>
          <HeartRating value={store.rating} themeColor={themeColor} readOnly size={20} />

          {category && <Text style={styles.meta}>{category.emoji} {category.name}</Text>}
          {store.priceRange ? <Text style={styles.meta}>💰 {store.priceRange}</Text> : null}

          <TouchableOpacity onPress={() => Linking.openURL(`maps:?q=${encodeURIComponent(store.address)}`)}>
            <Text style={[styles.address, { color: themeColor }]}>📍 {store.address}</Text>
          </TouchableOpacity>

          {store.notes ? (
            <>
              <Text style={styles.sectionTitle}>備註</Text>
              <Text style={styles.notes}>{store.notes}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  back: { color: '#94a3b8', fontSize: 16 },
  edit: { fontSize: 16, fontWeight: '600' },
  noPhoto: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  body: { padding: 20 },
  name: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
  address: { fontSize: 14, marginTop: 12, fontWeight: '500' },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  notes: { color: '#cbd5e1', fontSize: 15, lineHeight: 22 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/StoreDetailScreen.tsx
git commit -m "feat: implement StoreDetailScreen with photo carousel and map link"
```

---

## Task 14: CategoriesScreen + CategoryDetailScreen

**Files:**
- Modify: `src/screens/CategoriesScreen.tsx`, `src/screens/CategoryDetailScreen.tsx`

- [ ] **Step 1: Implement CategoriesScreen**

```typescript
// src/screens/CategoriesScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Alert,
  Modal, TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Category } from '@/types';
import {
  getAllCategories, insertCategory, deleteCategory, updateCategory,
} from '@/db/categoryRepository';
import { getAllStores } from '@/db/storeRepository';
import { useTheme } from '@/context/ThemeContext';

type Nav = StackNavigationProp<RootStackParamList>;

export default function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const { themeColor } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputEmoji, setInputEmoji] = useState('');

  const load = useCallback(async () => {
    const [cats, stores] = await Promise.all([getAllCategories(), getAllStores()]);
    setCategories(cats);
    const c: Record<string, number> = {};
    stores.forEach((s) => { c[s.categoryId] = (c[s.categoryId] ?? 0) + 1; });
    setCounts(c);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => { setEditTarget(null); setInputName(''); setInputEmoji(''); setModalVisible(true); };
  const openEdit = (cat: Category) => { setEditTarget(cat); setInputName(cat.name); setInputEmoji(cat.emoji); setModalVisible(true); };

  const handleSave = async () => {
    if (!inputName.trim()) { Alert.alert('請輸入分類名稱'); return; }
    if (editTarget) {
      await updateCategory(editTarget.id, inputName.trim(), inputEmoji || '📌');
    } else {
      await insertCategory(inputName.trim(), inputEmoji || '📌');
    }
    setModalVisible(false);
    load();
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('刪除分類', `確定要刪除「${cat.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>分類</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text style={[styles.addBtn, { color: themeColor }]}>＋ 新增</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chip}
            onPress={() => navigation.navigate('CategoryDetail', { categoryId: item.id })}
            onLongPress={() => {
              Alert.alert(item.name, '', [
                { text: '編輯', onPress: () => openEdit(item) },
                { text: '刪除', style: 'destructive', onPress: () => handleDelete(item) },
                { text: '取消', style: 'cancel' },
              ]);
            }}
          >
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <Text style={styles.chipName}>{item.name}</Text>
            <Text style={styles.chipCount}>{counts[item.id] ?? 0} 家</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editTarget ? '編輯分類' : '新增分類'}</Text>
            <TextInput style={styles.modalInput} value={inputEmoji}
              onChangeText={setInputEmoji} placeholder="Emoji 圖示" placeholderTextColor="#475569" />
            <TextInput style={styles.modalInput} value={inputName}
              onChangeText={setInputName} placeholder="分類名稱" placeholderTextColor="#475569" />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={[styles.modalSave, { color: themeColor }]}>儲存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  addBtn: { fontSize: 15, fontWeight: '600' },
  grid: { padding: 12 },
  chip: {
    flex: 1, margin: 6, backgroundColor: '#111827', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  chipEmoji: { fontSize: 28, marginBottom: 6 },
  chipName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  chipCount: { color: '#64748b', fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#0f172a', color: '#f1f5f9',
    borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 8 },
  modalCancel: { color: '#64748b', fontSize: 16 },
  modalSave: { fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Implement CategoryDetailScreen**

```typescript
// src/screens/CategoryDetailScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Store, Category } from '@/types';
import { getStoresByCategory } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import StoreCard from '@/components/StoreCard';
import { useTheme } from '@/context/ThemeContext';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'CategoryDetail'>;

export default function CategoryDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const { themeColor } = useTheme();
  const [stores, setStores] = useState<Store[]>([]);
  const [category, setCategory] = useState<Category | undefined>();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useFocusEffect(useCallback(() => {
    Promise.all([
      getStoresByCategory(route.params.categoryId, sortOrder),
      getAllCategories(),
    ]).then(([s, cats]) => {
      setStores(s);
      setCategory(cats.find((c) => c.id === route.params.categoryId));
    });
  }, [route.params.categoryId, sortOrder]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{category ? `${category.emoji} ${category.name}` : ''}</Text>
        <TouchableOpacity onPress={() => setSortOrder((o) => o === 'desc' ? 'asc' : 'desc')}>
          <Text style={[styles.sort, { color: themeColor }]}>
            {sortOrder === 'desc' ? '新→舊' : '舊→新'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoreCard
            store={item}
            category={category}
            onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>這個分類還沒有記錄</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  back: { color: '#94a3b8', fontSize: 15 },
  title: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  sort: { fontSize: 14, fontWeight: '500' },
  list: { padding: 16 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/CategoriesScreen.tsx src/screens/CategoryDetailScreen.tsx
git commit -m "feat: implement CategoriesScreen and CategoryDetailScreen"
```

---

## Task 15: RankingsScreen

**Files:**
- Modify: `src/screens/RankingsScreen.tsx`

- [ ] **Step 1: Implement RankingsScreen**

```typescript
// src/screens/RankingsScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Store, Category } from '@/types';
import { getStoresFiltered } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import StoreCard from '@/components/StoreCard';
import { useTheme } from '@/context/ThemeContext';

type Nav = StackNavigationProp<RootStackParamList>;

export default function RankingsScreen() {
  const navigation = useNavigation<Nav>();
  const { themeColor } = useTheme();
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([5]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const load = useCallback(async () => {
    const cats = await getAllCategories();
    setCategories(cats);
    const catIds = selectedCats.length ? selectedCats : cats.map((c) => c.id);
    const s = await getStoresFiltered(selectedRatings, catIds);
    setStores(s);
  }, [selectedRatings, selectedCats]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleRating = (r: number) =>
    setSelectedRatings((prev) =>
      prev.includes(r) ? (prev.length > 1 ? prev.filter((x) => x !== r) : prev) : [...prev, r],
    );

  const toggleCat = (id: string) =>
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>排行</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[5, 4, 3, 2, 1].map((r) => (
            <TouchableOpacity key={r}
              style={[styles.chip, selectedRatings.includes(r) && { backgroundColor: themeColor }]}
              onPress={() => toggleRating(r)}>
              <Text style={styles.chipText}>{'♥'.repeat(r)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id}
              style={[styles.chip, selectedCats.includes(cat.id) && { backgroundColor: themeColor }]}
              onPress={() => toggleCat(cat.id)}>
              <Text style={styles.chipText}>{cat.emoji} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoreCard
            store={item}
            category={categoryMap[item.categoryId]}
            onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>沒有符合條件的店家</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  filterSection: { paddingTop: 8 },
  filterRow: { paddingHorizontal: 12, marginBottom: 6 },
  chip: {
    backgroundColor: '#1e293b', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 12, marginRight: 8,
  },
  chipText: { color: '#f1f5f9', fontSize: 13 },
  list: { padding: 16 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/RankingsScreen.tsx
git commit -m "feat: implement RankingsScreen with heart × category filter"
```

---

## Task 16: SettingsScreen

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Implement SettingsScreen**

```typescript
// src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch, Alert,
  ScrollView, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllStores, insertStore } from '@/db/storeRepository';
import { getAllCategories, insertCategory } from '@/db/categoryRepository';
import { getSettings, saveSettings } from '@/storage/settingsStorage';
import { serializeBackup, parseBackup } from '@/utils/exportImport';
import type { AppSettings } from '@/types';
import { useTheme } from '@/context/ThemeContext';

const PRESET_COLORS = ['#6c63ff', '#ef4444', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'];
const THRESHOLD_OPTIONS = [1, 2, 3];
const RADIUS_OPTIONS = [100, 300, 500, 1000];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { themeColor, setThemeColor } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => { getSettings().then(setSettings); }, []);

  const updateSettings = async (patch: Partial<AppSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  const handleExport = async () => {
    try {
      const [stores, categories] = await Promise.all([getAllStores(), getAllCategories()]);
      const json = serializeBackup(stores, categories);
      const path = `${FileSystem.cacheDirectory}sparknotes-backup.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: '匯出 SPARKNOTES 備份' });
    } catch {
      Alert.alert('匯出失敗', '請稍後再試');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const { stores, categories } = parseBackup(json);
      Alert.alert('確認匯入', `將匯入 ${stores.length} 家店和 ${categories.length} 個分類，是否繼續？`, [
        { text: '取消', style: 'cancel' },
        { text: '匯入', onPress: async () => {
          for (const cat of categories) await insertCategory(cat.name, cat.emoji);
          for (const store of stores) {
            const { id, createdAt, ...data } = store;
            await insertStore(data);
          }
          Alert.alert('匯入成功');
        }},
      ]);
    } catch {
      Alert.alert('匯入失敗', '請確認檔案格式正確');
    }
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Theme Color */}
        <Text style={styles.sectionLabel}>主題顏色</Text>
        <View style={styles.card}>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => { setThemeColor(c); updateSettings({ themeColor: c }); }}>
                <View style={[styles.colorDot, { backgroundColor: c },
                  themeColor === c && styles.colorDotSelected]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>雷店預警通知</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>通知開關</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
              trackColor={{ true: themeColor }}
            />
          </View>
          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.rowLabel}>警示星級門檻</Text>
            <View style={styles.optionRow}>
              {THRESHOLD_OPTIONS.map((t) => (
                <TouchableOpacity key={t}
                  style={[styles.optionChip, settings.alertRatingThreshold === t && { backgroundColor: themeColor }]}
                  onPress={() => updateSettings({ alertRatingThreshold: t })}>
                  <Text style={styles.optionText}>≤{t}心</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.rowLabel}>警示半徑</Text>
            <View style={styles.optionRow}>
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity key={r}
                  style={[styles.optionChip, settings.alertRadiusMeters === r && { backgroundColor: themeColor }]}
                  onPress={() => updateSettings({ alertRadiusMeters: r })}>
                  <Text style={styles.optionText}>{r >= 1000 ? '1km' : `${r}m`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Export / Import */}
        <Text style={styles.sectionLabel}>資料管理</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleExport}>
            <Text style={styles.rowLabel}>📤 匯出資料</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, styles.borderTop]} onPress={handleImport}>
            <Text style={styles.rowLabel}>📥 匯入資料</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  back: { color: '#94a3b8', fontSize: 16, width: 60 },
  title: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 20 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, overflow: 'hidden' },
  colorRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  borderTop: { borderTopWidth: 1, borderTopColor: '#334155' },
  rowLabel: { color: '#e2e8f0', fontSize: 15 },
  chevron: { color: '#475569', fontSize: 18 },
  optionRow: { flexDirection: 'row', gap: 6 },
  optionChip: { backgroundColor: '#334155', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  optionText: { color: '#f1f5f9', fontSize: 12 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "feat: implement SettingsScreen with theme, notifications, export/import"
```

---

## Task 17: Background Geofencing Task

**Files:**
- Modify: `src/tasks/locationTask.ts`, `app.json`

- [ ] **Step 1: Update app.json for background location + notifications**

Add to `app.json` under `expo`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "SPARKNOTES 需要持續存取位置，以便在接近雷店時發出警示通知。",
          "isAndroidBackgroundLocationEnabled": true
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#6c63ff"
        }
      ]
    ],
    "android": {
      "permissions": ["ACCESS_BACKGROUND_LOCATION"]
    }
  }
}
```

- [ ] **Step 2: Implement locationTask.ts**

```typescript
// src/tasks/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getLowRatedStores } from '@/db/storeRepository';
import { getSettings } from '@/storage/settingsStorage';
import { haversineMeters } from '@/utils/haversine';

const TASK_NAME = 'SPARKNOTES_LOCATION_TASK';
const lastNotified: Record<string, number> = {};
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

TaskManager.defineTask(TASK_NAME, async ({ data, error }: any) => {
  if (error || !data?.locations?.length) return;
  const { latitude, longitude } = data.locations[0].coords;
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const stores = await getLowRatedStores(settings.alertRatingThreshold);
  const now = Date.now();

  for (const store of stores) {
    const dist = Math.round(haversineMeters(latitude, longitude, store.latitude, store.longitude));
    if (dist > settings.alertRadiusMeters) continue;
    if (now - (lastNotified[store.id] ?? 0) < COOLDOWN_MS) continue;
    lastNotified[store.id] = now;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ 雷店就在附近！',
        body: `${store.name}（${store.rating}心）距離你只有 ${dist}m，小心別踩雷`,
        sound: true,
      },
      trigger: null,
    });
  }
});

export async function registerBackgroundTask() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existingStatus !== 'granted'
      ? (await Notifications.requestPermissionsAsync()).status
      : existingStatus;
  if (finalStatus !== 'granted') return;

  const { status: locStatus } = await Location.requestBackgroundPermissionsAsync();
  if (locStatus !== 'granted') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 50,
      deferredUpdatesInterval: 60_000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'SPARKNOTES',
        notificationBody: '正在背景監測附近雷店',
        notificationColor: '#6c63ff',
      },
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/tasks/locationTask.ts app.json
git commit -m "feat: implement background geofencing with local notifications"
```

---

## Task 18: Final Integration

- [ ] **Step 1: Run all tests**

```bash
npx jest --coverage
```

Expected: All tests pass.

- [ ] **Step 2: Start app and smoke test**

```bash
npx expo start
```

Manual checklist:
- [ ] HomeScreen: big title shows in theme color, settings button navigates
- [ ] EvaluationScreen: empty state visible, FAB opens AddStore modal
- [ ] AddStore: fill all fields, save, store appears in list
- [ ] Store card: photo thumbnail (or placeholder), hearts colored correctly (3+ = theme, 1-2 = white)
- [ ] StoreDetail: opens, edit navigates back to AddStore prefilled, address tap opens maps
- [ ] Categories: chips visible, long-press shows edit/delete, add category works
- [ ] CategoryDetail: shows correct stores, sort toggle works
- [ ] Rankings: heart filter and category filter update list
- [ ] Settings: color dot changes theme instantly, export produces JSON file, import reads it back
- [ ] (Device only) Background location permission requested on first launch

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete SPARKNOTES app — all screens and background geofencing"
```
