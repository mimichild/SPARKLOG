import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, StyleSheet, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import type { Store, Category } from '@/types';
import { getAllStores, searchStores, deleteStore } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import StoreCard from '@/components/StoreCard';
import FAB from '@/components/FAB';
import { useSettingsStore } from '@/store/settingsStore';

export default function RecordsScreen() {
  const router = useRouter();
  const themeColor = useSettingsStore((s) => s.themeColor);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([getAllStores(), getAllCategories()]);
    setStores(s);
    setCategories(c);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!query) { load(); return; }
    searchStores(query).then(setStores);
  }, [query]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const handleLongPress = (store: Store) => {
    Alert.alert('刪除店家', `確定要刪除「${store.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: async () => { await deleteStore(store.id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColor }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.replace('/')}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>紀錄</Text>
        <TouchableOpacity style={[styles.headerSide, styles.headerSideRight]} onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSearchVisible((v) => !v);
          if (searchVisible) setQuery('');
        }}>
          <Text style={styles.searchText}>搜尋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {searchVisible && (
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋店家名稱..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        )}

        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoreCard
              store={item}
              category={categoryMap[item.categoryId]}
              onPress={() => router.push(`/store/${item.id}`)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>還沒有記錄，點 ＋ 新增第一家店！</Text>}
        />

        <FAB onPress={() => router.push('/store/add')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerSide: { width: 60 },
  headerSideRight: { alignItems: 'flex-end' },
  back: { color: '#ffffff', fontSize: 15 },
  title: { flex: 1, color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  searchText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  searchInput: {
    backgroundColor: '#f1f5f9', color: '#0f172a',
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15,
  },
  list: { padding: 16, paddingBottom: 80 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
