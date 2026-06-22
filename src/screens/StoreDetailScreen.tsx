// src/screens/StoreDetailScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Store, Category } from '@/types';
import { getStoreById } from '@/db/storeRepository';
import { getAllCategories } from '@/db/categoryRepository';
import HeartRating from '@/components/HeartRating';
import PhotoThumbnail from '@/components/PhotoThumbnail';
import { useTheme } from '@/context/ThemeContext';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'StoreDetail'>;
const { width } = Dimensions.get('window');

export default function StoreDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const { themeColor } = useTheme();
  const [store, setStore] = useState<Store | null>(null);
  const [category, setCategory] = useState<Category | undefined>();

  useFocusEffect(useCallback(() => {
    Promise.all([getStoreById(route.params.storeId), getAllCategories()]).then(([s, cats]) => {
      setStore(s);
      setCategory(cats.find((c) => c.id === s?.categoryId));
    });
  }, [route.params.storeId]));

  if (!store) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AddStore', { storeId: store.id })}>
          <Text style={[styles.edit, { color: themeColor }]}>編輯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {store.photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled style={{ height: 220 }}>
            {store.photos.map((uri, i) => (
              <PhotoThumbnail key={i} uri={uri} size={width} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noPhoto}>
            <Text style={{ color: '#475569', fontSize: 14 }}>沒有照片</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.name}>{store.name}</Text>
          <HeartRating value={store.rating} themeColor={themeColor} readOnly size={20} />

          {category && <Text style={styles.meta}>{category.emoji} {category.name}</Text>}
          {store.priceRange ? <Text style={styles.meta}>💰 {store.priceRange}</Text> : null}

          <TouchableOpacity onPress={() => Linking.openURL(`maps:?q=${encodeURIComponent(store.address)}`)}>
            <Text style={[styles.address, { color: themeColor }]}>📍 {store.address}</Text>
          </TouchableOpacity>

          {store.notes ? (
            <>
              <Text style={styles.sectionTitle}>備註</Text>
              <Text style={styles.notes}>{store.notes}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  back: { color: '#94a3b8', fontSize: 16 },
  edit: { fontSize: 16, fontWeight: '600' },
  noPhoto: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  body: { padding: 20 },
  name: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
  address: { fontSize: 14, marginTop: 12, fontWeight: '500' },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  notes: { color: '#cbd5e1', fontSize: 15, lineHeight: 22 },
});
