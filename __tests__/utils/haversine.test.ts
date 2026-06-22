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
