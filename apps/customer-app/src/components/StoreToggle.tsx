import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { StoreType } from '../types';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  getStoreAccent,
  getStoreLabel,
} from '../constants/theme';

const STORES = [StoreType.ORGANIC, StoreType.NATURAL, StoreType.ECO_FRIENDLY];
const CROSSFADE_MS = 220;

interface Props {
  selected: StoreType;
  onSelect: (store: StoreType) => void;
}

// Each pill crossfades in/out its own accent fill on selection change (200-250ms),
// per the "material swatch" spec — not an instant color swap.
function SwatchPill({ store, isActive, onPress }: { store: StoreType; isActive: boolean; onPress: () => void }) {
  const fade = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const accent = getStoreAccent(store);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: isActive ? 1 : 0,
      duration: CROSSFADE_MS,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${getStoreLabel(store)} store`}
      accessibilityHint={`Shows ${getStoreLabel(store)} products`}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Animated.View
        style={[styles.pillFill, { backgroundColor: accent, opacity: fade, pointerEvents: 'none' }]}
      />
      <Animated.Text
        style={[
          styles.label,
          {
            color: fade.interpolate({ inputRange: [0, 1], outputRange: [accent as any, Colors.white as any] }),
          },
        ]}
      >
        {getStoreLabel(store)}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function StoreToggle({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {STORES.map((store) => (
        <SwatchPill
          key={store}
          store={store}
          isActive={store === selected}
          onPress={() => onSelect(store)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.pill,
    padding: 3,
    marginHorizontal: Spacing.lg,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pillFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: BorderRadius.pill,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
