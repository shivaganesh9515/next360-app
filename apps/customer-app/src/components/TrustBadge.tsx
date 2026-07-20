import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

type BadgeType = 'NPOP' | 'ORGANIC' | 'NATURAL' | 'ECO_FRIENDLY' | 'VEGAN' | 'GLUTEN_FREE' | 'FAIR_TRADE';

interface Props {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'inline';
  compact?: boolean;
}

const BADGE_META: Record<BadgeType, { label: string; tint: string; icon: keyof typeof Ionicons.glyphMap }> = {
  NPOP: { label: 'NPOP Certified', tint: '#2E7D32', icon: 'shield-checkmark' },
  ORGANIC: { label: 'Organic', tint: Colors.organic, icon: 'leaf' },
  NATURAL: { label: 'Natural', tint: Colors.natural, icon: 'flower-outline' },
  ECO_FRIENDLY: { label: 'Eco-Friendly', tint: Colors.eco, icon: 'earth-outline' },
  VEGAN: { label: 'Vegan', tint: '#43A047', icon: 'nutrition-outline' },
  GLUTEN_FREE: { label: 'Gluten Free', tint: '#F9A825', icon: 'alert-circle-outline' },
  FAIR_TRADE: { label: 'Fair Trade', tint: '#D84315', icon: 'people-outline' },
};

export default function TrustBadge({ type, size = 'sm', variant = 'pill', compact }: Props) {
  const meta = BADGE_META[type];
  if (!meta) return null;

  const isPill = variant === 'pill';
  const iconSize = size === 'lg' ? 14 : size === 'md' ? 12 : 10;
  const textSize = size === 'lg' ? 11 : size === 'md' ? 10 : 9;

  if (!isPill) {
    // Inline variant — a small colored dot + text, for compact contexts
    return (
      <View style={styles.inlineRow}>
        <View style={[styles.inlineDot, { backgroundColor: meta.tint }]} />
        <Text style={[styles.inlineText, { color: meta.tint, fontSize: textSize + 1 }]}>
          {compact ? meta.label.split(' ')[0] : meta.label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.pill, { backgroundColor: meta.tint + '1A' }]}>
      <Ionicons name={meta.icon} size={iconSize} color={meta.tint} />
      <Text style={[styles.pillText, { color: meta.tint, fontSize: textSize }]}>
        {compact ? meta.label.split(' ')[0] : meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  pillText: {
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  inlineText: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
