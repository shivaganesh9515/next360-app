import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export default function SplashScreen() {
  return (
    <View style={s.container}>
      <View style={s.lockup}>
        <View style={s.mark}>
          <Text style={s.markGlyph}>🌿</Text>
        </View>
        <Text style={s.wordmark}>Next360</Text>
      </View>
      <Text style={s.tagline}>Organic. Natural. Eco-friendly.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.organicLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlyph: {
    fontSize: 24,
  },
  wordmark: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 36,
    color: Colors.text,
  },
  tagline: {
    marginTop: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
});
