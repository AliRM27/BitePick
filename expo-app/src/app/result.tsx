import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useDiscoverContext } from "@/context/discover-context";
import { useSavedRestaurantsContext } from "@/context/saved-restaurants-context";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { trackReplaceRecommendation } from "@/services/analytics";
import type { FoodContext, Restaurant } from "@/types/restaurant";

/**
 * Single-restaurant detail view — reached from the Map tab's "View full
 * details" and from tapping a Saved card. Discover owns the primary
 * swipe-through-picks flow itself now (see (tabs)/index.tsx); this screen
 * no longer receives a list.
 */
export default function ResultScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setActiveRestaurantId } = useDiscoverContext();
  const { isSaved, getFeedback, toggleSaved, setFeedback } =
    useSavedRestaurantsContext();
  const params = useLocalSearchParams<{
    restaurant: string;
    origin?: string;
    category?: string;
  }>();
  const context = (params.category as FoodContext) ?? "food";

  const restaurant: Restaurant | null = useMemo(() => {
    try {
      return params.restaurant ? JSON.parse(params.restaurant) : null;
    } catch {
      return null;
    }
  }, [params.restaurant]);

  const [replaced, setReplaced] = useState(false);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleReplace = useCallback(() => {
    if (!restaurant) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveRestaurantId(restaurant.placeId);
    trackReplaceRecommendation(restaurant, "result_detail");
    setReplaced(true);
  }, [restaurant, setActiveRestaurantId]);

  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.emptyState}>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button onPress={handleGoBack} icon={"xmark"} />
          </Stack.Toolbar>
          <Animated.View
            entering={FadeIn.duration(500)}
            style={{ alignItems: "center", gap: Spacing.three }}
          >
            <ThemedText style={styles.emptyEmoji}>😕</ThemedText>
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              {i18n.t("result.no_restaurants")}
            </ThemedText>
            <ThemedText
              style={[styles.emptySubtitle, { color: theme.textSecondary }]}
            >
              {i18n.t("result.try_again")}
            </ThemedText>
            <Pressable
              onPress={handleGoBack}
              style={({ pressed }) => [
                styles.emptyBackButton,
                { backgroundColor: theme.accent },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <ThemedText style={styles.emptyBackButtonText}>
                {i18n.t("result.go_back")}
              </ThemedText>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button onPress={handleGoBack} icon={"xmark"} />
        </Stack.Toolbar>

        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.cardContainer}
        >
          <RestaurantCard
            restaurant={restaurant}
            index={0}
            category={params.category}
            isSaved={isSaved(restaurant.placeId)}
            onToggleSave={() => toggleSaved(restaurant, context)}
            feedback={getFeedback(restaurant.placeId)}
            onFeedback={(value) => setFeedback(restaurant, context, value)}
          />
        </Animated.View>

        {params.origin === "map" && (
          <View style={styles.footer}>
            <Pressable
              onPress={handleReplace}
              disabled={replaced}
              style={({ pressed }) => [
                styles.replaceButton,
                { backgroundColor: replaced ? theme.backgroundElement : theme.accent },
                pressed && !replaced && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <ThemedText
                style={[
                  styles.replaceButtonText,
                  { color: replaced ? theme.textSecondary : "#FFFFFF" },
                ]}
              >
                {replaced
                  ? i18n.t("map.replaced_confirmation")
                  : i18n.t("map.replace_recommendation")}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: 0,
    width: "100%",
  },
  footer: {
    paddingTop: Spacing.two,
  },
  replaceButton: {
    width: "100%",
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  replaceButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyBackButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.three,
  },
  emptyBackButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
