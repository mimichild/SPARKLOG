import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';

export default function HomeScreen() {
  const router = useRouter();
  const themeColor = useSettingsStore((s) => s.themeColor);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: themeColor }]}>SPARK{'\n'}NOTES</Text>

        <TouchableOpacity
          style={[styles.enterBtn, { backgroundColor: themeColor }]}
          onPress={() => router.push('/main/records')}
        >
          <Text style={styles.enterBtnText}>進入主頁</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsText}>⚙️  設定</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 56,
    marginBottom: 40,
  },
  enterBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  enterBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingsBtn: {
    marginTop: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingsText: { color: '#475569', fontSize: 15, fontWeight: '500' },
});
