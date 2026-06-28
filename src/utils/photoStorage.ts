import * as FileSystem from 'expo-file-system/legacy';

export const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

export async function ensurePhotosDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
}

export async function deletePhotoFiles(photos: string[]): Promise<void> {
  await Promise.all(
    photos.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})),
  );
}
