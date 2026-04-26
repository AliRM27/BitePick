import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
}

/**
 * Visual star rating using Unicode characters.
 * Supports filled, half, and empty stars.
 */
export function StarRating({ rating, maxStars = 5, size = 18, showValue = true }: StarRatingProps) {
  const theme = useTheme();

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (rating >= i) {
      // Full star
      stars.push(
        <View key={i} style={styles.star}>
          <View style={[styles.starBase, { width: size, height: size }]}>
            <View
              style={[
                styles.starFill,
                {
                  backgroundColor: theme.starFilled,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
            />
          </View>
        </View>
      );
    } else if (rating >= i - 0.5) {
      // Half star
      stars.push(
        <View key={i} style={styles.star}>
          <View style={[styles.starBase, { width: size, height: size }]}>
            <View
              style={[
                styles.starEmpty,
                {
                  backgroundColor: theme.starEmpty,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
            />
            <View
              style={[
                styles.starHalf,
                {
                  backgroundColor: theme.starFilled,
                  width: size / 2,
                  height: size,
                  borderTopLeftRadius: size / 2,
                  borderBottomLeftRadius: size / 2,
                },
              ]}
            />
          </View>
        </View>
      );
    } else {
      // Empty star
      stars.push(
        <View key={i} style={styles.star}>
          <View style={[styles.starBase, { width: size, height: size }]}>
            <View
              style={[
                styles.starEmpty,
                {
                  backgroundColor: theme.starEmpty,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
            />
          </View>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{stars}</View>
      {showValue && (
        <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
          <React.Fragment>
            {/* Using a Text from RN directly to avoid nested ThemedText issues */}
            <View>
              <StarRatingText rating={rating} color={theme.accent} />
            </View>
          </React.Fragment>
        </View>
      )}
    </View>
  );
}

function StarRatingText({ rating, color }: { rating: number; color: string }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ color, fontSize: 14, fontWeight: '700' }}>
      {rating.toFixed(1)}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  star: {
    position: 'relative',
  },
  starBase: {
    position: 'relative',
    overflow: 'hidden',
  },
  starFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  starEmpty: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  starHalf: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
