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
