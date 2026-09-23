import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

type BadgeType = 'NPOP' | 'NPOP_PENDING' | 'ORGANIC' | 'NATURAL' | 'ECO_FRIENDLY' | 'VEGAN' | 'GLUTEN_FREE' | 'FAIR_TRADE';

interface Props {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'inline';
  compact?: boolean;
}

// `verified: true` badges are the platform vouching for the claim (admin-approved
// certificate on file). `verified: false` badges are the seller's own claim, with
// no independent check behind it — per the PRD's non-negotiable UI rule, these two
// classes must never look the same weight (solid fill + checkmark vs. outlined +
// no checkmark), and self-declared types always say so in the label.
const BADGE_META: Record<BadgeType, { label: string; tint: string; icon: keyof typeof Ionicons.glyphMap; verified: boolean }> = {
  NPOP: { label: 'NPOP Verified', tint: '#2E7D32', icon: 'shield-checkmark', verified: true },
  NPOP_PENDING: { label: 'Certification Pending', tint: '#B45309', icon: 'time-outline', verified: false },
  ORGANIC: { label: 'Organic', tint: Colors.organic, icon: 'leaf', verified: true },
  NATURAL: { label: 'Natural · Self-declared', tint: Colors.natural, icon: 'flower-outline', verified: false },
  ECO_FRIENDLY: { label: 'Eco-Friendly · Self-declared', tint: Colors.eco, icon: 'earth-outline', verified: false },
  VEGAN: { label: 'Vegan', tint: '#43A047', icon: 'nutrition-outline', verified: false },
  GLUTEN_FREE: { label: 'Gluten Free', tint: '#F9A825', icon: 'alert-circle-outline', verified: false },
  FAIR_TRADE: { label: 'Fair Trade', tint: '#D84315', icon: 'people-outline', verified: false },
};

export default function TrustBadge({ type, size = 'sm', variant = 'pill', compact }: Props) {
  const meta = BADGE_META[type];
  if (!meta) return null;

  const isPill = variant === 'pill';
  const iconSize = size === 'lg' ? 14 : size === 'md' ? 12 : 10;
  const textSize = size === 'lg' ? 11 : size === 'md' ? 10 : 9;
  const shortLabel = meta.label.split(' · ')[0].split(' ')[0];

  if (!isPill) {
    // Inline variant — a small dot + text. Verified: solid dot. Self-declared: hollow ring.
    return (
      <View style={styles.inlineRow}>
        <View
          style={[
            styles.inlineDot,
            meta.verified
              ? { backgroundColor: meta.tint }
              : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: meta.tint },
          ]}
        />
        <Text style={[styles.inlineText, { color: meta.tint, fontSize: textSize + 1 }]}>
          {compact ? shortLabel : meta.label}
        </Text>
      </View>
    );
  }

  // Verified: solid tinted fill + filled shield/check icon (platform-backed claim).
  // Self-declared: outlined, no fill, no checkmark — visually lighter-weight on purpose.
  return (
    <View
      style={[
        styles.pill,
        meta.verified
          ? { backgroundColor: meta.tint + '1A' }
          : { backgroundColor: Colors.white, borderWidth: 1, borderColor: meta.tint + '55' },
      ]}
    >
      <Ionicons name={meta.icon} size={iconSize} color={meta.tint} />
      <Text style={[styles.pillText, { color: meta.tint, fontSize: textSize }]}>
        {compact ? shortLabel : meta.label}
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
