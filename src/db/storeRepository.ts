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

export async function getStoresFiltered(minRating: number, categoryIds: string[]): Promise<Store[]> {
  const db = await getDb();
  const params: any[] = [minRating];
  let sql = 'SELECT * FROM stores WHERE rating >= ?';
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
  const rows = await db.getAllAsync('SELECT * FROM stores WHERE rating <= ?', [threshold]);
  return rows.map(rowToStore);
}

export async function insertStore(data: Omit<Store, 'id' | 'createdAt'>): Promise<Store> {
  const db = await getDb();
  const id = uuid();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO stores (id, name, categoryId, rating, latitude, longitude, address, photos, event, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.categoryId, data.rating, data.latitude, data.longitude,
     data.address, JSON.stringify(data.photos), data.event, data.notes, createdAt],
  );
  return { ...data, id, createdAt };
}

export async function updateStore(id: string, data: Omit<Store, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE stores SET name=?, categoryId=?, rating=?, latitude=?, longitude=?,
     address=?, photos=?, event=?, notes=? WHERE id=?`,
    [data.name, data.categoryId, data.rating, data.latitude, data.longitude,
     data.address, JSON.stringify(data.photos), data.event, data.notes, id],
  );
}

export async function deleteStore(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM stores WHERE id = ?', [id]);
}

export async function deleteAllStores(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM stores');
}

const SAMPLE_STORE_NAMES = [
  '路易莎咖啡 信義店',
  '鼎泰豐 信義本店',
  '五十嵐 市府店',
  'UNIQLO 統一時代店',
  '八方雲集 永吉店',
  '不知名手搖飲店',
  '誠品書店旁甜點店',
  '二手衣選物店',
];

export async function removeSampleStoresIfPresent(): Promise<void> {
  const db = await getDb();
  const placeholders = SAMPLE_STORE_NAMES.map(() => '?').join(',');
  await db.runAsync(`DELETE FROM stores WHERE name IN (${placeholders})`, SAMPLE_STORE_NAMES);
}
