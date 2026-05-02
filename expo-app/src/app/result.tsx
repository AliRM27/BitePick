import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Restaurant } from "@/types/restaurant";

/* ------------------------------------------------------------------ */
/*  "Alternative pick" button                                          */
/* ------------------------------------------------------------------ */

function AlternativePickButton({
  onPress,
  remaining,
}: {
  onPress: () => void;
  remaining: number;
}) {
  const theme = useTheme();

  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Haptics.selectionAsync();
    scale.value = withSequence(
      withSpring(0.95, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    );
    onPress();
  };

  return (
    <Animated.View style={[{ width: "100%" }, animStyle]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          altStyles.button,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <ThemedText style={[altStyles.label, { color: theme.text }]}>
          Try another
        </ThemedText>
        <ThemedText style={[altStyles.count, { color: theme.textSecondary }]}>
          {remaining} left
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const altStyles = StyleSheet.create({
  button: {
    width: "100%",
    height: 50,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  count: {
    fontSize: 13,
    fontWeight: "500",
  },
});

/* ------------------------------------------------------------------ */
/*  Progress Dots                                                      */
/* ------------------------------------------------------------------ */

function ProgressDots({ total, current }: { total: number; current: number }) {
  const theme = useTheme();

  if (total > 8) return null;

  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            {
              backgroundColor:
                i === current ? theme.accent : theme.backgroundElement,
              width: i === current ? 20 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

/* ------------------------------------------------------------------ */
/*  Result Screen                                                      */
/* ------------------------------------------------------------------ */

/**
 * Result Screen — shows ONE restaurant at a time.
 * User can navigate forward ("Alternative pick") and back ("Previous").
 */
export default function ResultScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    restaurants: string;
    userLat: string;
    userLng: string;
  }>();

  const restaurants: Restaurant[] = useMemo(() => {
    try {
      return JSON.parse(params.restaurants || "[]");
    } catch {
      return [];
    }
  }, [params.restaurants]);

  const userLat = params.userLat ? parseFloat(params.userLat) : null;
  const userLng = params.userLng ? parseFloat(params.userLng) : null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  const currentRestaurant = restaurants[currentIndex] ?? null;
  const hasMore = currentIndex < restaurants.length - 1;
  const hasPrevious = currentIndex > 0;
  const remaining = restaurants.length - 1 - currentIndex;

  const handleTryAnother = () => {
    if (hasMore) {
      setCurrentIndex((prev) => prev + 1);
      setAnimationKey((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex((prev) => prev - 1);
      setAnimationKey((prev) => prev + 1);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // Empty state
  if (!currentRestaurant) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.emptyState}>
          <ThemedText style={styles.emptyEmoji}>😕</ThemedText>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            No restaurants found
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtitle, { color: theme.textSecondary }]}
          >
            Try again from a different location
          </ThemedText>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.emptyBackButton,
              { backgroundColor: theme.accent },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <ThemedText style={styles.emptyBackButtonText}>Go back</ThemedText>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button onPress={handleGoBack} icon={"xmark"} />
          </Stack.Toolbar>
          {/* Header */}
          {/* <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Pressable
              onPress={handleGoBack}
              style={({ pressed }) => [
                styles.headerButton,
                { backgroundColor: theme.backgroundElement },
                pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
              ]}
            >
              <ThemedText
                style={[styles.headerButtonText, { color: theme.text }]}
              >
                ← Back
              </ThemedText>
            </Pressable>

            <ProgressDots total={restaurants.length} current={currentIndex} />

            <ThemedText
              style={[styles.counterText, { color: theme.textSecondary }]}
            >
              {currentIndex + 1}/{restaurants.length}
            </ThemedText>
          </Animated.View> */}
          <View style={{ paddingTop: 20 }}>
            <ProgressDots total={restaurants.length} current={currentIndex} />
          </View>

          {/* Restaurant Card */}
          <Animated.View
            key={animationKey}
            entering={FadeIn.duration(250)}
            style={styles.cardContainer}
          >
            <RestaurantCard
              restaurant={currentRestaurant}
              userLat={userLat}
              userLng={userLng}
            />
          </Animated.View>

          {/* Bottom Actions — clear hierarchy */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={styles.bottomActions}
          >
            {/* Primary row: Alternative Pick */}
            {hasMore ? (
              <AlternativePickButton
                onPress={handleTryAnother}
                remaining={remaining}
              />
            ) : (
              <View
                style={[
                  styles.noMoreContainer,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText style={styles.noMoreEmoji}>🎯</ThemedText>
                <ThemedText
                  style={[styles.noMoreText, { color: theme.textSecondary }]}
                >
                  You've seen all the top picks nearby!
                </ThemedText>
              </View>
            )}

            {/* Previous button — subtle, only visible when applicable */}
            {hasPrevious && (
              <Pressable
                onPress={handlePrevious}
                style={({ pressed }) => [
                  styles.previousButton,
                  pressed && { opacity: 0.6, transform: [{ scale: 0.97 }] },
                ]}
              >
                <ThemedText
                  style={[styles.previousText, { color: theme.textSecondary }]}
                >
                  ← Previous pick
                </ThemedText>
              </Pressable>
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </>
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
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  headerButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  counterText: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  // Card
  cardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  // Bottom
  bottomActions: {
    paddingTop: Spacing.two,
    gap: Spacing.two,
    alignItems: "center",
  },
  // Previous
  previousButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  previousText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // No more
  noMoreContainer: {
    width: "100%",
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  noMoreEmoji: {
    fontSize: 20,
  },
  noMoreText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
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
