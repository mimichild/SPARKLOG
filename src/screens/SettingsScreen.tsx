// src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch, Alert,
  ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllStores, insertStore } from '@/db/storeRepository';
import { getAllCategories, insertCategory } from '@/db/categoryRepository';
import { getSettings, saveSettings } from '@/storage/settingsStorage';
import { serializeBackup, parseBackup } from '@/utils/exportImport';
import type { AppSettings } from '@/types';
import { useTheme } from '@/context/ThemeContext';

const PRESET_COLORS = ['#6c63ff', '#ef4444', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'];
const THRESHOLD_OPTIONS = [1, 2, 3];
const RADIUS_OPTIONS = [100, 300, 500, 1000];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { themeColor, setThemeColor } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => { getSettings().then(setSettings); }, []);

  const updateSettings = async (patch: Partial<AppSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  const handleExport = async () => {
    try {
      const [stores, categories] = await Promise.all([getAllStores(), getAllCategories()]);
      const json = serializeBackup(stores, categories);
      const path = `${FileSystem.cacheDirectory}sparknotes-backup.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: '匯出 SPARKNOTES 備份' });
    } catch {
      Alert.alert('匯出失敗', '請稍後再試');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const { stores, categories } = parseBackup(json);
      Alert.alert('確認匯入', `將匯入 ${stores.length} 家店和 ${categories.length} 個分類，是否繼續？`, [
        { text: '取消', style: 'cancel' },
        { text: '匯入', onPress: async () => {
          for (const cat of categories) await insertCategory(cat.name, cat.emoji);
          for (const store of stores) {
            const { id, createdAt, ...data } = store;
            await insertStore(data);
          }
          Alert.alert('匯入成功');
        }},
      ]);
    } catch {
      Alert.alert('匯入失敗', '請確認檔案格式正確');
    }
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.sectionLabel}>主題顏色</Text>
        <View style={styles.card}>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => { setThemeColor(c); updateSettings({ themeColor: c }); }}>
                <View style={[styles.colorDot, { backgroundColor: c },
                  themeColor === c && styles.colorDotSelected]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionLabel}>雷店預警通知</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>通知開關</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
              trackColor={{ true: themeColor }}
            />
          </View>
          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.rowLabel}>警示星級門檻</Text>
            <View style={styles.optionRow}>
              {THRESHOLD_OPTIONS.map((t) => (
                <TouchableOpacity key={t}
                  style={[styles.optionChip, settings.alertRatingThreshold === t && { backgroundColor: themeColor }]}
                  onPress={() => updateSettings({ alertRatingThreshold: t })}>
                  <Text style={styles.optionText}>≤{t}心</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.rowLabel}>警示半徑</Text>
            <View style={styles.optionRow}>
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity key={r}
                  style={[styles.optionChip, settings.alertRadiusMeters === r && { backgroundColor: themeColor }]}
                  onPress={() => updateSettings({ alertRadiusMeters: r })}>
                  <Text style={styles.optionText}>{r >= 1000 ? '1km' : `${r}m`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>資料管理</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleExport}>
            <Text style={styles.rowLabel}>📤 匯出資料</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, styles.borderTop]} onPress={handleImport}>
            <Text style={styles.rowLabel}>📥 匯入資料</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  back: { color: '#94a3b8', fontSize: 16, width: 60 },
  title: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 20 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, overflow: 'hidden' },
  colorRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  borderTop: { borderTopWidth: 1, borderTopColor: '#334155' },
  rowLabel: { color: '#e2e8f0', fontSize: 15 },
  chevron: { color: '#475569', fontSize: 18 },
  optionRow: { flexDirection: 'row', gap: 6 },
  optionChip: { backgroundColor: '#334155', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  optionText: { color: '#f1f5f9', fontSize: 12 },
});
