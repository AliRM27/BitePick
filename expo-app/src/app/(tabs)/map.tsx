import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MapPinPreview } from "@/components/map-pin-preview";
import { NativeMapView, type MapMarkerData } from "@/components/native-map-view";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useDiscoverContext } from "@/context/discover-context";
import { useRestaurantSearch } from "@/hooks/use-restaurant-search";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { trackMapPinTapped } from "@/services/analytics";
import type { Restaurant } from "@/types/restaurant";

/**
 * Map tab (native) — exploration, not decision. Shows pins for whatever
 * Discover last searched (same shared query, same cache, zero extra
 * network calls), and supports "Replace recommendation" to promote a pin
 * to Discover's active pick without switching tabs.
 */
export default function MapScreen() {
  const theme = useTheme();
  const { searchParams, setActiveRestaurantId } = useDiscoverContext();
  const query = useRestaurantSearch(searchParams);
  const restaurants = query.data?.data.restaurants ?? [];

  const [previewRestaurant, setPreviewRestaurant] = useState<Restaurant | null>(
    null,
  );

  const markers: MapMarkerData[] = useMemo(
    () =>
      restaurants.map((r) => ({
        id: r.placeId,
        coordinates: { latitude: r.lat, longitude: r.lng },
        title: r.name,
      })),
    [restaurants],
  );

  const handleMarkerPress = useCallback(
    (id: string) => {
      const index = restaurants.findIndex((r) => r.placeId === id);
      if (index === -1) return;
      trackMapPinTapped(restaurants[index], index);
      setPreviewRestaurant(restaurants[index]);
    },
    [restaurants],
  );

  if (!searchParams) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.emptyState}>
          <ThemedText style={styles.emptyEmoji}>🗺️</ThemedText>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            {i18n.t("map.empty_state_title")}
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtitle, { color: theme.textSecondary }]}
          >
            {i18n.t("map.empty_state_subtitle")}
          </ThemedText>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NativeMapView
        markers={markers}
        cameraCoordinates={{
          latitude: searchParams.latitude,
          longitude: searchParams.longitude,
        }}
        onMarkerPress={handleMarkerPress}
      />

      {previewRestaurant && (
        <MapPinPreview
          restaurant={previewRestaurant}
          category={searchParams.context}
          onClose={() => setPreviewRestaurant(null)}
          onReplace={() => setActiveRestaurantId(previewRestaurant.placeId)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  emptySubtitle: { fontSize: 15, fontWeight: "500", textAlign: "center" },
});
