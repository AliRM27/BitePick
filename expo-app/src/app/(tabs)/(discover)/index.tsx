import { Stack, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Coffee, Utensils } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import { ErrorBanner } from "@/components/error-banner";
import { LocationPermissionView } from "@/components/location-permission-view";
import { PickButton } from "@/components/pick-button";
import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useDiscoverContext } from "@/context/discover-context";
import i18n from "@/i18n";
import { useLocation } from "@/hooks/use-location";
import { usePreferences } from "@/hooks/use-preferences";
import { useRestaurantSearch } from "@/hooks/use-restaurant-search";
import { useSavedRestaurantsContext } from "@/context/saved-restaurants-context";
import { useTheme } from "@/hooks/use-theme";
import {
  trackEndOfResultsReached,
  trackLocationPermissionState,
  trackPickStarted,
  trackResultsGenerated,
  trackSwipe,
} from "@/services/analytics";
import { applyPreferenceRanking } from "@/utils/rank-restaurants";
import type { FoodContext } from "@/types/restaurant";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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
/*  Progress Dots + Swipe Hint (ported from the old result.tsx)        */
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

function SwipeHint({ visible }: { visible: boolean }) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(800)}
      style={hintStyles.container}
    >
      <ThemedText style={[hintStyles.text, { color: theme.textSecondary }]}>
        {i18n.t("result.swipe_hint")}
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
/*  Discover Screen                                                    */
/*                                                                      */
/*  Merges the old Home + Result screens into one tab: the picker      */
/*  controls and, once fetched, the swipeable recommendation deck      */
/*  live in the same screen — no navigation push for the primary flow. */
/* ------------------------------------------------------------------ */

export default function DiscoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallDevice = screenWidth <= 375;
  const { getLocation, permissionStatus } = useLocation();
  const { preferences } = usePreferences();
  const { isSaved, getFeedback, toggleSaved, setFeedback } =
    useSavedRestaurantsContext();
  const {
    searchParams,
    setSearchParams,
    activeRestaurantId,
    setActiveRestaurantId,
  } = useDiscoverContext();

  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<FoodContext>("coffee");
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [entryOffset, setEntryOffset] = useState(0);
  const [locating, setLocating] = useState(false);

  const subtitle = useRotatingText(SUGGESTIONS);
  const endOfResultsTracked = useRef(false);
  const lastPublishedRef = useRef<string | null>(null);
  const pickStartRef = useRef(0);

  const query = useRestaurantSearch(searchParams);

  const restaurants = useMemo(
    () =>
      applyPreferenceRanking(query.data?.data.restaurants ?? [], preferences),
    [query.data, preferences],
  );

  const hasResults = searchParams !== null && restaurants.length > 0;
  const loading = locating || query.isFetching;

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

  useEffect(() => {
    if (permissionStatus !== null) {
      trackLocationPermissionState(permissionStatus);
    }
  }, [permissionStatus]);

  // A new dataset arrived — reset swipe position and the swipe hint.
  useEffect(() => {
    setCurrentIndex(0);
    setShowHint(true);
    endOfResultsTracked.current = false;
  }, [query.data]);

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    const list = query.data.data.restaurants ?? [];
    trackResultsGenerated(
      list.length,
      list[0]?.score,
      Date.now() - pickStartRef.current,
    );
    if (list.length === 0) {
      setError(i18n.t("home.error_no_options"));
    }
  }, [query.data, query.isSuccess]);

  useEffect(() => {
    if (!query.isError) return;
    const message =
      query.error instanceof Error
        ? query.error.message
        : i18n.t("home.error_generic");
    setError(message);
  }, [query.isError, query.error]);

  // Publish the front card to DiscoverContext so Map can read it.
  useEffect(() => {
    const current = restaurants[currentIndex]?.placeId ?? null;
    if (current && current !== lastPublishedRef.current) {
      lastPublishedRef.current = current;
      setActiveRestaurantId(current);
    }
  }, [restaurants, currentIndex, setActiveRestaurantId]);

  // React to an externally-set active restaurant (e.g. Map's "Replace
  // recommendation"). The ref guard above prevents this from ping-ponging
  // back into the publish effect.
  useEffect(() => {
    if (
      !activeRestaurantId ||
      activeRestaurantId === lastPublishedRef.current
    ) {
      return;
    }
    const idx = restaurants.findIndex((r) => r.placeId === activeRestaurantId);
    if (idx !== -1 && idx !== currentIndex) {
      lastPublishedRef.current = activeRestaurantId;
      setCurrentIndex(idx);
    }
  }, [activeRestaurantId, restaurants, currentIndex]);

  const currentRestaurant = restaurants[currentIndex] ?? null;
  const hasMore = currentIndex < restaurants.length - 1;
  const hasPrevious = currentIndex > 0;
  const swipeThreshold = screenWidth * 0.15;
  const cardEntryOffset = screenWidth * 0.4;

  useEffect(() => {
    if (hasResults && !hasMore && !endOfResultsTracked.current) {
      trackEndOfResultsReached();
      endOfResultsTracked.current = true;
    }
  }, [hasResults, hasMore]);

  const cardLayout = useMemo(() => {
    const veryCompact = screenHeight < 660;
    const compact = veryCompact || screenHeight < 740 || screenWidth < 360;
    const cardHeight = veryCompact
      ? clamp(screenHeight - 155, 412, 430)
      : compact
        ? clamp(screenHeight - 190, 440, 500)
        : clamp(screenHeight - 260, 500, 560);
    const photoHeight = Math.round(
      clamp(
        cardHeight * (veryCompact ? 0.28 : compact ? 0.31 : 0.34),
        veryCompact ? 104 : 128,
        veryCompact ? 112 : compact ? 150 : 180,
      ),
    );

    return {
      cardHeight,
      compact,
      horizontalPadding: screenWidth < 380 ? Spacing.three : Spacing.four,
      photoHeight,
      veryCompact,
    };
  }, [screenHeight, screenWidth]);

  const translateX = useSharedValue(0);

  const goNext = useCallback(() => {
    Haptics.selectionAsync();
    setShowHint(false);
    setEntryOffset(cardEntryOffset);
    setCurrentIndex((prev) => Math.min(prev + 1, restaurants.length - 1));
  }, [cardEntryOffset, restaurants.length]);

  const goPrevious = useCallback(() => {
    Haptics.selectionAsync();
    setShowHint(false);
    setEntryOffset(-cardEntryOffset);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [cardEntryOffset]);

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

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      const atLeftEdge = !hasPrevious && event.translationX > 0;
      const atRightEdge = !hasMore && event.translationX < 0;

      if (atLeftEdge || atRightEdge) {
        translateX.value = event.translationX * 0.2;
      } else {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const swipedLeft = event.translationX < -swipeThreshold;
      const swipedRight = event.translationX > swipeThreshold;

      if (swipedLeft && hasMore) {
        runOnJS(trackSwipe)("left", currentIndex);
        translateX.value = withTiming(-screenWidth, { duration: 300 }, () => {
          runOnJS(goNext)();
        });
      } else if (swipedRight && hasPrevious) {
        runOnJS(trackSwipe)("right", currentIndex);
        translateX.value = withTiming(screenWidth, { duration: 300 }, () => {
          runOnJS(goPrevious)();
        });
      } else {
        if (
          (event.translationX > 20 && !hasPrevious) ||
          (event.translationX < -20 && !hasMore)
        ) {
          runOnJS(edgeBounce)();
        }
        translateX.value = withTiming(0, { duration: 300 });
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, screenWidth * 0.6],
      [1, 0.4],
    ),
  }));

  const handlePick = useCallback(async () => {
    setError(null);
    setLocating(true);
    trackPickStarted(context, radiusMeters);
    pickStartRef.current = Date.now();

    const coords = await getLocation();
    setLocating(false);

    if (!coords) {
      setError(i18n.t("home.error_location_denied"));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSearchParams({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusMeters,
      context,
    });
  }, [getLocation, radiusMeters, context, setSearchParams]);

  const handleNewSearch = useCallback(() => {
    Haptics.selectionAsync();
    setSearchParams(null);
    setError(null);
  }, [setSearchParams]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Native header toolbar button — only renders because this screen is
          a direct child of the Stack in (tabs)/(discover)/_layout.tsx.
          Stack.Toolbar is iOS/Android only (no web implementation), so web
          gets a plain in-content icon below instead — otherwise Settings
          would be unreachable from Discover on web. iOS uses Apple's own
          "gearshape" SF Symbol (same glyph as the system Settings app);
          SF Symbols don't exist on Android, so it keeps the image icon. */}
      {Platform.OS !== "web" && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            onPress={() => router.push("/settings")}
            icon={
              Platform.OS === "ios"
                ? "gearshape"
                : require("@/assets/images/gear-icon.png")
            }
            tintColor={"black"}
          />
        </Stack.Toolbar>
      )}

      <SafeAreaView style={styles.safeArea}>
        {(hasResults || Platform.OS === "web") && (
          <View style={styles.topBar}>
            {hasResults ? (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleNewSearch}
                hitSlop={12}
              >
                <Ionicons name="close" size={26} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.topBarSpacer} />
            )}

            {Platform.OS === "web" && (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => router.push("/settings")}
                hitSlop={12}
              >
                <Ionicons
                  name="settings-outline"
                  size={26}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {hasResults && currentRestaurant ? (
          <View
            style={[
              styles.resultsArea,
              { paddingHorizontal: cardLayout.horizontalPadding },
              cardLayout.compact && styles.resultsAreaCompact,
            ]}
          >
            <Animated.View
              entering={FadeIn.duration(400)}
              style={[
                styles.header,
                cardLayout.compact && styles.headerCompact,
              ]}
            >
              <ProgressDots total={restaurants.length} current={currentIndex} />
              <ThemedText
                style={[styles.counterText, { color: theme.textSecondary }]}
              >
                {currentIndex + 1} {i18n.t("result.of")} {restaurants.length}
              </ThemedText>
            </Animated.View>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.cardContainer, cardAnimStyle]}>
                <RestaurantCard
                  key={currentRestaurant.placeId}
                  compact={cardLayout.compact}
                  height={cardLayout.cardHeight}
                  photoHeight={cardLayout.photoHeight}
                  restaurant={currentRestaurant}
                  veryCompact={cardLayout.veryCompact}
                  index={currentIndex}
                  category={context}
                  isSaved={isSaved(currentRestaurant.placeId)}
                  onToggleSave={() => toggleSaved(currentRestaurant, context)}
                  feedback={getFeedback(currentRestaurant.placeId)}
                  onFeedback={(value) =>
                    setFeedback(currentRestaurant, context, value)
                  }
                />
              </Animated.View>
            </GestureDetector>

            <View style={styles.bottomArea}>
              {hasMore ? (
                <SwipeHint visible={showHint} />
              ) : (
                <Animated.View
                  entering={FadeIn.duration(400)}
                  style={styles.noMoreLabelContainer}
                >
                  <ThemedText
                    style={[styles.noMoreLabel, { color: theme.textSecondary }]}
                  >
                    {i18n.t("result.seen_all")}
                  </ThemedText>
                </Animated.View>
              )}
            </View>
          </View>
        ) : (
          <>
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
              style={[
                styles.interactionZone,
                isSmallDevice && { gap: Spacing.three },
              ]}
            >
              {permissionStatus === "denied" ? (
                <LocationPermissionView />
              ) : (
                <>
                  <ErrorBanner error={error} onDismiss={() => setError(null)} />

                  <ContextSelector selected={context} onSelect={setContext} />

                  <RadiusSelector
                    selected={radiusMeters}
                    onSelect={setRadiusMeters}
                  />

                  <PickButton onPress={handlePick} loading={loading} />
                </>
              )}
            </Animated.View>
          </>
        )}
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    minHeight: 44,
  },
  topBarSpacer: {
    width: 26,
  },

  /* ── Picker mode ── */
  identityZone: {
    flex: 3.4,
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
  interactionZone: {
    flex: 6.2,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.five,
  },

  /* ── Results mode (ported from the old result.tsx) ── */
  resultsArea: {
    flex: 1,
    paddingBottom: Spacing.three,
  },
  resultsAreaCompact: {
    paddingBottom: Spacing.two,
  },
  header: {
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerCompact: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  counterText: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: 0,
    width: "100%",
  },
  bottomArea: {
    paddingTop: Spacing.two,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  noMoreLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
  },
  noMoreLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
