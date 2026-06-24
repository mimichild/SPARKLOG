import React from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSettingsStore } from '@/store/settingsStore';
import { getAllStores, insertStore } from '@/db/storeRepository';
import { getAllCategories, insertCategory } from '@/db/categoryRepository';
import { serializeBackup, parseBackup } from '@/utils/exportImport';

const PRESET_COLORS = ['#6c63ff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
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

  const handleExport = async () => {
    const [stores, categories] = await Promise.all([getAllStores(), getAllCategories()]);
    const json = serializeBackup(stores, categories);
    const path = `${FileSystem.documentDirectory}sparknotes-backup.json`;
    await FileSystem.writeAsStringAsync(path, json);
    await Sharing.shareAsync(path);
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled) return;
    const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const { stores, categories } = parseBackup(json);
    Alert.alert('匯入資料', '要合併還是覆蓋現有資料？', [
      { text: '取消', style: 'cancel' },
      {
        text: '合併', onPress: async () => {
          for (const c of categories) await insertCategory(c.name, c.emoji);
          for (const s of stores) await insertStore(s);
          Alert.alert('匯入完成');
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
        <Text style={styles.section}>主題顏色</Text>
        <View style={styles.colorRow}>
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, themeColor === c && styles.colorDotActive]}
              onPress={() => setThemeColor(c)}
            />
          ))}
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

        <Text style={styles.section}>資料管理</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={handleExport}>
          <Text style={styles.actionText}>📤 匯出資料</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleImport}>
          <Text style={styles.actionText}>📥 匯入資料</Text>
        </TouchableOpacity>
      </ScrollView>
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
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotActive: { borderWidth: 3, borderColor: '#0f172a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { color: '#0f172a', fontSize: 15 },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionChip: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  optionText: { color: '#0f172a', fontSize: 13 },
  optionTextActive: { color: '#ffffff' },
  actionBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 14, marginBottom: 10 },
  actionText: { color: '#0f172a', fontSize: 15, fontWeight: '500' },
});
