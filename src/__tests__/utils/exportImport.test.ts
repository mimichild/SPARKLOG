import { serializeBackup, parseBackup, photoFilename, stripPhotoPaths, resolvePhotoPaths } from '@/utils/exportImport';
import type { Store, Category } from '@/types';

const cat: Category = { id: 'c1', name: '咖啡廳', emoji: '☕', order: 0 };
const store: Store = {
  id: 's1', name: '路易莎', categoryId: 'c1', rating: 5,
  latitude: 25.03, longitude: 121.5, address: '台北',
  photos: [], event: '跟朋友一起喝咖啡', notes: '老闆很親切',
  createdAt: '2026-01-01T00:00:00Z',
};

test('serializeBackup produces valid JSON string', () => {
  const json = serializeBackup([store], [cat]);
  const parsed = JSON.parse(json);
  expect(parsed.version).toBe(2);
  expect(parsed.stores).toHaveLength(1);
  expect(parsed.categories).toHaveLength(1);
});

test('parseBackup round-trips correctly', () => {
  const json = serializeBackup([store], [cat]);
  const result = parseBackup(json);
  expect(result.stores[0].name).toBe('路易莎');
  expect(result.stores[0].event).toBe('跟朋友一起喝咖啡');
  expect(result.categories[0].emoji).toBe('☕');
});

test('parseBackup throws on invalid JSON', () => {
  expect(() => parseBackup('not json')).toThrow();
});

test('parseBackup throws on wrong version', () => {
  const bad = JSON.stringify({ version: 99, stores: [], categories: [] });
  expect(() => parseBackup(bad)).toThrow('Unsupported backup version');
});

test('photoFilename extracts the last path segment from a file URI', () => {
  expect(photoFilename('file:///data/user/0/com.sparklog.app/files/photos/abc.jpg')).toBe('abc.jpg');
});

test('photoFilename returns bare filenames unchanged', () => {
  expect(photoFilename('abc.jpg')).toBe('abc.jpg');
});

test('stripPhotoPaths replaces each photo URI with its bare filename', () => {
  const withPhotos: Store = { ...store, photos: ['file:///docs/photos/a.jpg', 'file:///docs/photos/b.jpg'] };
  const result = stripPhotoPaths(withPhotos);
  expect(result.photos).toEqual(['a.jpg', 'b.jpg']);
});

test('resolvePhotoPaths prefixes each bare filename with the given directory', () => {
  const withFilenames: Store = { ...store, photos: ['a.jpg', 'b.jpg'] };
  const result = resolvePhotoPaths(withFilenames, 'file:///docs/photos/');
  expect(result.photos).toEqual(['file:///docs/photos/a.jpg', 'file:///docs/photos/b.jpg']);
});
