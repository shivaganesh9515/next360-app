import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DeliveryMapMarker {
  key: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  pinColor?: string;
}

interface Props {
  style?: StyleProp<ViewStyle>;
  initialRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  markers: DeliveryMapMarker[];
}

// react-native-maps has no web implementation — its native view registration
// calls codegenNativeComponent, which react-native-web doesn't implement, and
// Expo Router eagerly loads every route module for web to build the route
// tree. Importing the real MapView here crashed *every* route, not just this
// screen (the whole web bundle failed to load). This lightweight marker list
// keeps the web build usable; native (iOS/Android) still gets the live map
// via DeliveryMap.tsx.
export default function DeliveryMap({ style, markers }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="map-outline" size={28} color="#9CA3AF" />
      <Text style={styles.title}>Live map is available in the mobile app</Text>
      {markers.map((m) => (
        <View key={m.key} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: m.pinColor || '#6B7280' }]} />
          <Text style={styles.rowText} numberOfLines={1}>
            {m.title}{m.description ? ` — ${m.description}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', padding: 16, gap: 8 },
  title: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowText: { fontSize: 12, color: '#374151', flexShrink: 1 },
});
