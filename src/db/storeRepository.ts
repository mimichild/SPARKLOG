import { v4 as uuid } from 'uuid';
import { getDb } from './database';
import { getAllCategories } from './categoryRepository';
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

export async function seedSampleStoresIfEmpty(): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM stores');
  if (rows[0].count > 0) return;

  const categories = await getAllCategories();
  const byName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  const SAMPLE_STORES: Omit<Store, 'id' | 'createdAt'>[] = [
    {
      name: '路易莎咖啡 信義店', categoryId: byName['咖啡廳'], rating: 5,
      latitude: 25.0340, longitude: 121.5645, address: '台北市信義區松仁路',
      photos: [], event: '跟朋友一起喝咖啡聊天', notes: '氣氛很好，咖啡也不錯，老闆人很親切',
    },
    {
      name: '鼎泰豐 信義本店', categoryId: byName['餐廳'], rating: 5,
      latitude: 25.0330, longitude: 121.5550, address: '台北市信義區信義路二段',
      photos: [], event: '', notes: '小籠包必點，服務一流，但要排隊',
    },
    {
      name: '五十嵐 市府店', categoryId: byName['飲料店'], rating: 4,
      latitude: 25.0420, longitude: 121.5630, address: '台北市信義區市府路',
      photos: [], event: '', notes: '珍珠奶茶很順口',
    },
    {
      name: 'UNIQLO 統一時代店', categoryId: byName['服飾店'], rating: 3,
      latitude: 25.0410, longitude: 121.5680, address: '台北市信義區忠孝東路五段',
      photos: [], event: '', notes: '款式普通，CP值還行',
    },
    {
      name: '八方雲集 永吉店', categoryId: byName['餐廳'], rating: 2,
      latitude: 25.0460, longitude: 121.5720, address: '台北市信義區永吉路',
      photos: [], event: '跟同事一起吃午餐', notes: '踩雷，水餃皮破掉，服務態度也不好',
    },
    {
      name: '不知名手搖飲店', categoryId: byName['飲料店'], rating: 1,
      latitude: 25.0380, longitude: 121.5600, address: '台北市信義區莊敬路',
      photos: [], event: '買到喝壞肚子的飲料', notes: '絕對不要再去，衛生有問題',
    },
    {
      name: '誠品書店旁甜點店', categoryId: byName['甜點店'], rating: 4,
      latitude: 25.0395, longitude: 121.5670, address: '台北市信義區松高路',
      photos: [], event: '', notes: '草莓蛋糕很新鮮，價格偏高但值得',
    },
    {
      name: '二手衣選物店', categoryId: byName['服飾店'], rating: 2,
      latitude: 25.0355, longitude: 121.5590, address: '台北市信義區基隆路一段',
      photos: [], event: '', notes: '東西舊舊的，不太划算',
    },
  ];

  for (const store of SAMPLE_STORES) {
    if (!store.categoryId) continue;
    await insertStore(store);
  }
}
