import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

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
  initialRegion: Region;
  markers: DeliveryMapMarker[];
}

export default function DeliveryMap({ style, initialRegion, markers }: Props) {
  return (
    <MapView style={style} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}>
      {markers.map((m) => (
        <Marker
          key={m.key}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          title={m.title}
          description={m.description}
          pinColor={m.pinColor}
        />
      ))}
    </MapView>
  );
}
