// src/screens/CategoryDetailScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Store, Category } from '@/types';
import { getStoresByCategory } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import StoreCard from '@/components/StoreCard';
import { useTheme } from '@/context/ThemeContext';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'CategoryDetail'>;

export default function CategoryDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const { themeColor } = useTheme();
  const [stores, setStores] = useState<Store[]>([]);
  const [category, setCategory] = useState<Category | undefined>();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useFocusEffect(useCallback(() => {
    Promise.all([
      getStoresByCategory(route.params.categoryId, sortOrder),
      getAllCategories(),
    ]).then(([s, cats]) => {
      setStores(s);
      setCategory(cats.find((c) => c.id === route.params.categoryId));
    });
  }, [route.params.categoryId, sortOrder]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{category ? `${category.emoji} ${category.name}` : ''}</Text>
        <TouchableOpacity onPress={() => setSortOrder((o) => o === 'desc' ? 'asc' : 'desc')}>
          <Text style={[styles.sort, { color: themeColor }]}>
            {sortOrder === 'desc' ? '新→舊' : '舊→新'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoreCard
            store={item}
            category={category}
            onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>這個分類還沒有記錄</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  back: { color: '#94a3b8', fontSize: 15 },
  title: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  sort: { fontSize: 14, fontWeight: '500' },
  list: { padding: 16 },
  empty: { color: '#475569', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
