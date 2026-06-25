import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Store, Category } from '@/types';
import { getStoresFiltered } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import StoreCard from '@/components/StoreCard';
import { useSettingsStore } from '@/store/settingsStore';

const ALL_RATINGS = [1, 2, 3, 4, 5];

export default function RankingsScreen() {
  const router = useRouter();
  const themeColor = useSettingsStore((s) => s.themeColor);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [minRating, setMinRating] = useState(1);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const load = useCallback(async () => {
    const cats = await getAllCategories();
    setCategories(cats);
    const result = await getStoresFiltered(minRating, selectedCategoryIds);
    setStores(sortDirection === 'asc' ? [...result].reverse() : result);
  }, [minRating, selectedCategoryIds, sortDirection]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColor }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.replace('/')}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>排行</Text>
        <TouchableOpacity
          style={[styles.headerSide, styles.headerSideRight, styles.sortDirBtn]}
          onPress={() => setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
        >
          <Text style={styles.sortDirText}>{sortDirection === 'desc' ? '5' : '1'}</Text>
          <Ionicons name="heart" size={11} color="#ffffff" />
          <Ionicons name="arrow-forward" size={11} color="#ffffff" />
          <Text style={styles.sortDirText}>{sortDirection === 'desc' ? '1' : '5'}</Text>
          <Ionicons name="heart" size={11} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.filterTitle}>篩選</Text>

        <Text style={styles.filterSubLabel}>心級（{minRating} 顆心以上）</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {ALL_RATINGS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, styles.heartChip, minRating === n && { backgroundColor: themeColor }]}
              onPress={() => setMinRating(n)}
            >
              {Array.from({ length: n }).map((_, i) => (
                <Ionicons
                  key={i}
                  name="heart"
                  size={12}
                  color={minRating === n ? '#ffffff' : themeColor}
                />
              ))}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterSubLabel}>分類</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.catFilterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCategoryIds.includes(item.id) && { backgroundColor: themeColor }]}
              onPress={() => toggleCategory(item.id)}
            >
              <Text style={[styles.chipText, selectedCategoryIds.includes(item.id) && styles.chipTextActive]} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          style={styles.storeList}
          data={stores}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoreCard store={item} category={categoryMap[item.categoryId]} onPress={() => router.push(`/store/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>沒有符合篩選條件的店家</Text>}
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
  headerSide: { width: 76 },
  headerSideRight: { alignItems: 'flex-end' },
  back: { color: '#ffffff', fontSize: 14 },
  title: { flex: 1, color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  sortDirBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortDirText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  filterTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700', paddingHorizontal: 16, paddingTop: 14 },
  filterSubLabel: { color: '#64748b', fontSize: 12, fontWeight: '600', paddingHorizontal: 16, marginTop: 10, marginBottom: 6 },
  filterScroll: { flexGrow: 0, flexShrink: 0, height: 44 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  catFilterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  chip: {
    height: 36,
    backgroundColor: '#f1f5f9', borderRadius: 8,
    paddingHorizontal: 12, marginRight: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  heartChip: { flexDirection: 'row', gap: 2 },
  chipText: { color: '#0f172a', fontSize: 13 },
  chipTextActive: { color: '#ffffff' },
  storeList: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
