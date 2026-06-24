import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import type { Category } from '@/types';
import { getAllCategories } from '@/db/categoryRepository';
import { insertStore, updateStore, getStoreById } from '@/db/storeRepository';
import HeartRating from '@/components/HeartRating';
import LocationPickerModal from '@/components/LocationPickerModal';
import { useSettingsStore } from '@/store/settingsStore';

export default function AddStoreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ storeId?: string }>();
  const themeColor = useSettingsStore((s) => s.themeColor);
  const isEdit = !!params.storeId;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [event, setEvent] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    getAllCategories().then((cats) => {
      setCategories(cats);
      if (cats.length && !isEdit) setCategoryId(cats[0].id);
    });
    if (isEdit && params.storeId) {
      getStoreById(params.storeId).then((store) => {
        if (!store) return;
        setName(store.name);
        setCategoryId(store.categoryId);
        setRating(store.rating);
        setLatitude(store.latitude);
        setLongitude(store.longitude);
        setAddress(store.address);
        setPhotos(store.photos);
        setEvent(store.event);
        setNotes(store.notes);
      });
    }
  }, []);

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
    if (latitude === null || longitude === null) { Alert.alert('請選擇店家位置'); return; }

    const data = { name: name.trim(), categoryId, rating, latitude, longitude, address, photos, event, notes };
    if (isEdit && params.storeId) {
      await updateStore(params.storeId, data);
    } else {
      await insertStore(data);
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
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
          placeholder="輸入店家名稱" placeholderTextColor="#94a3b8" />

        <Text style={styles.label}>分類 *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id}
              style={[styles.catChip, categoryId === cat.id && { backgroundColor: themeColor }]}
              onPress={() => setCategoryId(cat.id)}>
              <Text style={[styles.catText, categoryId === cat.id && styles.catTextActive]}>{cat.emoji} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>評分 *</Text>
        <View style={{ marginBottom: 16 }}>
          <HeartRating value={rating} themeColor={themeColor} onPress={(v) => setRating(v as 1 | 2 | 3 | 4 | 5)} size={28} />
        </View>

        <Text style={styles.label}>位置 *</Text>
        <TouchableOpacity style={styles.locBtn} onPress={() => setPickerVisible(true)}>
          <Text style={[styles.locBtnText, { color: themeColor }]}>
            📍 {address ? address : '選擇位置'}
          </Text>
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

        <Text style={styles.label}>事件（選填）</Text>
        <TextInput style={[styles.input, { height: 60 }]} value={event} onChangeText={setEvent}
          placeholder="這次上門發生的事..." placeholderTextColor="#94a3b8" multiline />

        <Text style={styles.label}>備註（選填）</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={notes} onChangeText={setNotes}
          placeholder="心得、注意事項..." placeholderTextColor="#94a3b8" multiline />
      </ScrollView>

      <LocationPickerModal
        visible={pickerVisible}
        initialLatitude={latitude ?? undefined}
        initialLongitude={longitude ?? undefined}
        onConfirm={(lat, lon, addr) => {
          setLatitude(lat);
          setLongitude(lon);
          setAddress(addr);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  title: { color: '#0f172a', fontSize: 17, fontWeight: '600' },
  cancel: { color: '#64748b', fontSize: 16 },
  save: { fontSize: 16, fontWeight: '600' },
  form: { padding: 16 },
  label: { color: '#64748b', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#f1f5f9', color: '#0f172a',
    borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16,
  },
  catChip: {
    backgroundColor: '#f1f5f9', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12, marginRight: 8,
  },
  catText: { color: '#0f172a', fontSize: 13 },
  catTextActive: { color: '#ffffff' },
  locBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, marginBottom: 16 },
  locBtnText: { fontSize: 14, fontWeight: '500' },
  photoBtn: {
    backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 10,
  },
  photoBtnText: { color: '#64748b', fontSize: 14 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 8 },
});
