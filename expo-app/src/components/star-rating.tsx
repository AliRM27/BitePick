import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
}

/**
 * Visual star rating using ★ and ☆ characters.
 * Clean, reliable across all platforms.
 */
export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  showValue = true,
}: StarRatingProps) {
  const theme = useTheme();

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (rating >= i - 0.25) {
      // Full star
      stars.push(
        <Text
          key={i}
          style={[styles.starChar, { fontSize: size, color: theme.starFilled }]}
        >
          ★
        </Text>
      );
    } else if (rating >= i - 0.75) {
      // Half star — show filled (visually close enough at small sizes)
      stars.push(
        <Text
          key={i}
          style={[styles.starChar, { fontSize: size, color: theme.starFilled, opacity: 0.55 }]}
        >
          ★
        </Text>
      );
    } else {
      // Empty star
      stars.push(
        <Text
          key={i}
          style={[styles.starChar, { fontSize: size, color: theme.starEmpty }]}
        >
          ★
        </Text>
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{stars}</View>
      {showValue && (
        <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.ratingValue, { color: theme.accent }]}>
            {rating.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  starChar: {
    lineHeight: undefined, // let the font handle it
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "700",
  },
});
