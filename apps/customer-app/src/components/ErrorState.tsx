import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  message?: string;
  onRetry: () => void;
}

// Distinguishes "the request failed" from "there's genuinely nothing here" —
// several screens previously swallowed a fetch failure into the same empty
// state used for zero real results, so a real backend outage looked
// identical to "you just haven't used this feature yet."
export default function ErrorState({ message = "Couldn't load this right now.", onRetry }: Props) {
  return (
    <View style={s.container}>
      <Ionicons name="cloud-offline-outline" size={40} color={Colors.textSecondary} />
      <Text style={s.title}>{message}</Text>
      <Text style={s.subtitle}>Check your connection and try again.</Text>
      <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
        <Text style={s.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  // paddingVertical (not flex:1) so this renders sensibly both as a lone
  // full-screen child (a flex:1 SafeAreaView) and as an item inside a
  // flex-wrap grid, where flex:1 would collapse to zero height.
  container: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  title: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginTop: Spacing.md, textAlign: 'center' },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  retryBtn: {
    marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.organic,
  },
  retryText: { ...Typography.button, color: Colors.organic },
});
