import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../constants/theme';

interface Props {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

// The one quantity stepper for this app — bold circular +/- buttons around a
// large display-weight count. Every screen that lets someone change a quantity
// (Product Detail, Cart) renders this same component, so they can't drift into
// slightly-different one-off steppers again.
export default function QuantityStepper({ value, onIncrement, onDecrement, disabled }: Props) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={onDecrement}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        accessibilityState={{ disabled: !!disabled }}
      >
        <Ionicons name="remove" size={20} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.stepValue} accessibilityLabel={`Quantity ${value}`}>{value}</Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={onIncrement}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        accessibilityState={{ disabled: !!disabled }}
      >
        <Ionicons name="add" size={20} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background, borderRadius: BorderRadius.pill, padding: 4,
  },
  stepBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  stepValue: {
    ...Typography.h3, color: Colors.text, minWidth: 32, textAlign: 'center',
  },
});
