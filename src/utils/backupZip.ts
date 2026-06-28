import JSZip from 'jszip';

export interface BackupPhoto {
  name: string;
  base64: string;
}

export async function createBackupZip(manifest: string, photos: BackupPhoto[]): Promise<string> {
  const zip = new JSZip();
  zip.file('backup.json', manifest);
  for (const photo of photos) {
    zip.file(`photos/${photo.name}`, photo.base64, { base64: true });
  }
  return zip.generateAsync({ type: 'base64' });
}

export async function extractBackupZip(zipBase64: string): Promise<{ manifest: string; photos: BackupPhoto[] }> {
  const zip = await JSZip.loadAsync(zipBase64, { base64: true });
  const manifestFile = zip.file('backup.json');
  if (!manifestFile) throw new Error('Backup zip is missing backup.json');
  const manifest = await manifestFile.async('string');

  const photos: BackupPhoto[] = [];
  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir || !path.startsWith('photos/')) continue;
    const rawName = path.slice('photos/'.length);
    const name = rawName.split('/').pop() ?? '';
    if (!/^[\w.-]+$/.test(name) || name === '.' || name === '..') continue;
    const base64 = await file.async('base64');
    photos.push({ name, base64 });
  }

  return { manifest, photos };
}
