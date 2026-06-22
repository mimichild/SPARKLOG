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
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18, color: '#475569' },
});
