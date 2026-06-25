import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import type { Store, Category } from '@/types';
import { getStoresByCategory } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import StoreCard from '@/components/StoreCard';
import { useSettingsStore } from '@/store/settingsStore';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const themeColor = useSettingsStore((s) => s.themeColor);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [category, setCategory] = useState<Category | undefined>();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');

  useFocusEffect(useCallback(() => {
    Promise.all([getStoresByCategory(id, sortOrder), getAllCategories()]).then(([s, cats]) => {
      setAllStores(s);
      setCategory(cats.find((c) => c.id === id));
    });
  }, [id, sortOrder]));

  const stores = query
    ? allStores.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : allStores;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColor }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Text style={styles.back}>← 返回分類頁</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{category ? category.name : ''}</Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <TouchableOpacity onPress={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}>
            <Text style={styles.sort}>{sortOrder === 'desc' ? '新→舊' : '舊→新'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSearchVisible((v) => !v)}>
            <Text style={styles.searchText}>搜尋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {searchVisible && (
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋此分類的店家..."
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
            <StoreCard store={item} category={category} onPress={() => router.push(`/store/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>這個分類還沒有店家</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  },
  headerSide: { width: 130 },
  headerSideRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  back: { color: '#ffffff', fontSize: 14 },
  title: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  searchText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  sort: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  searchInput: {
    backgroundColor: '#f1f5f9', color: '#0f172a',
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15,
  },
  list: { padding: 16, paddingBottom: 40 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
