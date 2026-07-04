import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography } from '../constants/theme';

interface BigButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

export default function BigButton({ label, onPress, loading, disabled, variant = 'primary', style }: BigButtonProps) {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      style={[
        s.base,
        isOutline ? s.outline : s.primary,
        (disabled || loading) && s.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? Colors.organic : Colors.white} size="small" />
      ) : (
        <Text style={[s.label, isOutline && s.labelOutline]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.organic,
  },
  outline: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    ...Typography.button,
    color: Colors.white,
  },
  labelOutline: {
    color: Colors.text,
  },
});
