import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows } from '../constants/theme';

interface Props {
  label: string;
  image?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentTint: string;
  isActive: boolean;
  onPress: () => void;
}

/**
 * Circular category selector.
 * Active = filled accent circle + white icon + bold label + soft ring glow.
 * Inactive = tinted background + accent icon + regular label.
 */
export default function CategoryBadge({
  label,
  image,
  icon = 'leaf',
  accent,
  accentTint,
  isActive,
  onPress,
}: Props) {
  // Falls back to the icon instead of a broken-image glyph if imageUrl 404s
  // or points at something invalid.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!image && !imageFailed;

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.75}>
      {/* Outer ring — only visible when active, gives the "selected" glow */}
      <View style={[styles.ring, isActive && { borderColor: accent }]}>
        <View
          style={[
            styles.circle,
            isActive
              ? { backgroundColor: accent }
              : { backgroundColor: accentTint },
          ]}
        >
          {showImage ? (
            <Image
              source={{ uri: image }}
              style={[
                styles.image,
                isActive && { opacity: 0.9 },
              ]}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Ionicons
              name={icon}
              size={24}
              color={isActive ? '#FFFFFF' : accent}
            />
          )}
        </View>
      </View>

      <Text
        style={[
          styles.label,
          isActive && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const CIRCLE = 58;
const RING_BORDER = 2.5;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 68,
    gap: 7,
  },
  ring: {
    width: CIRCLE + RING_BORDER * 2,
    height: CIRCLE + RING_BORDER * 2,
    borderRadius: (CIRCLE + RING_BORDER * 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: RING_BORDER,
    borderColor: 'transparent',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
});
