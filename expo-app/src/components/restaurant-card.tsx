import React, { useCallback } from "react";
import { Image } from "expo-image";
import {
  ActionSheetIOS,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { StarRating } from "@/components/star-rating";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useSettings, type MapsPreference } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { trackTakeMeThere } from "@/services/analytics";
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
/*  Maps helpers                                                       */
/* ------------------------------------------------------------------ */

function buildMapsUrl(
  provider: "apple" | "google",
  name: string,
  lat: number,
  lng: number,
): string {
  const encodedName = encodeURIComponent(name);
  const ll = `${lat},${lng}`;

  if (provider === "google") {
    return `https://www.google.com/maps/search/?api=1&query=${encodedName}&query_place_id=&center=${ll}`;
  }
  // Apple Maps
  return `http://maps.apple.com/?q=${encodedName}&near=${ll}`;
}

function openInMaps(
  provider: "apple" | "google",
  name: string,
  lat: number,
  lng: number,
) {
  Linking.openURL(buildMapsUrl(provider, name, lat, lng));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface RestaurantCardProps {
  compact?: boolean;
  height?: number;
  photoHeight?: number;
  restaurant: Restaurant;
  veryCompact?: boolean;
  index?: number;
  category?: string;
}

/**
 * Premium restaurant result card.
 * Shows reason badge, photo, name, dynamic explanation, rating, distance, and CTA.
 */
export function RestaurantCard({
  compact = false,
  height,
  photoHeight,
  restaurant,
  veryCompact = false,
  index,
  category,
}: RestaurantCardProps) {
  const theme = useTheme();
  const { mapsPreference } = useSettings();
  const badge = REASON_BADGE[restaurant.reason] || REASON_BADGE.top_pick;
  const photoIdentity = restaurant.photoUrl ?? restaurant.placeId;

  const handleGoThere = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (index !== undefined && category !== undefined) {
      trackTakeMeThere(restaurant, index, category);
    }

    const { name, lat, lng } = restaurant;

    if (mapsPreference === "apple") {
      openInMaps("apple", name, lat, lng);
      return;
    }

    if (mapsPreference === "google") {
      openInMaps("google", name, lat, lng);
      return;
    }

    // "ask" — show native action sheet (iOS) or fall back to Apple Maps (Android)
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Apple Maps", "Google Maps", "Cancel"],
          cancelButtonIndex: 2,
          title: "Open with",
        },
        (buttonIndex) => {
          if (buttonIndex === 0) openInMaps("apple", name, lat, lng);
          if (buttonIndex === 1) openInMaps("google", name, lat, lng);
        },
      );
    } else {
      // Android: default to Google Maps
      openInMaps("google", name, lat, lng);
    }
  }, [restaurant, mapsPreference]);

  const durationLabel =
    restaurant.durationMinutes <= 1
      ? `1 ${i18n.t("components.min_away")}`
      : `${restaurant.durationMinutes} ${i18n.t("components.min_away")}`;

  const distanceLabel =
    restaurant.distanceKm < 1
      ? `${Math.round(restaurant.distanceKm * 1000)}m · ${i18n.t("components.walking")}`
      : `${restaurant.distanceKm.toFixed(1)}km · ${i18n.t("components.driving")}`;

  const reviewCountLabel =
    restaurant.userRatingCount >= 1000
      ? `${(restaurant.userRatingCount / 1000).toFixed(1)}k ${i18n.t("components.reviews")}`
      : `${restaurant.userRatingCount} ${i18n.t("components.reviews")}`;

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        veryCompact && styles.cardVeryCompact,
        height ? { height } : null,
        { backgroundColor: theme.card, shadowColor: theme.text },
      ]}
    >
      {/* Reason Badge */}
      {/* <View
        style={[
          styles.reasonBadge,
          compact && styles.reasonBadgeCompact,
          { backgroundColor: theme.accent },
        ]}
      >
        <ThemedText
          style={[styles.reasonEmoji, compact && styles.reasonEmojiCompact]}
        >
          {badge.emoji}
        </ThemedText>
        <ThemedText
          style={[styles.reasonLabel, compact && styles.reasonLabelCompact]}
          numberOfLines={1}
        >
          {badge.label}
        </ThemedText>
      </View> */}

      {/* Photo */}
      {restaurant.photoUrl ? (
        <View
          style={[
            styles.photoContainer,
            photoHeight ? { height: photoHeight } : null,
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
            photoHeight ? { height: photoHeight } : null,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <ThemedText style={styles.placeholderEmoji}>🍴</ThemedText>
        </View>
      )}

      {/* Info Section */}
      <View
        style={[
          styles.infoSection,
          compact && styles.infoSectionCompact,
          veryCompact && styles.infoSectionVeryCompact,
        ]}
      >
        {/* Name */}
        <ThemedText
          style={[
            styles.name,
            compact && styles.nameCompact,
            veryCompact && styles.nameVeryCompact,
            { color: theme.text },
          ]}
          numberOfLines={2}
        >
          {restaurant.name.charAt(0).toUpperCase() + restaurant.name.slice(1)}
        </ThemedText>

        {/* Dynamic Explanation — smart hint */}

        {/* Rating + Review Count */}
        <View style={styles.ratingRow}>
          <StarRating rating={restaurant.rating} size={compact ? 14 : 15} />
          <View
            style={[
              styles.reviewBadge,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText
              style={[styles.reviewCount, { color: theme.textSecondary }]}
              numberOfLines={1}
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
            <ThemedText
              style={[styles.durationText, { color: theme.text }]}
              numberOfLines={1}
            >
              {durationLabel}
            </ThemedText>
          </View>
          <ThemedText
            style={[styles.distanceDetail, { color: theme.textSecondary }]}
            numberOfLines={1}
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
      <ThemedText
        style={[
          styles.explanationText,
          compact && styles.explanationTextCompact,
          veryCompact && styles.explanationTextVeryCompact,
          { color: theme.textSecondary },
        ]}
        numberOfLines={2}
      >
        ✨ {restaurant.explanation}
      </ThemedText>
      {/* Go There Button */}
      <Pressable
        onPress={handleGoThere}
        style={({ pressed }) => [
          styles.goButton,
          compact && styles.goButtonCompact,
          veryCompact && styles.goButtonVeryCompact,
          { backgroundColor: theme.accent },
          pressed && styles.goButtonPressed,
        ]}
      >
        <ThemedText
          style={[
            styles.goButtonText,
            compact && styles.goButtonTextCompact,
            veryCompact && styles.goButtonTextVeryCompact,
          ]}
          numberOfLines={1}
        >
          {i18n.t("components.take_me_there")}
        </ThemedText>
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
  cardCompact: {
    gap: 12,
    padding: 14,
  },
  cardVeryCompact: {
    gap: 10,
    padding: 12,
    borderRadius: BorderRadius.md,
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
  reasonBadgeCompact: {
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reasonEmoji: {
    fontSize: 13,
  },
  reasonEmojiCompact: {
    fontSize: 12,
  },
  reasonLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  reasonLabelCompact: {
    fontSize: 12,
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
    flex: 1,
    gap: 10,
    minHeight: 0,
  },
  infoSectionCompact: {
    gap: 7,
  },
  infoSectionVeryCompact: {
    gap: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    minHeight: 60,
  },
  nameCompact: {
    fontSize: 22,
    lineHeight: 27,
    minHeight: 54,
  },
  nameVeryCompact: {
    fontSize: 21,
    lineHeight: 26,
    minHeight: 52,
  },
  // Explanation
  explanationText: {
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 18,
    minHeight: 36,
  },
  explanationTextCompact: {
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
  },
  explanationTextVeryCompact: {
    minHeight: 30,
  },
  // Rating
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 22,
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
    minHeight: 28,
  },
  distanceBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "600",
  },
  distanceDetail: {
    flex: 1,
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
  goButtonCompact: {
    height: 48,
  },
  goButtonVeryCompact: {
    height: 46,
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
  goButtonTextCompact: {
    fontSize: 16,
  },
  goButtonTextVeryCompact: {
    fontSize: 15,
  },
});
