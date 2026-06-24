import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);

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

  const selectedCategory = categories.find((c) => c.id === categoryId);

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

  const useCurrentLocation = async () => {
    setLocatingCurrent(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要定位權限才能使用目前位置');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const addr = geo ? `${geo.city ?? ''}${geo.district ?? ''}${geo.street ?? ''}` : '';
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setAddress(addr);
    } finally {
      setLocatingCurrent(false);
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
        <TouchableOpacity style={styles.dropdown} onPress={() => setCategoryPickerVisible(true)}>
          <Text style={styles.dropdownText}>{selectedCategory ? selectedCategory.name : '請選擇分類'}</Text>
          <Text style={styles.dropdownArrow}>▾</Text>
        </TouchableOpacity>

        <Text style={styles.label}>評分 *</Text>
        <View style={{ marginBottom: 16 }}>
          <HeartRating value={rating} themeColor={themeColor} onPress={(v) => setRating(v as 1 | 2 | 3 | 4 | 5)} size={28} />
        </View>

        <Text style={styles.label}>位置 *</Text>
        {address ? <Text style={styles.locAddress}>📍 {address}</Text> : null}
        <View style={styles.locRow}>
          <TouchableOpacity
            style={[styles.locBtnHalf, { backgroundColor: themeColor }]}
            onPress={useCurrentLocation}
            disabled={locatingCurrent}
          >
            <Text style={styles.locBtnHalfTextOnColor}>{locatingCurrent ? '定位中...' : '使用目前位置'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.locBtnHalf, styles.locBtnOutline, { borderColor: themeColor }]}
            onPress={() => setPickerVisible(true)}
          >
            <Text style={[styles.locBtnHalfText, { color: themeColor }]}>地圖選點</Text>
          </TouchableOpacity>
        </View>

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
          multiline />
      </ScrollView>

      <Modal visible={categoryPickerVisible} transparent animationType="fade" onRequestClose={() => setCategoryPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryPickerVisible(false)}>
          <View style={styles.dropdownList}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.dropdownItem}
                onPress={() => { setCategoryId(cat.id); setCategoryPickerVisible(false); }}
              >
                <Text style={[styles.dropdownItemText, categoryId === cat.id && { color: themeColor, fontWeight: '700' }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
  dropdown: {
    backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dropdownText: { color: '#0f172a', fontSize: 15 },
  dropdownArrow: { color: '#64748b', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdownList: {
    backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 8,
    width: '75%', maxHeight: '60%',
  },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 20 },
  dropdownItemText: { color: '#0f172a', fontSize: 16, textAlign: 'center' },
  locAddress: { color: '#64748b', fontSize: 13, marginBottom: 8 },
  locRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  locBtnHalf: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  locBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5 },
  locBtnHalfText: { fontSize: 14, fontWeight: '600' },
  locBtnHalfTextOnColor: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  photoBtn: {
    backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 10,
  },
  photoBtnText: { color: '#64748b', fontSize: 14 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 8 },
});
