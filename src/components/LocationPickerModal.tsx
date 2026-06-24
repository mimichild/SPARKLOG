import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSettingsStore } from '@/store/settingsStore';

interface Props {
  visible: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (lat: number, lon: number, address: string) => void;
  onCancel: () => void;
}

const FALLBACK_REGION: Region = {
  latitude: 25.0330, longitude: 121.5654,
  latitudeDelta: 0.01, longitudeDelta: 0.01,
};

export default function LocationPickerModal({ visible, initialLatitude, initialLongitude, onConfirm, onCancel }: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);
  const [region, setRegion] = useState<Region>(FALLBACK_REGION);
  const [marker, setMarker] = useState({ latitude: FALLBACK_REGION.latitude, longitude: FALLBACK_REGION.longitude });
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initialLatitude && initialLongitude) {
      const r = { latitude: initialLatitude, longitude: initialLongitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(r);
      setMarker({ latitude: initialLatitude, longitude: initialLongitude });
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要定位權限才能定位目前位置，請手動拖曳大頭針');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const r = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(r);
      setMarker({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLoading(false);
    })();
  }, [visible, initialLatitude, initialLongitude]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const [geo] = await Location.reverseGeocodeAsync(marker);
      const address = geo ? `${geo.city ?? ''}${geo.district ?? ''}${geo.street ?? ''}` : '';
      onConfirm(marker.latitude, marker.longitude, address);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancel}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>拖曳大頭針選擇位置</Text>
          <TouchableOpacity onPress={handleConfirm} disabled={confirming}>
            {confirming ? <ActivityIndicator color={themeColor} /> : <Text style={[styles.confirm, { color: themeColor }]}>確認</Text>}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={themeColor} /></View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
          >
            <Marker
              coordinate={marker}
              draggable
              onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
            />
          </MapView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cancel: { color: '#64748b', fontSize: 16 },
  confirm: { fontSize: 16, fontWeight: '600' },
  map: { flex: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
