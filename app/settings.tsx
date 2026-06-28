import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/store/settingsStore';
import { getAllStores, insertStore, deleteAllStores } from '@/db/storeRepository';
import { getAllCategories, insertCategory, deleteAllCategories } from '@/db/categoryRepository';
import { serializeBackup, parseBackup, photoFilename, stripPhotoPaths, resolvePhotoPaths } from '@/utils/exportImport';
import { createBackupZip, extractBackupZip } from '@/utils/backupZip';
import { PHOTOS_DIR, ensurePhotosDir, deletePhotoFiles } from '@/utils/photoStorage';
import type { Store, Category } from '@/types';

function getFriendlyFolderName(directoryUri: string): string {
  try {
    const decoded = decodeURIComponent(directoryUri);
    const lastSegment = decoded.split(':').pop() ?? decoded;
    return lastSegment.split('/').filter(Boolean).pop() || '所選資料夾';
  } catch {
    return '所選資料夾';
  }
}

const PRESET_COLORS = [
  '#F0ABA7', '#EE9999', '#DAB7A7', '#CBB79F', '#F2E9A2', '#BAD8F3',
  '#7C2D43', '#A6C7E7', '#B7E2D3', '#FED2DC', '#F8D7B0', '#D8C4E9',
];
const RATING_OPTIONS = [
  { label: '1星', value: 1 },
  { label: '2星以下', value: 2 },
  { label: '3星以下', value: 3 },
];
const RADIUS_OPTIONS = [
  { label: '100m', value: 100 },
  { label: '300m', value: 300 },
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    themeColor, radarEnabled, radarRatingThreshold, radarRadiusMeters,
    setThemeColor, setRadarEnabled, setRadarRatingThreshold, setRadarRadiusMeters,
  } = useSettingsStore();
  const [customHex, setCustomHex] = useState('');
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = (label: string) => {
    setProgress(0);
    setProgressLabel(label);
    setProgressModalVisible(true);
    progressInterval.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.ceil(Math.random() * 6) : p));
    }, 40);
  };

  const finishProgress = async () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    setProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setProgressModalVisible(false);
  };

  const abortProgress = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    setProgressModalVisible(false);
  };

  const handleApplyCustomHex = () => {
    const hex = customHex.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      Alert.alert('色碼格式錯誤', '請輸入正確的色碼，例如 #ff0000');
      return;
    }
    setThemeColor(hex);
  };

  const runExport = async (directoryUri: string, folderName: string) => {
    startProgress('匯出中，請稍候...');
    try {
      const [stores, categories] = await Promise.all([getAllStores(), getAllCategories()]);

      const photoResults = await Promise.allSettled(
        stores.flatMap((s) => s.photos).map(async (uri) => ({
          name: photoFilename(uri),
          base64: await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
        })),
      );
      const photoEntries = photoResults
        .filter((r): r is PromiseFulfilledResult<{ name: string; base64: string }> => r.status === 'fulfilled')
        .map((r) => r.value);

      const json = serializeBackup(stores.map(stripPhotoPaths), categories);
      const zipBase64 = await createBackupZip(json, photoEntries);

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        directoryUri, 'sparknotes-backup', 'application/zip',
      );
      await FileSystem.writeAsStringAsync(fileUri, zipBase64, { encoding: FileSystem.EncodingType.Base64 });

      await finishProgress();

      Alert.alert('匯出完成', `備份已儲存至「${folderName}」`);
      await Notifications.scheduleNotificationAsync({
        content: { title: '備份已完成', body: `備份已匯出至「${folderName}」` },
        trigger: null,
      });
    } catch {
      abortProgress();
      Alert.alert('匯出失敗', '請稍後再試');
    }
  };

  const handleExport = async () => {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return;
    const folderName = getFriendlyFolderName(permissions.directoryUri);

    Alert.alert('匯出備份', `確定要將備份匯出到「${folderName}」嗎？`, [
      { text: '取消', style: 'cancel' },
      { text: '確認', onPress: () => runExport(permissions.directoryUri, folderName) },
    ]);
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    });
    if (result.canceled || !result.assets?.length) return;

    let stores: Store[];
    let categories: Category[];
    let photos: { name: string; base64: string }[];
    try {
      const zipBase64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const extracted = await extractBackupZip(zipBase64);
      photos = extracted.photos;
      ({ stores, categories } = parseBackup(extracted.manifest));
    } catch {
      Alert.alert('匯入失敗', '備份檔案無法讀取，請確認檔案是否正確');
      return;
    }

    const importCategoriesAndStores = async () => {
      await ensurePhotosDir();
      for (const photo of photos) {
        await FileSystem.writeAsStringAsync(`${PHOTOS_DIR}${photo.name}`, photo.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const idMap: Record<string, string> = {};
      for (const c of categories) {
        const inserted = await insertCategory(c.name, c.emoji);
        idMap[c.id] = inserted.id;
      }
      for (const s of stores) {
        const { id: _id, createdAt: _createdAt, ...rest } = resolvePhotoPaths(s, PHOTOS_DIR);
        const mappedCategoryId = idMap[s.categoryId] ?? s.categoryId;
        await insertStore({ ...rest, categoryId: mappedCategoryId });
      }
    };

    Alert.alert('匯入資料', '要合併還是覆蓋現有資料？', [
      { text: '取消', style: 'cancel' },
      {
        text: '合併', onPress: async () => {
          startProgress('匯入中，請稍候...');
          try {
            await importCategoriesAndStores();
            await finishProgress();
            Alert.alert('匯入完成');
          } catch {
            abortProgress();
            Alert.alert('匯入失敗', '請稍後再試');
          }
        },
      },
      {
        text: '覆蓋', style: 'destructive', onPress: async () => {
          startProgress('匯入中，請稍候...');
          try {
            const existingStores = await getAllStores();
            await deleteAllStores();
            await deletePhotoFiles(existingStores.flatMap((s) => s.photos));
            await deleteAllCategories();
            await importCategoriesAndStores();
            await finishProgress();
            Alert.alert('匯入完成');
          } catch {
            abortProgress();
            Alert.alert('匯入失敗', '請稍後再試');
          }
        },
      },
    ]);
  };

  const handleClearAllStores = () => {
    Alert.alert('清除所有店家資料', '確定要刪除所有店家紀錄嗎？此操作無法復原（分類不會被刪除）。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除', style: 'destructive', onPress: async () => {
          const existingStores = await getAllStores();
          await deleteAllStores();
          await deletePhotoFiles(existingStores.flatMap((s) => s.photos));
          Alert.alert('已清除所有店家資料');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.section}>主題色</Text>
        <View style={styles.colorGrid}>
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, themeColor === c && styles.colorDotActive]}
              onPress={() => setThemeColor(c)}
            >
              {themeColor === c && <Text style={styles.colorCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>自訂色碼</Text>
        <View style={styles.customColorRow}>
          <TextInput
            style={styles.customColorInput}
            value={customHex}
            onChangeText={setCustomHex}
            placeholder="#ff0000"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: themeColor }]} onPress={handleApplyCustomHex}>
            <Text style={styles.applyBtnText}>套用</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>心級雷達</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>開啟雷店預警通知</Text>
          <Switch value={radarEnabled} onValueChange={setRadarEnabled} trackColor={{ true: themeColor }} />
        </View>

        <Text style={styles.subLabel}>幾顆心以下開啟雷達</Text>
        <View style={styles.optionRow}>
          {RATING_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionChip, radarRatingThreshold === opt.value && { backgroundColor: themeColor }]}
              onPress={() => setRadarRatingThreshold(opt.value)}
            >
              <Text style={[styles.optionText, radarRatingThreshold === opt.value && styles.optionTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>幾公尺內提醒</Text>
        <View style={styles.optionRow}>
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionChip, radarRadiusMeters === opt.value && { backgroundColor: themeColor }]}
              onPress={() => setRadarRadiusMeters(opt.value)}
            >
              <Text style={[styles.optionText, radarRadiusMeters === opt.value && styles.optionTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>備份與還原</Text>
        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: themeColor }]} onPress={handleExport}>
          <Text style={styles.exportBtnText}>匯出備份</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.importBtn, { borderColor: themeColor }]} onPress={handleImport}>
          <Text style={[styles.importBtnText, { color: themeColor }]}>匯入備份</Text>
        </TouchableOpacity>
        <Text style={styles.backupCaption}>合併：新資料加入現有資料｜覆蓋：清除現有資料後還原</Text>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAllStores}>
          <Text style={styles.dangerBtnText}>清除所有店家資料</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={progressModalVisible} transparent animationType="fade">
        <View style={styles.progressOverlay}>
          <View style={styles.progressBox}>
            <Text style={styles.progressPercent}>{progress}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: themeColor }]} />
            </View>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  back: { color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 60 },
  section: { color: '#0f172a', fontSize: 15, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  subLabel: { color: '#64748b', fontSize: 12, marginTop: 12, marginBottom: 8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  colorDot: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotActive: { borderWidth: 3, borderColor: '#ffffff', shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  colorCheck: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  customColorRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  customColorInput: {
    flex: 1, backgroundColor: '#f1f5f9', color: '#0f172a',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
  },
  applyBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11 },
  applyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { color: '#0f172a', fontSize: 15 },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionChip: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  optionText: { color: '#0f172a', fontSize: 13 },
  optionTextActive: { color: '#ffffff' },
  exportBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  exportBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  importBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, marginBottom: 10 },
  importBtnText: { fontSize: 15, fontWeight: '700' },
  backupCaption: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  dangerBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  dangerBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  progressOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  progressBox: { backgroundColor: '#ffffff', borderRadius: 16, padding: 28, width: '78%', alignItems: 'center' },
  progressPercent: { color: '#0f172a', fontSize: 28, fontWeight: '700', marginBottom: 14 },
  progressTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { color: '#64748b', fontSize: 13, marginTop: 14 },
});
