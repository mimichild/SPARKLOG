import JSZip from 'jszip';
import { createBackupZip, extractBackupZip } from '@/utils/backupZip';

test('createBackupZip writes manifest and photos into a zip archive', async () => {
  const manifest = JSON.stringify({ version: 2, stores: [] });
  const zipBase64 = await createBackupZip(manifest, [
    { name: 'a.jpg', base64: 'ZmFrZS1pbWFnZS1ieXRlcw==' },
  ]);

  const zip = await JSZip.loadAsync(zipBase64, { base64: true });
  expect(await zip.file('backup.json')!.async('string')).toBe(manifest);
  expect(await zip.file('photos/a.jpg')!.async('base64')).toBe('ZmFrZS1pbWFnZS1ieXRlcw==');
});

test('extractBackupZip round-trips manifest and photos created by createBackupZip', async () => {
  const manifest = JSON.stringify({ version: 2, stores: [{ name: 'test' }] });
  const zipBase64 = await createBackupZip(manifest, [
    { name: 'a.jpg', base64: 'ZmFrZS1pbWFnZS1ieXRlcw==' },
    { name: 'b.jpg', base64: 'YW5vdGhlci1mYWtlLWltYWdl' },
  ]);

  const result = await extractBackupZip(zipBase64);

  expect(result.manifest).toBe(manifest);
  expect(result.photos).toHaveLength(2);
  expect(result.photos).toEqual(
    expect.arrayContaining([
      { name: 'a.jpg', base64: 'ZmFrZS1pbWFnZS1ieXRlcw==' },
      { name: 'b.jpg', base64: 'YW5vdGhlci1mYWtlLWltYWdl' },
    ]),
  );
});

test('extractBackupZip drops photo entries that escape the photos/ directory via ../ segments', async () => {
  const zip = new JSZip();
  zip.file('backup.json', '{}');
  zip.file('photos/../../etc/evil.jpg', 'cGF5bG9hZA==', { base64: true });
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  const result = await extractBackupZip(zipBase64);

  expect(result.photos).toEqual([]);
});

test('extractBackupZip flattens nested subfolders to a bare filename', async () => {
  const zip = new JSZip();
  zip.file('backup.json', '{}');
  zip.file('photos/sub/cute.jpg', 'cGF5bG9hZA==', { base64: true });
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  const result = await extractBackupZip(zipBase64);

  expect(result.photos).toEqual([{ name: 'cute.jpg', base64: 'cGF5bG9hZA==' }]);
});

test('extractBackupZip drops photo entries with names containing unsafe characters', async () => {
  const zip = new JSZip();
  zip.file('backup.json', '{}');
  zip.file('photos/weird name!.jpg', 'cGF5bG9hZA==', { base64: true });
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  const result = await extractBackupZip(zipBase64);

  expect(result.photos).toEqual([]);
});

test('extractBackupZip returns an empty photos array when the zip has no photos folder', async () => {
  const manifest = JSON.stringify({ version: 2, stores: [] });
  const zipBase64 = await createBackupZip(manifest, []);

  const result = await extractBackupZip(zipBase64);

  expect(result.manifest).toBe(manifest);
  expect(result.photos).toEqual([]);
});
