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
