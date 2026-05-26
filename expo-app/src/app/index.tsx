import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { Coffee, Utensils, UtensilsCrossed } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import { ErrorBanner } from "@/components/error-banner";
import { LocationPermissionView } from "@/components/location-permission-view";
import { PickButton } from "@/components/pick-button";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import i18n from "@/i18n";
import { useLocation } from "@/hooks/use-location";
import { useTheme } from "@/hooks/use-theme";
import { pickRestaurant } from "@/services/restaurant";
import {
  trackLocationPermissionState,
  trackPickStarted,
  trackResultsGenerated,
} from "@/services/analytics";
import type { FoodContext } from "@/types/restaurant";

/* ------------------------------------------------------------------ */
/*  Context options                                                    */
/* ------------------------------------------------------------------ */

const CONTEXT_OPTIONS: {
  key: FoodContext;
  Icon: React.ElementType;
  label: () => string;
}[] = [
    { key: "coffee", Icon: Coffee, label: () => i18n.t("home.context_coffee") },
    { key: "food", Icon: Utensils, label: () => i18n.t("home.context_food") },
  ];

const RADIUS_OPTIONS = [
  { meters: 500, label: "0.5 km" },
  { meters: 1000, label: "1 km" },
  { meters: 3000, label: "3 km" },
  { meters: 5000, label: "5 km" },
] as const;

/* ------------------------------------------------------------------ */
/*  Rotating subtitle suggestions                                      */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  () => i18n.t("home.tagline_0"),
  () => i18n.t("home.tagline_1"),
  () => i18n.t("home.tagline_2"),
  () => i18n.t("home.tagline_3"),
  () => i18n.t("home.tagline_4"),
];

function useRotatingText(items: (() => string)[], intervalMs = 3000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, intervalMs]);

  return items[index]();
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
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 375;

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
            <ThemedText
              style={[
                ctxStyles.label,
                { color: isActive ? "#FFFFFF" : theme.textSecondary },
                isSmallDevice && { fontSize: 13 },
              ]}
            >
              {opt.label()}
            </ThemedText>
            <opt.Icon
              size={isSmallDevice ? 16 : 18}
              color={isActive ? "#FFFFFF" : theme.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const ctxStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});

/* ------------------------------------------------------------------ */
/*  Radius Selector                                                    */
/* ------------------------------------------------------------------ */

function RadiusSelector({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (radius: number) => void;
}) {
  const theme = useTheme();
  const selectedLabel =
    RADIUS_OPTIONS.find((option) => option.meters === selected)?.label ??
    `${selected / 1000} km`;
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 375;

  return (
    <View style={radiusStyles.container}>
      <View style={radiusStyles.header}>
        <ThemedText
          style={[radiusStyles.title, { color: theme.textSecondary }]}
        >
          {i18n.t("home.radius_label")}
        </ThemedText>
        <ThemedText style={[radiusStyles.value, { color: theme.text }]}>
          {selectedLabel}
        </ThemedText>
      </View>

      <View
        style={[
          radiusStyles.segmentedControl,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        {RADIUS_OPTIONS.map((option) => {
          const isActive = selected === option.meters;

          return (
            <Pressable
              key={option.meters}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(option.meters);
              }}
              style={[
                radiusStyles.option,
                isActive && { backgroundColor: theme.accent },
              ]}
            >
              <ThemedText
                style={[
                  radiusStyles.optionLabel,
                  { color: isActive ? "#FFFFFF" : theme.textSecondary },
                  isSmallDevice && { fontSize: 12 },
                ]}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const radiusStyles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.one,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    fontWeight: "700",
  },
  segmentedControl: {
    width: "100%",
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
});

/* ------------------------------------------------------------------ */
/*  Home Screen                                                        */
/* ------------------------------------------------------------------ */

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 375;
  const { getLocation, permissionStatus } = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<FoodContext>("coffee");
  const [radiusMeters, setRadiusMeters] = useState(1000);
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

  // Track permission state changes
  useEffect(() => {
    if (permissionStatus !== null) {
      trackLocationPermissionState(permissionStatus);
    }
  }, [permissionStatus]);

  const handlePick = useCallback(async () => {
    setLoading(true);
    setError(null);
    trackPickStarted(context, radiusMeters);

    const startTime = Date.now();

    try {
      // 1. Get location
      const coords = await getLocation();
      if (!coords) {
        setError(i18n.t("home.error_location_denied"));
        setLoading(false);
        return;
      }

      lastLocationRef.current = coords;

      // 2. Call backend with context
      const result = await pickRestaurant(
        coords.latitude,
        coords.longitude,
        radiusMeters,
        context,
      );

      if (!result.data.restaurants || result.data.restaurants.length === 0) {
        trackResultsGenerated(0, undefined, Date.now() - startTime);
        setError(i18n.t("home.error_no_options"));
        setLoading(false);
        return;
      }

      const count = result.data.restaurants.length;
      const topScore = result.data.restaurants[0]?.score;
      trackResultsGenerated(count, topScore, Date.now() - startTime);

      // 3. Navigate to result screen with data
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/result",
        params: {
          restaurants: JSON.stringify(result.data.restaurants),
          userLat: coords.latitude.toString(),
          userLng: coords.longitude.toString(),
          category: context,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : i18n.t("home.error_generic");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getLocation, router, radiusMeters, context]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {Platform.OS === "ios" ? (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon="gearshape"
              onPress={() => router.push("/settings")}
            />
          </Stack.Toolbar>
        ) : (
          <Stack.Screen
            options={{
              headerRight: () => (
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => router.push("/settings")}
                >
                  <Ionicons
                    name="settings-outline"
                    size={26}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              ),
            }}
          />
        )}

        {/* ── Top: Identity Zone ── */}
        <View style={styles.identityZone}>
          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <ThemedText
              style={[
                styles.title,
                { color: theme.text },
                isSmallDevice && { fontSize: 34, lineHeight: 40 },
              ]}
            >
              {i18n.t("home.title")}
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(600)}>
            <ThemedText
              style={[
                styles.subtitle,
                { color: theme.textSecondary },
                isSmallDevice && { fontSize: 15 },
              ]}
              key={subtitle}
            >
              {subtitle}
            </ThemedText>
          </Animated.View>
        </View>

        {/* ── Bottom: Interaction Zone ── */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(800)}
          style={[styles.interactionZone, isSmallDevice && { gap: Spacing.three }]}
        >
          {permissionStatus === "denied" ? (
            <LocationPermissionView />
          ) : (
            <>
              {/* Error message */}
              <ErrorBanner error={error} onDismiss={() => setError(null)} />

              {/* Context Selector */}
              <ContextSelector selected={context} onSelect={setContext} />

              {/* Radius Selector */}
              <RadiusSelector
                selected={radiusMeters}
                onSelect={setRadiusMeters}
              />

              {/* Pick Button */}
              <PickButton onPress={handlePick} loading={loading} />

              {/* Compare placeholder */}
              {/* <ThemedText
                style={[
                  styles.compareText,
                  { color: theme.textSecondary },
                  isSmallDevice && { fontSize: 12 },
                ]}
              >
                {i18n.t("home.compare_coming_soon")}
              </ThemedText> */}
            </>
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
  },

  /* ── Top zone: ~38% of screen, title sits at its bottom edge ── */
  identityZone: {
    flex: 3.8,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.four,
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
    marginTop: Spacing.one,
  },

  /* ── Bottom zone: ~62% of screen, controls anchor downward ── */
  interactionZone: {
    flex: 6.2,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.five,
  },

  compareText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: Spacing.one,
  },
});
