import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Alert,
  Modal, TextInput, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '@/types';
import {
  getAllCategories, insertCategory, deleteCategory, reorderCategories,
} from '@/db/categoryRepository';
import { getAllStores } from '@/db/storeRepository';
import { useSettingsStore } from '@/store/settingsStore';

const GRID_PADDING = 12;
const CHIP_MARGIN = 6;
const CHIP_WIDTH = (Dimensions.get('window').width - GRID_PADDING * 2 - CHIP_MARGIN * 4) / 2;

export default function CategoriesScreen() {
  const router = useRouter();
  const themeColor = useSettingsStore((s) => s.themeColor);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const load = useCallback(async () => {
    const [cats, stores] = await Promise.all([getAllCategories(), getAllStores()]);
    setCategories(cats);
    const c: Record<string, number> = {};
    stores.forEach((s) => { c[s.categoryId] = (c[s.categoryId] ?? 0) + 1; });
    setCounts(c);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openEditSheet = () => { setAddingNew(false); setNewCategoryName(''); setEditSheetVisible(true); };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) { Alert.alert('請輸入分類名稱'); return; }
    await insertCategory(newCategoryName.trim(), '');
    setNewCategoryName('');
    setAddingNew(false);
    load();
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('刪除分類', `確定要刪除「${cat.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); load(); } },
    ]);
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    await reorderCategories(next.map((c) => c.id));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColor }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>分類</Text>
        <TouchableOpacity onPress={openEditSheet}>
          <Text style={styles.editBtn}>編輯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: themeColor }]}
              onPress={() => router.push(`/category/${item.id}`)}
            >
              <Text style={styles.chipName}>{item.name}</Text>
              <Text style={styles.chipCount}>{counts[item.id] ?? 0} 家</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Modal visible={editSheetVisible} transparent animationType="slide" onRequestClose={() => setEditSheetVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editSheet}>
            <Text style={styles.modalTitle}>編輯分類</Text>

            {addingNew ? (
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="分類名稱"
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
                <TouchableOpacity style={[styles.addConfirmBtn, { backgroundColor: themeColor }]} onPress={handleAddCategory}>
                  <Text style={styles.addConfirmBtnText}>新增</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addCategoryBtn} onPress={() => setAddingNew(true)}>
                <Ionicons name="add" size={18} color={themeColor} />
                <Text style={[styles.addCategoryBtnText, { color: themeColor }]}>新增分類</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionLabel}>修改排序</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              style={styles.reorderList}
              renderItem={({ item, index }) => (
                <View style={styles.reorderRow}>
                  <TouchableOpacity
                    style={styles.reorderArrowBtn}
                    onPress={() => moveCategory(index, -1)}
                    disabled={index === 0}
                  >
                    <Ionicons name="chevron-up" size={18} color={index === 0 ? '#cbd5e1' : '#64748b'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reorderArrowBtn}
                    onPress={() => moveCategory(index, 1)}
                    disabled={index === categories.length - 1}
                  >
                    <Ionicons name="chevron-down" size={18} color={index === categories.length - 1 ? '#cbd5e1' : '#64748b'} />
                  </TouchableOpacity>
                  <Text style={styles.reorderName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.reorderCount}>{counts[item.id] ?? 0} 家</Text>
                  <TouchableOpacity style={styles.reorderDeleteBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditSheetVisible(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditSheetVisible(false)}>
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
  container: { flex: 1 },
  body: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  back: { color: '#ffffff', fontSize: 15 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  editBtn: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  grid: { padding: GRID_PADDING },
  chip: {
    width: CHIP_WIDTH, margin: CHIP_MARGIN, borderRadius: 14,
    paddingVertical: 24, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center',
  },
  chipName: { color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  chipCount: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  editSheet: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '80%',
  },
  modalTitle: { color: '#0f172a', fontSize: 17, fontWeight: '600', marginBottom: 16 },
  addCategoryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 12, marginBottom: 16,
  },
  addCategoryBtnText: { fontSize: 15, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  addInput: {
    flex: 1, backgroundColor: '#f1f5f9', color: '#0f172a',
    borderRadius: 10, paddingHorizontal: 12, fontSize: 15,
  },
  addConfirmBtn: { borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  addConfirmBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  sectionLabel: { color: '#64748b', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  reorderList: { maxHeight: 280 },
  reorderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  reorderArrowBtn: { padding: 4 },
  reorderName: { flex: 1, color: '#0f172a', fontSize: 15, marginLeft: 6 },
  reorderCount: { color: '#94a3b8', fontSize: 12, marginRight: 8 },
  reorderDeleteBtn: { padding: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  modalCancel: { color: '#64748b', fontSize: 16 },
  modalSave: { fontSize: 16, fontWeight: '600' },
});
