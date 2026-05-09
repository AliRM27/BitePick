import React from "react";
import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { StarRating } from "@/components/star-rating";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { PickReason, Restaurant } from "@/types/restaurant";

/* ------------------------------------------------------------------ */
/*  Reason badge config (emoji + short label only)                     */
/* ------------------------------------------------------------------ */

const REASON_BADGE: Record<PickReason, { emoji: string; label: string }> = {
  top_pick: { emoji: "👑", label: "Top Pick" },
  best_rated: { emoji: "⭐", label: "Best Rated" },
  popular: { emoji: "🔥", label: "Popular" },
  closest: { emoji: "📍", label: "Closest" },
  hidden_gem: { emoji: "💎", label: "Hidden Gem" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface RestaurantCardProps {
  restaurant: Restaurant;
}

/**
 * Premium restaurant result card.
 * Shows reason badge, photo, name, dynamic explanation, rating, distance, and CTA.
 */
export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const theme = useTheme();
  const badge = REASON_BADGE[restaurant.reason] || REASON_BADGE.top_pick;
  const photoIdentity = restaurant.photoUrl ?? restaurant.placeId;

  const handleGoThere = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Use the restaurant name as a search query near its coordinates.
    // This opens the actual place listing (photos, reviews, hours)
    // instead of just a pin on raw coordinates.
    const name = encodeURIComponent(restaurant.name);
    const ll = `${restaurant.lat},${restaurant.lng}`;

    const url = `http://maps.apple.com/?q=${name}&near=${ll}`;

    Linking.openURL(url);
  };

  const durationLabel =
    restaurant.durationMinutes <= 1
      ? "1 min away"
      : `${restaurant.durationMinutes} min away`;

  const distanceLabel =
    restaurant.distanceKm < 1
      ? `${Math.round(restaurant.distanceKm * 1000)}m · Walking`
      : `${restaurant.distanceKm.toFixed(1)}km · Driving`;

  const reviewCountLabel =
    restaurant.userRatingCount >= 1000
      ? `${(restaurant.userRatingCount / 1000).toFixed(1)}k reviews`
      : `${restaurant.userRatingCount} reviews`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, shadowColor: theme.text },
      ]}
    >
      {/* Reason Badge */}
      <View style={[styles.reasonBadge, { backgroundColor: theme.accent }]}>
        <ThemedText style={styles.reasonEmoji}>{badge.emoji}</ThemedText>
        <ThemedText style={styles.reasonLabel}>{badge.label}</ThemedText>
      </View>

      {/* Photo */}
      {restaurant.photoUrl ? (
        <View
          style={[
            styles.photoContainer,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <Image
            key={photoIdentity}
            recyclingKey={photoIdentity}
            source={{ uri: restaurant.photoUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={0}
          />
        </View>
      ) : (
        <View
          style={[
            styles.photoContainer,
            styles.photoPlaceholder,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <ThemedText style={styles.placeholderEmoji}>🍴</ThemedText>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        {/* Name */}
        <ThemedText
          style={[styles.name, { color: theme.text }]}
          numberOfLines={2}
        >
          {restaurant.name}
        </ThemedText>

        {/* Dynamic Explanation — smart hint */}
        <ThemedText
          style={[styles.explanationText, { color: theme.textSecondary }]}
        >
          ✨ {restaurant.explanation}
        </ThemedText>

        {/* Rating + Review Count */}
        <View style={styles.ratingRow}>
          <StarRating rating={restaurant.rating} size={15} />
          <View
            style={[
              styles.reviewBadge,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText
              style={[styles.reviewCount, { color: theme.textSecondary }]}
            >
              {reviewCountLabel}
            </ThemedText>
          </View>
        </View>

        {/* Distance & Duration */}
        <View style={styles.distanceRow}>
          <View
            style={[
              styles.distanceBadge,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText style={[styles.durationText, { color: theme.text }]}>
              📍 {durationLabel}
            </ThemedText>
          </View>
          <ThemedText
            style={[styles.distanceDetail, { color: theme.textSecondary }]}
          >
            {distanceLabel}
          </ThemedText>
        </View>

        {/* Address */}
        <ThemedText
          style={[styles.address, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {restaurant.formattedAddress}
        </ThemedText>
      </View>

      {/* Go There Button */}
      <Pressable
        onPress={handleGoThere}
        style={({ pressed }) => [
          styles.goButton,
          { backgroundColor: theme.accent },
          pressed && styles.goButtonPressed,
        ]}
      >
        <ThemedText style={styles.goButtonText}>Take me there →</ThemedText>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  card: {
    width: "100%",
    gap: Spacing.three,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  // Reason badge
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  reasonEmoji: {
    fontSize: 13,
  },
  reasonLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  // Photo
  photoContainer: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  // Info
  infoSection: {
    gap: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  // Explanation
  explanationText: {
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 18,
  },
  // Rating
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  reviewCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Distance
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "600",
  },
  distanceDetail: {
    fontSize: 13,
    fontWeight: "500",
  },
  address: {
    fontSize: 13,
    fontWeight: "500",
  },
  // CTA button
  goButton: {
    width: "100%",
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  goButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  goButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
