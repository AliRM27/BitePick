import React from "react";
import { Image } from "expo-image";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { StarRating } from "@/components/star-rating";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { PickReason, Restaurant } from "@/types/restaurant";

/* ------------------------------------------------------------------ */
/*  Reason label config                                                */
/* ------------------------------------------------------------------ */

const REASON_CONFIG: Record<PickReason, { emoji: string; label: string; tagline: string }> = {
  top_pick: {
    emoji: "👑",
    label: "Top Pick",
    tagline: "Best rated & closest to you",
  },
  best_rated: {
    emoji: "⭐",
    label: "Best Rated",
    tagline: "Highest quality nearby",
  },
  popular: {
    emoji: "🔥",
    label: "Popular Choice",
    tagline: "Loved by many, close to you",
  },
  closest: {
    emoji: "📍",
    label: "Closest Gem",
    tagline: "Great reviews, short distance",
  },
  hidden_gem: {
    emoji: "💎",
    label: "Hidden Gem",
    tagline: "Under the radar, but great",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface RestaurantCardProps {
  restaurant: Restaurant;
  userLat?: number | null;
  userLng?: number | null;
}

/**
 * Premium restaurant result card.
 * Shows contextual reason badge, photo, name, rating, distance, and CTA.
 */
export function RestaurantCard({
  restaurant,
  userLat,
  userLng,
}: RestaurantCardProps) {
  const theme = useTheme();
  const reason = REASON_CONFIG[restaurant.reason] || REASON_CONFIG.top_pick;

  const handleGoThere = () => {
    const destination = `${restaurant.lat},${restaurant.lng}`;
    const origin = userLat && userLng ? `${userLat},${userLng}` : null;

    const url = origin
      ? `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=w`
      : `http://maps.apple.com/?daddr=${destination}&dirflg=w`;

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

  // Format review count nicely
  const reviewCountLabel =
    restaurant.userRatingCount >= 1000
      ? `${(restaurant.userRatingCount / 1000).toFixed(1)}k reviews`
      : `${restaurant.userRatingCount} reviews`;

  return (
    <View style={styles.card}>
      {/* Reason Badge — floating on top of the card */}
      <View style={[styles.reasonBadge, { backgroundColor: theme.accent }]}>
        <ThemedText style={styles.reasonEmoji}>{reason.emoji}</ThemedText>
        <ThemedText style={styles.reasonLabel}>{reason.label}</ThemedText>
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
            source={{ uri: restaurant.photoUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={300}
          />
          {/* Bottom gradient overlay */}
          <View style={styles.photoGradient} />
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

        {/* Rating + Review Count row */}
        <View style={styles.ratingRow}>
          <StarRating rating={restaurant.rating} size={14} />
          <View style={[styles.reviewBadge, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.reviewCount, { color: theme.textSecondary }]}>
              {reviewCountLabel}
            </ThemedText>
          </View>
        </View>

        {/* Distance & Duration */}
        <View style={styles.distanceRow}>
          <View
            style={[
              styles.distanceBadge,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <ThemedText style={[styles.durationText, { color: theme.accent }]}>
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

      {/* Tagline */}
      <ThemedText style={[styles.tagline, { color: theme.textSecondary }]}>
        ✨ {reason.tagline}
      </ThemedText>
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
  },
  // Reason badge
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  reasonEmoji: {
    fontSize: 15,
  },
  reasonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  // Photo
  photoContainer: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 56,
  },
  // Info
  infoSection: {
    gap: 10,
    paddingHorizontal: Spacing.one,
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
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
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  distanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "700",
  },
  distanceDetail: {
    fontSize: 13,
    fontWeight: "500",
  },
  address: {
    fontSize: 14,
    fontWeight: "500",
  },
  // CTA button
  goButton: {
    width: "100%",
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  goButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  goButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  // Tagline
  tagline: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
  },
});
