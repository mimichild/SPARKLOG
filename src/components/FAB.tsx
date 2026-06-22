import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  onPress: () => void;
}

export default function FAB({ onPress }: Props) {
  const { themeColor } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: themeColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.plus}>＋</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plus: { color: '#fff', fontSize: 26, lineHeight: 30 },
});
