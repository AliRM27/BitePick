import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Restaurant } from "@/types/restaurant";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15;
const CARD_ENTRY_OFFSET = SCREEN_WIDTH * 0.4;

/* ------------------------------------------------------------------ */
/*  Progress Dots                                                      */
/* ------------------------------------------------------------------ */

function ProgressDots({ total, current }: { total: number; current: number }) {
  const theme = useTheme();

  if (total > 10) return null;

  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            {
              backgroundColor:
                i === current ? theme.accent : theme.backgroundSelected,
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
/*  Swipe Hint                                                         */
/* ------------------------------------------------------------------ */

function SwipeHint({ visible }: { visible: boolean }) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(600).delay(800)} style={hintStyles.container}>
      <ThemedText style={[hintStyles.text, { color: theme.textSecondary }]}>
        ← Swipe for more picks →
      </ThemedText>
    </Animated.View>
  );
}

const hintStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});

/* ------------------------------------------------------------------ */
/*  Result Screen                                                      */
/* ------------------------------------------------------------------ */

/**
 * Result Screen — shows ONE restaurant at a time.
 * Swipe left/right to navigate between picks.
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [entryOffset, setEntryOffset] = useState(0);

  const currentRestaurant = restaurants[currentIndex] ?? null;
  const hasMore = currentIndex < restaurants.length - 1;
  const hasPrevious = currentIndex > 0;

  // Shared values for gesture
  const translateX = useSharedValue(0);

  // --- Navigation callbacks (called from gesture worklet via runOnJS) ---

  const goNext = useCallback(() => {
    Haptics.selectionAsync();
    setShowHint(false);
    setEntryOffset(CARD_ENTRY_OFFSET);
    setCurrentIndex((prev) => Math.min(prev + 1, restaurants.length - 1));
  }, [restaurants.length]);

  const goPrevious = useCallback(() => {
    Haptics.selectionAsync();
    setShowHint(false);
    setEntryOffset(-CARD_ENTRY_OFFSET);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const edgeBounce = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useLayoutEffect(() => {
    if (entryOffset === 0) return;

    runOnUI((offset: number) => {
      "worklet";

      translateX.value = offset;
      translateX.value = withTiming(0, { duration: 150 });
    })(entryOffset);
    setEntryOffset(0);
  }, [currentIndex, entryOffset, translateX]);

  // --- Pan gesture ---

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      // Dampen at edges
      const atLeftEdge = !hasPrevious && event.translationX > 0;
      const atRightEdge = !hasMore && event.translationX < 0;

      if (atLeftEdge || atRightEdge) {
        // Rubber-band effect at edges
        translateX.value = event.translationX * 0.2;
      } else {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const swipedLeft = event.translationX < -SWIPE_THRESHOLD;
      const swipedRight = event.translationX > SWIPE_THRESHOLD;

      if (swipedLeft && hasMore) {
        // Animate card off to the left. The next card enters after React commits the new index.
        translateX.value = withTiming(
          -SCREEN_WIDTH,
          { duration: 150 },
          () => {
            runOnJS(goNext)();
          },
        );
      } else if (swipedRight && hasPrevious) {
        // Animate card off to the right. The previous card enters after React commits the new index.
        translateX.value = withTiming(
          SCREEN_WIDTH,
          { duration: 150 },
          () => {
            runOnJS(goPrevious)();
          },
        );
      } else {
        // Edge bounce or snap back
        if (
          (event.translationX > 20 && !hasPrevious) ||
          (event.translationX < -20 && !hasMore)
        ) {
          runOnJS(edgeBounce)();
        }
        translateX.value = withTiming(0, {
          duration: 150,
        });
      }
    });

  // --- Animated styles ---

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH * 0.6],
      [1, 0.4],
    ),
  }));

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

          {/* Progress dots + counter */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.header}
          >
            <ProgressDots total={restaurants.length} current={currentIndex} />
            <ThemedText
              style={[styles.counterText, { color: theme.textSecondary }]}
            >
              {currentIndex + 1} of {restaurants.length}
            </ThemedText>
          </Animated.View>

          {/* Swipeable Restaurant Card */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.cardContainer, cardAnimStyle]}>
              <RestaurantCard
                key={currentRestaurant.placeId}
                restaurant={currentRestaurant}
              />
            </Animated.View>
          </GestureDetector>

          {/* Swipe hint + end state */}
          <View style={styles.bottomArea}>
            {hasMore ? (
              <SwipeHint visible={showHint} />
            ) : (
              <Animated.View
                entering={FadeIn.duration(400)}
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
                  You've seen all the top picks!
                </ThemedText>
              </Animated.View>
            )}
          </View>
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
    paddingBottom: Spacing.three,
  },
  // Header
  header: {
    alignItems: "center",
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
  },
  counterText: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  // Card
  cardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  // Bottom
  bottomArea: {
    paddingTop: Spacing.two,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
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
