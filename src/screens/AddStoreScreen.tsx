// src/screens/AddStoreScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { RootStackParamList, Category } from '@/types';
import { getAllCategories } from '@/db/categoryRepository';
import { insertStore, updateStore, getStoreById } from '@/db/storeRepository';
import HeartRating from '@/components/HeartRating';
import { useTheme } from '@/context/ThemeContext';

type RouteType = RouteProp<RootStackParamList, 'AddStore'>;

const PRICE_OPTIONS = ['', '$', '$$', '$$$'];

export default function AddStoreScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { themeColor } = useTheme();
  const isEdit = !!route.params?.storeId;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rating, setRating] = useState<1|2|3|4|5>(3);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    getAllCategories().then((cats) => {
      setCategories(cats);
      if (cats.length && !isEdit) setCategoryId(cats[0].id);
    });
    if (isEdit && route.params.storeId) {
      getStoreById(route.params.storeId).then((store) => {
        if (!store) return;
        setName(store.name);
        setCategoryId(store.categoryId);
        setRating(store.rating);
        setAddress(store.address);
        setLatitude(store.latitude);
        setLongitude(store.longitude);
        setPhotos(store.photos);
        setNotes(store.notes);
        setPriceRange(store.priceRange);
      });
    }
  }, []);

  const pickLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('需要定位權限'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      if (geo) setAddress(`${geo.city ?? ''}${geo.street ?? ''}`);
    } finally {
      setLocating(false);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('請輸入店家名稱'); return; }
    if (!categoryId) { Alert.alert('請選擇分類'); return; }
    if (!address.trim()) { Alert.alert('請輸入地址或使用目前位置'); return; }

    const data = { name: name.trim(), categoryId, rating, address, latitude, longitude, photos, notes, priceRange };
    if (isEdit && route.params.storeId) {
      await updateStore(route.params.storeId, data);
    } else {
      await insertStore(data);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? '編輯店家' : '新增店家'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.save, { color: themeColor }]}>儲存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.label}>店家名稱 *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName}
          placeholder="輸入店家名稱" placeholderTextColor="#475569" />

        <Text style={styles.label}>分類 *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id}
              style={[styles.catChip, categoryId === cat.id && { backgroundColor: themeColor }]}
              onPress={() => setCategoryId(cat.id)}>
              <Text style={styles.catText}>{cat.emoji} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>評分 *</Text>
        <View style={{ marginBottom: 16 }}>
          <HeartRating value={rating} themeColor={themeColor} onPress={(v) => setRating(v as 1|2|3|4|5)} size={28} />
        </View>

        <Text style={styles.label}>地址 *</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress}
          placeholder="輸入地址" placeholderTextColor="#475569" />
        <TouchableOpacity style={styles.locBtn} onPress={pickLocation} disabled={locating}>
          {locating ? <ActivityIndicator color={themeColor} /> :
            <Text style={[styles.locBtnText, { color: themeColor }]}>📍 使用目前位置</Text>}
        </TouchableOpacity>

        <Text style={styles.label}>照片（選填）</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
          <Text style={styles.photoBtnText}>＋ 從相簿選取</Text>
        </TouchableOpacity>
        <ScrollView horizontal style={{ marginBottom: 16 }}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} />
          ))}
        </ScrollView>

        <Text style={styles.label}>備註（選填）</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={notes} onChangeText={setNotes}
          placeholder="心得、注意事項..." placeholderTextColor="#475569" multiline />

        <Text style={styles.label}>價位（選填）</Text>
        <View style={styles.priceRow}>
          {PRICE_OPTIONS.map((p) => (
            <TouchableOpacity key={p}
              style={[styles.priceChip, priceRange === p && { backgroundColor: themeColor }]}
              onPress={() => setPriceRange(p)}>
              <Text style={styles.priceText}>{p || '不填'}</Text>
            </TouchableOpacity>
          ))}
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
  title: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  cancel: { color: '#64748b', fontSize: 16 },
  save: { fontSize: 16, fontWeight: '600' },
  form: { padding: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#1e293b', color: '#f1f5f9',
    borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16,
  },
  catChip: {
    backgroundColor: '#1e293b', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12, marginRight: 8,
  },
  catText: { color: '#f1f5f9', fontSize: 13 },
  locBtn: { alignItems: 'center', marginBottom: 16 },
  locBtnText: { fontSize: 14, fontWeight: '500' },
  photoBtn: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 10,
  },
  photoBtnText: { color: '#64748b', fontSize: 14 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 8 },
  priceRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  priceChip: {
    backgroundColor: '#1e293b', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  priceText: { color: '#f1f5f9', fontSize: 14 },
});
