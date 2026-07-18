import React from "react";
import { Platform, StyleSheet } from "react-native";
import { AppleMaps, GoogleMaps } from "expo-maps";

export interface MapMarkerData {
  id: string;
  coordinates: { latitude: number; longitude: number };
  title: string;
}

interface NativeMapViewProps {
  markers: MapMarkerData[];
  cameraCoordinates: { latitude: number; longitude: number };
  cameraZoom?: number;
  onMarkerPress: (id: string) => void;
}

/**
 * Thin platform switch over expo-maps' separate AppleMaps.View / GoogleMaps.View
 * components — expo-maps has no unified cross-platform <MapView>, unlike
 * react-native-maps. Native-only; never imported by map.web.tsx.
 */
export function NativeMapView({
  markers,
  cameraCoordinates,
  cameraZoom = 14,
  onMarkerPress,
}: NativeMapViewProps) {
  const cameraPosition = { coordinates: cameraCoordinates, zoom: cameraZoom };

  if (Platform.OS === "ios") {
    return (
      <AppleMaps.View
        style={StyleSheet.absoluteFill}
        cameraPosition={cameraPosition}
        markers={markers}
        onMarkerClick={(marker) => marker.id && onMarkerPress(marker.id)}
        properties={{ isMyLocationEnabled: true, selectionEnabled: true }}
        uiSettings={{ myLocationButtonEnabled: true }}
      />
    );
  }

  return (
    <GoogleMaps.View
      style={StyleSheet.absoluteFill}
      cameraPosition={cameraPosition}
      markers={markers}
      onMarkerClick={(marker) => marker.id && onMarkerPress(marker.id)}
      properties={{ isMyLocationEnabled: true, selectionEnabled: true }}
      uiSettings={{ myLocationButtonEnabled: true }}
    />
  );
}
