import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Shadows } from '../constants/theme';

interface Props {
  label: string;
  image?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentTint: string;
  isActive: boolean;
  onPress: () => void;
}

// Circular photo-badge category selector — ring lights up in the active store's
// accent color, matching the premium reference pattern instead of flat pill chips.
export default function CategoryBadge({ label, image, icon = 'leaf', accent, accentTint, isActive, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.ring,
          isActive && [styles.ringActive, Shadows.button(accent), { borderColor: accent }],
        ]}
      >
        <View style={[styles.circle, { backgroundColor: accentTint }]}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Ionicons name={icon} size={24} color={accent} />
          )}
        </View>
      </View>
      <Text style={[styles.label, isActive && { color: Colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: 72, gap: 6 },
  ring: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  ringActive: {
    borderWidth: 2.5,
  },
  circle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
