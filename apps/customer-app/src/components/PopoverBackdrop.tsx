import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface Props {
  style: any;
  onPress: () => void;
  pointerEvents?: 'auto' | 'none';
}

// Shared by all four expand-in-place popovers (search dock, notifications,
// location, profile). Real-time Gaussian blur is cheap on iOS (hardware
// accelerated) but was the actual cause of "way too laggy" popover
// animations reported on a budget/mid-range Android device (MediaTek
// Dimensity mt6886) — moving the open/close animation to Reanimated's UI
// thread wasn't enough on its own, because a full-screen blur layer redrawing
// every frame is expensive regardless of which thread drives the layout
// animation around it. Falls back to the base rgba scrim with no blur on
// Android instead of paying for an effect most Android GPUs can't render
// smoothly.
export default function PopoverBackdrop({ style, onPress, pointerEvents }: Props) {
  return (
    <Reanimated.View style={style} pointerEvents={pointerEvents}>
      {Platform.OS === 'ios' && (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onPress} />
    </Reanimated.View>
  );
}
