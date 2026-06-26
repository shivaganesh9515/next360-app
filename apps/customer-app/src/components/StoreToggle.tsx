import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StoreType } from '../types';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  getStoreAccent,
  getStoreAccentLight,
  getStoreLabel,
} from '../constants/theme';

const STORES = [StoreType.ORGANIC, StoreType.NATURAL, StoreType.ECO_FRIENDLY];

interface Props {
  selected: StoreType;
  onSelect: (store: StoreType) => void;
}

export default function StoreToggle({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {STORES.map((store) => {
        const isActive = store === selected;
        const accent = getStoreAccent(store);
        const accentLight = getStoreAccentLight(store);
        return (
          <TouchableOpacity
            key={store}
            style={[
              styles.pill,
              { backgroundColor: isActive ? accent : 'transparent' },
            ]}
            onPress={() => onSelect(store)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, { color: isActive ? Colors.white : accent }]}>
              {getStoreLabel(store)}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  },
  pill: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
