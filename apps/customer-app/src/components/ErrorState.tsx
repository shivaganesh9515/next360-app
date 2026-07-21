import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  message?: string;
  onRetry: () => void;
  empty?: boolean;
}

// Gentle float-bob animation on the icon — makes the empty/error state feel
// considered rather than a static placeholder. Loops indefinitely on the icon
// itself (a calm CSS-float-like translateY) while leaving the retry button
// fully interactive and un-animated.
export default function ErrorState({ message = "Couldn't load this right now.", onRetry, empty }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={s.container}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <Ionicons
          name={empty ? 'leaf-outline' : 'cloud-offline-outline'}
          size={empty ? 56 : 40}
          color={Colors.textSecondary}
        />
      </Animated.View>
      <Text style={s.title}>{message}</Text>
      <Text style={s.subtitle}>
        {empty ? 'Nothing here yet. Start exploring!' : 'Check your connection and try again.'}
      </Text>
      <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
        <Text style={s.retryText}>{empty ? 'Browse Products' : 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  title: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginTop: Spacing.md, textAlign: 'center' },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  retryBtn: {
    marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.organic,
  },
  retryText: { ...Typography.button, color: Colors.organic },
});
