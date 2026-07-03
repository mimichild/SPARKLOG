import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Image, Modal, KeyboardAvoidingView, Platform, findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import { v4 as uuid } from 'uuid';
import { PHOTOS_DIR, ensurePhotosDir } from '@/utils/photoStorage';
import type { Category } from '@/types';
import { getAllCategories } from '@/db/categoryRepository';
import { insertStore, updateStore, getStoreById } from '@/db/storeRepository';
import HeartRating from '@/components/HeartRating';
import { useSettingsStore } from '@/store/settingsStore';

const MAX_PHOTOS = 2;

async function persistPickedPhoto(sourceUri: string): Promise<string> {
  await ensurePhotosDir();
  const extension = sourceUri.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
  const destUri = `${PHOTOS_DIR}${uuid()}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

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
  const [addressDirty, setAddressDirty] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [event, setEvent] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const eventInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);

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
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      const persisted = await Promise.all(
        result.assets.slice(0, remaining).map((a) => persistPickedPhoto(a.uri)),
      );
      setPhotos((prev) => [...prev, ...persisted]);
    }
  };

  const removePhoto = (index: number) => {
    const [removed] = photos.slice(index, index + 1);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (removed) FileSystem.deleteAsync(removed, { idempotent: true }).catch(() => {});
  };

  const movePhoto = (from: number, to: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const scrollToInput = (ref: React.RefObject<TextInput | null>) => {
    setTimeout(() => {
      const scrollNode = findNodeHandle(scrollRef.current);
      if (!scrollNode) return;
      ref.current?.measureLayout(
        scrollNode,
        (_x, y) => {
          scrollRef.current?.scrollTo({ y: Math.max(y - 80, 0), animated: true });
        },
        () => {},
      );
    }, 100);
  };

  const useCurrentLocation = async () => {
    setLocatingCurrent(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要定位權限才能使用目前位置');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const addr = geo ? `${geo.subregion ?? ''}${geo.street ?? ''}` : '';
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setAddress(addr);
      setAddressDirty(false);
    } finally {
      setLocatingCurrent(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('請輸入店家名稱'); return; }
    if (!categoryId) { Alert.alert('請選擇分類'); return; }

    let finalLatitude = latitude ?? 0;
    let finalLongitude = longitude ?? 0;

    if (address.trim() && (addressDirty || latitude === null || longitude === null)) {
      setSaving(true);
      try {
        const results = await Location.geocodeAsync(address.trim());
        if (results.length === 0) {
          Alert.alert('找不到這個地址的座標', '請確認地址是否正確，或改用「使用目前位置」');
          return;
        }
        finalLatitude = results[0].latitude;
        finalLongitude = results[0].longitude;
      } catch {
        Alert.alert('地址轉換座標失敗', '請稍後再試，或改用「使用目前位置」');
        return;
      } finally {
        setSaving(false);
      }
    }

    const data = {
      name: name.trim(), categoryId, rating,
      latitude: finalLatitude, longitude: finalLongitude,
      address: address.trim(), photos, event, notes,
    };
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
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.save, { color: themeColor }]}>{saving ? '儲存中...' : '儲存'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
      <ScrollView ref={scrollRef} style={styles.form} contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">
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

        <Text style={styles.label}>地址（選填）</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={(text) => { setAddress(text); setAddressDirty(true); }}
          placeholder="輸入店家地址"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity
          style={[styles.currentLocBtn, { backgroundColor: themeColor }]}
          onPress={useCurrentLocation}
          disabled={locatingCurrent}
        >
          <Text style={styles.currentLocBtnText}>{locatingCurrent ? '定位中...' : '使用目前位置'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>照片（選填，最多 {MAX_PHOTOS} 張）</Text>
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
            <Text style={styles.photoBtnText}>＋ 從相簿選取（{photos.length}/{MAX_PHOTOS}）</Text>
          </TouchableOpacity>
        )}
        {photos.length > 0 && (
          <View style={styles.photoRow}>
            {photos.map((uri, i) => (
              <View key={uri + i} style={styles.photoItem}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.photoDeleteBtn} onPress={() => removePhoto(i)}>
                  <Text style={styles.photoDeleteBtnText}>✕</Text>
                </TouchableOpacity>
                {photos.length > 1 && (
                  <View style={styles.photoReorderRow}>
                    <TouchableOpacity
                      style={[styles.photoReorderBtn, i === 0 && styles.photoReorderBtnDisabled]}
                      disabled={i === 0}
                      onPress={() => movePhoto(i, i - 1)}
                    >
                      <Text style={styles.photoReorderBtnText}>◀</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.photoReorderBtn, i === photos.length - 1 && styles.photoReorderBtnDisabled]}
                      disabled={i === photos.length - 1}
                      onPress={() => movePhoto(i, i + 1)}
                    >
                      <Text style={styles.photoReorderBtnText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>事件（選填）</Text>
        <TextInput
          ref={eventInputRef}
          style={[styles.input, styles.textArea, { height: 90 }]}
          value={event}
          onChangeText={setEvent}
          placeholder="這次上門發生的事..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
          onFocus={() => scrollToInput(eventInputRef)}
        />

        <Text style={styles.label}>備註（選填）</Text>
        <TextInput
          ref={notesInputRef}
          style={[styles.input, styles.textArea, { height: 120 }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
          onFocus={() => scrollToInput(notesInputRef)}
        />
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={categoryPickerVisible} transparent animationType="fade" onRequestClose={() => setCategoryPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryPickerVisible(false)}>
          <View style={styles.dropdownList}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  currentLocBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  currentLocBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  photoBtn: {
    backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 10,
  },
  photoBtnText: { color: '#64748b', fontSize: 14 },
  textArea: { paddingTop: 14 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoItem: { alignItems: 'center' },
  photoThumb: { width: 96, height: 96, borderRadius: 8 },
  photoDeleteBtn: {
    position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center',
  },
  photoDeleteBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  photoReorderRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  photoReorderBtn: {
    width: 32, height: 28, borderRadius: 6, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  photoReorderBtnDisabled: { opacity: 0.3 },
  photoReorderBtnText: { color: '#475569', fontSize: 13, fontWeight: '700' },
});
