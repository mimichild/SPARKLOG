import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface Props {
  uri?: string;
  size?: number;
}

export default function PhotoThumbnail({ uri, size = 52 }: Props) {
  const style = { width: size, height: size, borderRadius: 10 };
  if (uri) {
    return <Image source={{ uri }} style={style} resizeMode="cover" />;
  }
  return (
    <View style={[style, styles.placeholder]}>
      <Text style={styles.icon}>📷</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18, color: '#94a3b8' },
});
