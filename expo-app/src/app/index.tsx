import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { PickButton } from "@/components/pick-button";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useLocation } from "@/hooks/use-location";
import { useTheme } from "@/hooks/use-theme";
import { pickRestaurant } from "@/services/restaurant";
import type { FoodContext } from "@/types/restaurant";

/* ------------------------------------------------------------------ */
/*  Context options                                                    */
/* ------------------------------------------------------------------ */

const CONTEXT_OPTIONS: { key: FoodContext; emoji: string; label: string }[] = [
  { key: "coffee", emoji: "☕", label: "Coffee" },
  { key: "food", emoji: "🍝", label: "Food" },
  { key: "quick_bite", emoji: "⚡", label: "Quick bite" },
];

/* ------------------------------------------------------------------ */
/*  Rotating subtitle suggestions                                      */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  "Craving something new? 🌮",
  "Hungry? Let us decide. 🍜",
  "Skip the endless scrolling. 🍕",
  "One tap. One pick. Let's go. 🍔",
  "Trust the algorithm. 🍣",
];

function useRotatingText(items: string[], intervalMs = 3000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, intervalMs]);

  return items[index];
}

/* ------------------------------------------------------------------ */
/*  Context Selector                                                   */
/* ------------------------------------------------------------------ */

function ContextSelector({
  selected,
  onSelect,
}: {
  selected: FoodContext;
  onSelect: (ctx: FoodContext) => void;
}) {
  const theme = useTheme();

  return (
    <View style={ctxStyles.container}>
      {CONTEXT_OPTIONS.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Haptics.selectionAsync();
              onSelect(opt.key);
            }}
            style={[
              ctxStyles.pill,
              {
                backgroundColor: isActive
                  ? theme.accent
                  : theme.backgroundElement,
                borderColor: isActive ? theme.accent : theme.border,
              },
            ]}
          >
            <ThemedText style={ctxStyles.emoji}>{opt.emoji}</ThemedText>
            <ThemedText
              style={[
                ctxStyles.label,
                { color: isActive ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const ctxStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});

/* ------------------------------------------------------------------ */
/*  Home Screen                                                        */
/* ------------------------------------------------------------------ */

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { getLocation } = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<FoodContext>("food");
  const subtitle = useRotatingText(SUGGESTIONS);
  const lastLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Floating animation for the hero emoji
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [floatY]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handlePick = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get location
      const coords = await getLocation();
      if (!coords) {
        setLoading(false);
        return;
      }

      lastLocationRef.current = coords;

      // 2. Call backend with context
      const result = await pickRestaurant(
        coords.latitude,
        coords.longitude,
        3000,
        context,
      );

      if (!result.data.restaurants || result.data.restaurants.length === 0) {
        setError(
          "No great options found nearby. Try a different category or location.",
        );
        setLoading(false);
        return;
      }

      // 3. Navigate to result screen with data
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/result",
        params: {
          restaurants: JSON.stringify(result.data.restaurants),
          userLat: coords.latitude.toString(),
          userLng: coords.longitude.toString(),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getLocation, router, context]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View
            entering={FadeIn.duration(600).delay(200)}
            style={floatStyle}
          >
            <ThemedText style={styles.heroEmoji}>🍽️</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              Where should{"\n"}I eat?
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(600)}>
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
              key={subtitle}
            >
              {subtitle}
            </ThemedText>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(800)}
          style={styles.bottomSection}
        >
          {/* Error message */}
          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: "rgba(239, 68, 68, 0.1)" },
              ]}
            >
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {/* Context Selector */}
          <ContextSelector selected={context} onSelect={setContext} />

          {/* Pick Button */}
          <PickButton onPress={handlePick} loading={loading} />

          {/* Compare placeholder */}
          <ThemedText
            style={[styles.compareText, { color: theme.textSecondary }]}
          >
            Compare manually → coming soon
          </ThemedText>
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
    justifyContent: "space-between",
    paddingBottom: Spacing.five,
  },
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  heroEmoji: {
    fontSize: 52,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 50,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
    marginTop: Spacing.two,
  },
  bottomSection: {
    gap: Spacing.three,
    alignItems: "center",
    paddingHorizontal: Spacing.four,
  },
  errorContainer: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    width: "100%",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  compareText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: Spacing.one,
  },
});
