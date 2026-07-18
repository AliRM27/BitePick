import React, { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useDiscoverContext } from "@/context/discover-context";
import { useRestaurantSearch } from "@/hooks/use-restaurant-search";
import { useSavedRestaurantsContext } from "@/context/saved-restaurants-context";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import {
  trackMapWebFallbackShown,
  trackReplaceRecommendation,
} from "@/services/analytics";
import type { Restaurant } from "@/types/restaurant";

/**
 * Map tab (web) — expo-maps has no web target, so this renders the same
 * pins as a scrollable list instead, keeping the "Replace recommendation"
 * affordance at full parity.
 */
export default function MapWebScreen() {
  const theme = useTheme();
  const { searchParams, setActiveRestaurantId } = useDiscoverContext();
  const { isSaved, toggleSaved } = useSavedRestaurantsContext();
  const query = useRestaurantSearch(searchParams);
  const restaurants = query.data?.data.restaurants ?? [];

  useEffect(() => {
    trackMapWebFallbackShown();
  }, []);

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

  const handleReplace = (restaurant: Restaurant) => {
    Haptics.selectionAsync();
    trackReplaceRecommendation(restaurant, "map_web_list");
    setActiveRestaurantId(restaurant.placeId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {i18n.t("tabs.map")}
        </ThemedText>
        <ThemedText style={[styles.webNote, { color: theme.textSecondary }]}>
          {i18n.t("map.web_unavailable_note")}
        </ThemedText>

        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.placeId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <RestaurantCard
                restaurant={item}
                veryCompact
                category={searchParams.context}
                isSaved={isSaved(item.placeId)}
                onToggleSave={() => toggleSaved(item, searchParams.context)}
              />
              <Pressable
                onPress={() => handleReplace(item)}
                style={[styles.replaceButton, { backgroundColor: theme.accent }]}
              >
                <ThemedText style={styles.replaceButtonText}>
                  {i18n.t("map.replace_recommendation")}
                </ThemedText>
              </Pressable>
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingTop: Spacing.three,
  },
  webNote: {
    fontSize: 13,
    fontWeight: "500",
    paddingTop: Spacing.one,
    paddingBottom: Spacing.three,
  },
  listContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  itemWrapper: {
    gap: Spacing.two,
  },
  replaceButton: {
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  replaceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
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
