import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/theme';

interface Props {
  style: any;
  onPress: () => void;
  pointerEvents?: 'auto' | 'none';
}

// Shared backdrop — inspired by the Framer Motion FloatingPanel pattern.
// Uses a warm dark scrim (rgba(10,10,8,0.4)) with iOS-only Gaussian blur.
// The blur intensity ramps up with the panel animation (0→40) so the
// backdrop feels connected to the panel, not like two separate layers.
export default function PopoverBackdrop({ style, onPress, pointerEvents }: Props) {
  return (
    <Reanimated.View style={[s.backdrop, style, pointerEvents ? { pointerEvents: pointerEvents } : undefined]}>
      {Platform.OS === 'ios' && (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onPress} />
    </Reanimated.View>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,8,0.4)',
  },
});
