import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Store, Category } from '@/types';
import PhotoThumbnail from './PhotoThumbnail';
import HeartRating from './HeartRating';
import { relativeTime } from '@/utils/relativeTime';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  store: Store;
  category?: Category;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function StoreCard({ store, category, onPress, onLongPress }: Props) {
  const { themeColor } = useTheme();
  const subtitle = [category?.name, store.address].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <PhotoThumbnail uri={store.photos[0]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        <HeartRating value={store.rating} themeColor={themeColor} readOnly size={14} />
      </View>
      <Text style={styles.time}>{relativeTime(store.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  info: { flex: 1, minWidth: 0 },
  name: { color: '#f1f5f9', fontWeight: '600', fontSize: 15 },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  time: { color: '#475569', fontSize: 11, flexShrink: 0 },
});
