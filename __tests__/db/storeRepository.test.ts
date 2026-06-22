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
