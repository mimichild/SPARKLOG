import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const HOME_BACKGROUND = '#EF999A';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SPARK NOTE</Text>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsText}>設定</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => router.push('/main/records')}
        >
          <Text style={styles.startBtnText}>開始使用</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: HOME_BACKGROUND, justifyContent: 'space-between' },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 260,
  },
  bottom: { marginBottom: 40 },
  settingsBtn: {
    alignSelf: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  settingsText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  startBtn: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  startBtnText: { color: HOME_BACKGROUND, fontSize: 17, fontWeight: '700' },
});
