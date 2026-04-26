import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Restaurant } from "@/types/restaurant";

/* ------------------------------------------------------------------ */
/*  Animated "Alternative pick" button                                 */
/* ------------------------------------------------------------------ */

function AlternativePickButton({
  onPress,
  remaining,
}: {
  onPress: () => void;
  remaining: number;
}) {
  const theme = useTheme();

  // Bounce animation on each press
  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-1);

  // Subtle shimmer to attract taps
  useEffect(() => {
    const interval = setInterval(() => {
      shimmerX.value = withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 0 }),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [shimmerX]);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerX.value > 0 ? 0.08 : 0,
    transform: [{ translateX: shimmerX.value * 150 }],
  }));

  const handlePress = () => {
    // Satisfying bounce on tap
    scale.value = withSequence(
      withSpring(0.92, { damping: 10, stiffness: 400 }),
      withSpring(1.03, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 250 }),
    );
    onPress();
  };

  return (
    <Animated.View style={buttonAnimStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          altStyles.button,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Shimmer overlay */}
        <Animated.View
          style={[
            altStyles.shimmer,
            { backgroundColor: theme.accent },
            shimmerStyle,
          ]}
        />

        <View style={altStyles.content}>
          <ThemedText style={altStyles.icon}>🔀</ThemedText>
          <View style={altStyles.textColumn}>
            <ThemedText
              style={[altStyles.label, { color: theme.text }]}
            >
              Alternative pick
            </ThemedText>
            <ThemedText
              style={[altStyles.hint, { color: theme.textSecondary }]}
            >
              {remaining} more {remaining === 1 ? "option" : "options"} nearby
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const altStyles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 20,
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    borderRadius: BorderRadius.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  icon: {
    fontSize: 22,
  },
  textColumn: {
    alignItems: "flex-start",
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
});

/* ------------------------------------------------------------------ */
/*  Progress Dots                                                      */
/* ------------------------------------------------------------------ */

function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const theme = useTheme();

  // Only show dots if there are few results
  if (total > 8) return null;

  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            {
              backgroundColor: i === current ? theme.accent : theme.backgroundElement,
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
 * User can tap "Alternative pick" to cycle through ranked options
 * with satisfying animations.
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
  const remaining = restaurants.length - 1 - currentIndex;

  const handleTryAnother = () => {
    if (hasMore) {
      setCurrentIndex((prev) => prev + 1);
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
            style={[styles.backButton, { backgroundColor: theme.accent }]}
          >
            <ThemedText style={styles.backButtonText}>Go back</ThemedText>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: theme.backgroundElement },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText
              style={[styles.headerButtonText, { color: theme.text }]}
            >
              ← Back
            </ThemedText>
          </Pressable>

          {/* Progress dots */}
          <ProgressDots total={restaurants.length} current={currentIndex} />

          <ThemedText
            style={[styles.counterText, { color: theme.textSecondary }]}
          >
            {currentIndex + 1}/{restaurants.length}
          </ThemedText>
        </Animated.View>

        {/* Restaurant Card with animation on change */}
        <Animated.View
          key={animationKey}
          entering={
            currentIndex === 0
              ? FadeInDown.duration(500).delay(100)
              : SlideInRight.duration(300).springify().damping(18)
          }
          style={styles.cardContainer}
        >
          <RestaurantCard
            restaurant={currentRestaurant}
            userLat={userLat}
            userLng={userLng}
          />
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={styles.bottomActions}
        >
          {hasMore ? (
            <AlternativePickButton
              onPress={handleTryAnother}
              remaining={remaining}
            />
          ) : (
            <View
              style={[
                styles.noMoreContainer,
                { backgroundColor: theme.accentSoft, borderColor: theme.border },
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
        </Animated.View>
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
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  noMoreContainer: {
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
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.three,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
