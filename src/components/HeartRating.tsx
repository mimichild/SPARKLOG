import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  value: number;
  themeColor: string;
  onPress?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

export default function HeartRating({ value, themeColor, onPress, readOnly, size = 16 }: Props) {
  const isInteractive = !readOnly && !!onPress;
  return (
    <View style={styles.row} pointerEvents={isInteractive ? 'auto' : 'none'}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const color = filled ? (value >= 3 ? themeColor : '#ffffff') : '#334155';
        const heart = (
          <Text key={n} style={{ color, fontSize: size }}>♥</Text>
        );
        if (!isInteractive) return heart;
        return (
          <TouchableOpacity key={n} onPress={() => onPress!(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            {heart}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
