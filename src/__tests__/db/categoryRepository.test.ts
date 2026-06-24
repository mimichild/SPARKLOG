jest.mock('expo-sqlite');
jest.mock('@/db/database', () => ({ getDb: jest.fn() }));

import { getDb } from '@/db/database';
import {
  seedCategoriesIfEmpty, getAllCategories, insertCategory, updateCategory, deleteCategory,
} from '@/db/categoryRepository';

const mockDb = { getAllAsync: jest.fn(), runAsync: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockResolvedValue(mockDb);
});

test('seedCategoriesIfEmpty inserts 5 defaults when table is empty', async () => {
  mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
  await seedCategoriesIfEmpty();
  expect(mockDb.runAsync).toHaveBeenCalledTimes(5);
});

test('seedCategoriesIfEmpty does nothing when categories already exist', async () => {
  mockDb.getAllAsync.mockResolvedValue([{ count: 3 }]);
  await seedCategoriesIfEmpty();
  expect(mockDb.runAsync).not.toHaveBeenCalled();
});

test('getAllCategories orders by "order" ascending', async () => {
  mockDb.getAllAsync.mockResolvedValue([]);
  await getAllCategories();
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY "order" ASC'));
});

test('insertCategory returns category with generated id', async () => {
  mockDb.getAllAsync.mockResolvedValue([{ max: 4 }]);
  mockDb.runAsync.mockResolvedValue(undefined);
  const cat = await insertCategory('運動用品', '🏋️');
  expect(cat.id).toBeTruthy();
  expect(cat.order).toBe(5);
});

test('updateCategory calls UPDATE with correct params', async () => {
  mockDb.runAsync.mockResolvedValue(undefined);
  await updateCategory('c1', '新名稱', '🆕');
  expect(mockDb.runAsync).toHaveBeenCalledWith(
    'UPDATE categories SET name = ?, emoji = ? WHERE id = ?', ['新名稱', '🆕', 'c1'],
  );
});

test('deleteCategory calls DELETE with correct id', async () => {
  mockDb.runAsync.mockResolvedValue(undefined);
  await deleteCategory('c1');
  expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM categories WHERE id = ?', ['c1']);
});
