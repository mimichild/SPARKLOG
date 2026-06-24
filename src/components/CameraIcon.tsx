import React from 'react';
import { View } from 'react-native';

interface Props {
  color?: string;
  size?: number;
}

export default function CameraIcon({ color = '#cbd5e1', size = 22 }: Props) {
  const bodyWidth = size;
  const bodyHeight = size * 0.72;
  const bumpWidth = size * 0.32;
  const bumpHeight = size * 0.16;
  const lensSize = size * 0.36;

  return (
    <View style={{ width: bodyWidth, height: bodyHeight + bumpHeight, alignItems: 'center' }}>
      <View
        style={{
          width: bumpWidth,
          height: bumpHeight,
          backgroundColor: color,
          borderRadius: bumpHeight / 3,
        }}
      />
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          backgroundColor: color,
          borderRadius: size * 0.14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: lensSize,
            height: lensSize,
            borderRadius: lensSize / 2,
            borderWidth: 2,
            borderColor: '#ffffff',
          }}
        />
      </View>
    </View>
  );
}
