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
