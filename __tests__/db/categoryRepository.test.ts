jest.mock('expo-sqlite');
jest.mock('@/db/database', () => ({
  getDb: jest.fn(),
}));

import { getDb } from '@/db/database';
import {
  getAllCategories,
  insertCategory,
  deleteCategory,
  updateCategory,
  seedCategoriesIfEmpty,
} from '@/db/categoryRepository';

const mockDb = {
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDb as jest.Mock).mockResolvedValue(mockDb);
});

test('getAllCategories returns categories ordered by order ASC', async () => {
  const cats = [
    { id: '1', name: '餐廳', emoji: '🍽', order: 0 },
    { id: '2', name: '咖啡廳', emoji: '☕', order: 1 },
  ];
  mockDb.getAllAsync.mockResolvedValue(cats);
  const result = await getAllCategories();
  expect(result).toEqual(cats);
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(
    expect.stringContaining('ORDER BY "order" ASC'),
  );
});

test('insertCategory returns new category with id', async () => {
  mockDb.getAllAsync.mockResolvedValue([{ max: 2 }]);
  mockDb.runAsync.mockResolvedValue(undefined);
  const result = await insertCategory('新分類', '🆕');
  expect(result.id).toBeTruthy();
  expect(result.name).toBe('新分類');
  expect(result.emoji).toBe('🆕');
  expect(result.order).toBe(3);
});

test('insertCategory sets order to 0 when table is empty', async () => {
  mockDb.getAllAsync.mockResolvedValue([{ max: null }]);
  mockDb.runAsync.mockResolvedValue(undefined);
  const result = await insertCategory('第一個', '🎉');
  expect(result.order).toBe(0);
});

test('deleteCategory calls DELETE with correct id', async () => {
  mockDb.runAsync.mockResolvedValue(undefined);
  await deleteCategory('cat-123');
  expect(mockDb.runAsync).toHaveBeenCalledWith(
    'DELETE FROM categories WHERE id = ?', ['cat-123'],
  );
});

test('updateCategory calls UPDATE with name and emoji', async () => {
  mockDb.runAsync.mockResolvedValue(undefined);
  await updateCategory('cat-1', '新名稱', '🎊');
  expect(mockDb.runAsync).toHaveBeenCalledWith(
    'UPDATE categories SET name = ?, emoji = ? WHERE id = ?',
    ['新名稱', '🎊', 'cat-1'],
  );
});

test('seedCategoriesIfEmpty does nothing when categories exist', async () => {
  mockDb.getAllAsync.mockResolvedValue([{ count: 3 }]);
  await seedCategoriesIfEmpty();
  expect(mockDb.runAsync).not.toHaveBeenCalled();
});

test('seedCategoriesIfEmpty inserts default categories when empty', async () => {
  mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
  mockDb.runAsync.mockResolvedValue(undefined);
  await seedCategoriesIfEmpty();
  expect(mockDb.runAsync).toHaveBeenCalledTimes(6);
});
