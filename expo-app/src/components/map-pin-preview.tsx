import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useSavedRestaurantsContext } from "@/context/saved-restaurants-context";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { trackReplaceRecommendation } from "@/services/analytics";
import type { FoodContext, Restaurant } from "@/types/restaurant";

interface MapPinPreviewProps {
  restaurant: Restaurant;
  category: FoodContext;
  onClose: () => void;
  onReplace: () => void;
}

/**
 * Floating bottom sheet shown when a map pin is tapped — quick preview
 * plus "Replace recommendation" / "View full details" / close.
 */
export function MapPinPreview({
  restaurant,
  category,
  onClose,
  onReplace,
}: MapPinPreviewProps) {
  const theme = useTheme();
  const router = useRouter();
  const { isSaved, toggleSaved } = useSavedRestaurantsContext();

  const handleReplace = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackReplaceRecommendation(restaurant, "map");
    onReplace();
    onClose();
  };

  const handleViewDetails = () => {
    router.push({
      pathname: "/result",
      params: {
        restaurant: JSON.stringify(restaurant),
        origin: "map",
        category,
      },
    });
  };

  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      <Pressable
        onPress={onClose}
        hitSlop={10}
        style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
      >
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>

      <RestaurantCard
        restaurant={restaurant}
        veryCompact
        category={category}
        isSaved={isSaved(restaurant.placeId)}
        onToggleSave={() => toggleSaved(restaurant, category)}
      />

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleViewDetails}
          style={[styles.secondaryButton, { borderColor: theme.border }]}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: theme.text }]}>
            {i18n.t("map.view_full_details")}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleReplace}
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
        >
          <ThemedText style={styles.primaryButtonText}>
            {i18n.t("map.replace_recommendation")}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: -14,
    right: Spacing.two,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
