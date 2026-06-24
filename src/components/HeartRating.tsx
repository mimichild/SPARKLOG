import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: number;
  themeColor: string;
  onPress?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

const EMPTY_COLOR = '#d1d5db';

export default function HeartRating({ value, themeColor, onPress, readOnly, size = 16 }: Props) {
  const isInteractive = !readOnly && !!onPress;
  return (
    <View style={styles.row} pointerEvents={isInteractive ? 'auto' : 'none'}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const color = filled ? themeColor : EMPTY_COLOR;
        const heart = (
          <Ionicons key={n} testID="heart" name={filled ? 'heart' : 'heart-outline'} size={size} color={color} />
        );
        if (!isInteractive) return heart;
        return (
          <TouchableOpacity key={n} onPress={() => onPress(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
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
