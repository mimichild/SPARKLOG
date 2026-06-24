import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Alert,
  Modal, TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import type { Category } from '@/types';
import {
  getAllCategories, insertCategory, deleteCategory, updateCategory,
} from '@/db/categoryRepository';
import { getAllStores } from '@/db/storeRepository';
import { useSettingsStore } from '@/store/settingsStore';

export default function CategoriesScreen() {
  const router = useRouter();
  const themeColor = useSettingsStore((s) => s.themeColor);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputEmoji, setInputEmoji] = useState('');

  const load = useCallback(async () => {
    const [cats, stores] = await Promise.all([getAllCategories(), getAllStores()]);
    setCategories(cats);
    const c: Record<string, number> = {};
    stores.forEach((s) => { c[s.categoryId] = (c[s.categoryId] ?? 0) + 1; });
    setCounts(c);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => { setEditTarget(null); setInputName(''); setInputEmoji(''); setModalVisible(true); };
  const openEdit = (cat: Category) => { setEditTarget(cat); setInputName(cat.name); setInputEmoji(cat.emoji); setModalVisible(true); };

  const handleSave = async () => {
    if (!inputName.trim()) { Alert.alert('請輸入分類名稱'); return; }
    if (editTarget) {
      await updateCategory(editTarget.id, inputName.trim(), inputEmoji || '📌');
    } else {
      await insertCategory(inputName.trim(), inputEmoji || '📌');
    }
    setModalVisible(false);
    load();
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('刪除分類', `確定要刪除「${cat.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.back}>← 返回首頁</Text>
        </TouchableOpacity>
        <Text style={styles.title}>分類</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text style={[styles.editBtn, { color: themeColor }]}>✏️ 編輯</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chip}
            onPress={() => router.push(`/category/${item.id}`)}
            onLongPress={() => {
              Alert.alert(item.name, '', [
                { text: '編輯', onPress: () => openEdit(item) },
                { text: '刪除', style: 'destructive', onPress: () => handleDelete(item) },
                { text: '取消', style: 'cancel' },
              ]);
            }}
          >
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <Text style={styles.chipName}>{item.name}</Text>
            <Text style={styles.chipCount}>{counts[item.id] ?? 0} 家</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editTarget ? '編輯分類' : '新增分類'}</Text>
            <TextInput style={styles.modalInput} value={inputEmoji}
              onChangeText={setInputEmoji} placeholder="Emoji 圖示" placeholderTextColor="#94a3b8" />
            <TextInput style={styles.modalInput} value={inputName}
              onChangeText={setInputName} placeholder="分類名稱" placeholderTextColor="#94a3b8" />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={[styles.modalSave, { color: themeColor }]}>儲存</Text>
              </TouchableOpacity>
            </View>
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
  title: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  editBtn: { fontSize: 15, fontWeight: '600' },
  grid: { padding: 12 },
  chip: {
    flex: 1, margin: 6, backgroundColor: '#ffffff', borderRadius: 12,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipEmoji: { fontSize: 28, marginBottom: 6 },
  chipName: { color: '#0f172a', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  chipCount: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#0f172a', fontSize: 17, fontWeight: '600', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#f1f5f9', color: '#0f172a',
    borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 8 },
  modalCancel: { color: '#64748b', fontSize: 16 },
  modalSave: { fontSize: 16, fontWeight: '600' },
});
