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
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
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
import { Coffee, Plus, Settings2 } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";

import { CategoryPickerSheet } from "@/components/category-picker-sheet";
import { ErrorBanner } from "@/components/error-banner";
import { FilterSheet } from "@/components/filter-sheet";
import { LocationPermissionView } from "@/components/location-permission-view";
import { PickButton } from "@/components/pick-button";
import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import {
  CONTEXT_OPTION_MAP,
  categoryLabel,
  formatPriceLabel,
  formatRadiusLabel,
  type ContextOption,
  type PriceFilter,
} from "@/constants/categories";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useDiscoverContext } from "@/context/discover-context";
import i18n from "@/i18n";
import { useCategories } from "@/hooks/use-categories";
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
/*  Context Selector                                                   */
/* ------------------------------------------------------------------ */

function ContextSelector({
  categories,
  selected,
  onSelect,
  onRemove,
  onAdd,
  canAdd,
  isRemovable,
}: {
  categories: FoodContext[];
  selected: FoodContext;
  onSelect: (ctx: FoodContext) => void;
  onRemove: (ctx: FoodContext) => void;
  onAdd: () => void;
  canAdd: boolean;
  isRemovable: (ctx: FoodContext) => boolean;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 375;
  const iconSize = isSmallDevice ? 19 : 22;

  const confirmRemove = (opt: ContextOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // react-native-web has no Alert implementation, so a confirm dialog
    // there would silently swallow the removal — remove straight away.
    if (Platform.OS === "web") {
      onRemove(opt.key);
      return;
    }

    Alert.alert(
      i18n.t("home.category_remove_title", { category: opt.label() }),
      i18n.t("home.category_remove_message"),
      [
        { text: i18n.t("home.category_remove_cancel"), style: "cancel" },
        {
          text: i18n.t("home.category_remove_confirm"),
          style: "destructive",
          onPress: () => onRemove(opt.key),
        },
      ],
    );
  };

  return (
    <ScrollView
      contentContainerStyle={ctxStyles.container}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {categories.map((category) => {
        const opt = CONTEXT_OPTION_MAP[category];
        if (!opt) return null;
        const isActive = selected === opt.key;
        const removable = isRemovable(opt.key);

        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(opt.key);
            }}
            onLongPress={removable ? () => confirmRemove(opt) : undefined}
            delayLongPress={400}
            style={ctxStyles.item}
          >
            <View
              style={[
                ctxStyles.iconCircle,
                {
                  backgroundColor: isActive
                    ? theme.accent
                    : theme.backgroundElement,
                },
              ]}
            >
              <opt.Icon
                size={iconSize}
                color={isActive ? "#FFFFFF" : theme.textSecondary}
                strokeWidth={2}
              />
            </View>
            <ThemedText
              style={[
                ctxStyles.label,
                {
                  color: isActive ? theme.accent : theme.textSecondary,
                },
                isSmallDevice && { fontSize: 12 },
              ]}
              numberOfLines={1}
            >
              {opt.label()}
            </ThemedText>
          </Pressable>
        );
      })}

      {canAdd && (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onAdd();
          }}
          style={ctxStyles.item}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("home.category_add_title")}
        >
          <View
            style={[
              ctxStyles.iconCircle,
              ctxStyles.addCircle,
              { borderColor: theme.border },
            ]}
          >
            <Plus size={iconSize} color={theme.textSecondary} strokeWidth={2} />
          </View>
          <ThemedText
            style={[
              ctxStyles.label,
              { color: theme.textSecondary },
              isSmallDevice && { fontSize: 12 },
            ]}
            numberOfLines={1}
          >
            {i18n.t("home.category_add_label")}
          </ThemedText>
        </Pressable>
      )}
    </ScrollView>
  );
}

const ctxStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 16,
    paddingRight: Spacing.four,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: 68,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addCircle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});

function FilterSummaryPill({
  context,
  radiusMeters,
  priceFilter,
  onPress,
}: {
  context: FoodContext;
  radiusMeters: number;
  priceFilter: PriceFilter;
  onPress: () => void;
}) {
  const theme = useTheme();
  const contextLabel = categoryLabel(context);
  const priceLabel = formatPriceLabel(priceFilter);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        filterPillStyles.container,
        { backgroundColor: theme.backgroundElement },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={filterPillStyles.left}>
        <Ionicons name="location-outline" size={20} color={theme.text} />
        <ThemedText style={[filterPillStyles.radiusText, { color: theme.text }]}>
          {i18n.t("home.within_radius", { radius: formatRadiusLabel(radiusMeters) })}
        </ThemedText>
      </View>

      <View style={filterPillStyles.right}>
        <ThemedText
          style={[filterPillStyles.metaText, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {contextLabel} · {priceLabel}
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

const filterPillStyles = StyleSheet.create({
  container: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  radiusText: {
    fontSize: 15,
    fontWeight: "800",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
    flex: 1,
    justifyContent: "flex-end",
  },
  metaText: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 0,
    flexShrink: 1,
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

  const {
    activeCategories,
    availableCategories,
    addCategory,
    removeCategory,
    isRemovable,
  } = useCategories();

  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<FoodContext>("coffee");
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("any");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [entryOffset, setEntryOffset] = useState(0);
  const [locating, setLocating] = useState(false);

  const endOfResultsTracked = useRef(false);
  const lastPublishedRef = useRef<string | null>(null);
  const pickStartRef = useRef(0);

  const query = useRestaurantSearch(searchParams);
  const rawRestaurantCount = query.data?.data.restaurants.length ?? 0;

  const restaurants = useMemo(() => {
    const ranked = applyPreferenceRanking(
      query.data?.data.restaurants ?? [],
      preferences,
    );

    if (priceFilter === "any") return ranked;

    return ranked.filter((restaurant) => restaurant.priceLevel === priceFilter);
  }, [query.data, preferences, priceFilter]);

  const hasResults = searchParams !== null && restaurants.length > 0;
  const loading = locating || query.isFetching;
  const hasActiveFilters = radiusMeters !== 1000 || priceFilter !== "any";

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
    if (!query.isSuccess || !searchParams) return;
    if (rawRestaurantCount > 0 && restaurants.length === 0) {
      setError(i18n.t("home.error_no_filtered_options"));
    }
  }, [query.isSuccess, rawRestaurantCount, restaurants.length, searchParams]);

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

  const openFilters = useCallback(() => {
    Haptics.selectionAsync();
    setFiltersVisible(true);
  }, []);

  const handleRadiusChange = useCallback((nextRadius: number) => {
    setError(null);
    setRadiusMeters(nextRadius);
  }, []);

  const handlePriceChange = useCallback((nextPrice: PriceFilter) => {
    setError(null);
    setPriceFilter(nextPrice);
  }, []);

  const openCategoryPicker = useCallback(() => {
    setCategoryPickerVisible(true);
  }, []);

  // Adding selects the new category straight away — the user tapped "+"
  // because they want to pick with it, not just park it on the row.
  const handleAddCategory = useCallback(
    (category: FoodContext) => {
      addCategory(category);
      setContext(category);
      setError(null);
    },
    [addCategory],
  );

  const handleRemoveCategory = useCallback(
    (category: FoodContext) => {
      removeCategory(category);
      setContext((prev) => (prev === category ? "coffee" : prev));
    },
    [removeCategory],
  );

  // Nothing left in the pool — close the picker rather than leave an
  // empty sheet on screen.
  useEffect(() => {
    if (categoryPickerVisible && availableCategories.length === 0) {
      setCategoryPickerVisible(false);
    }
  }, [categoryPickerVisible, availableCategories.length]);

  // Keeps `context` valid if the active list changes underneath it
  // (removal, or a stored list that no longer contains it).
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.includes(context)) {
      setContext(activeCategories[0]);
    }
  }, [activeCategories, context]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Native header toolbar button — only renders because this screen is
          a direct child of the Stack in (tabs)/(discover)/_layout.tsx.
          Stack.Toolbar is iOS/Android only (no web implementation), so web
          gets a plain in-content icon below instead — otherwise Settings
          would be unreachable from Discover on web. iOS uses Apple's own
          "gearshape" SF Symbol (same glyph as the system Settings app);
          SF Symbols don't exist on Android, so it keeps the image icon. */}
      {/* {Platform.OS !== "web" && (
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
      )} */}

      <SafeAreaView style={styles.safeArea}>
        <FilterSheet
          visible={filtersVisible}
          context={context}
          radiusMeters={radiusMeters}
          priceFilter={priceFilter}
          onClose={() => setFiltersVisible(false)}
          onRadiusChange={handleRadiusChange}
          onPriceChange={handlePriceChange}
        />

        <CategoryPickerSheet
          visible={categoryPickerVisible}
          available={availableCategories}
          onAdd={handleAddCategory}
          onClose={() => setCategoryPickerVisible(false)}
        />

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
              <Animated.View
                style={styles.homeHeader}
                entering={FadeInDown.duration(600).delay(400)}
              >
                <View style={styles.brandRow}>
                  <View style={[styles.logoMark, { backgroundColor: theme.accent }]}>
                    <Coffee size={17} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                  <ThemedText style={[styles.brandText, { color: theme.text }]}>
                    CupMap
                  </ThemedText>
                </View>

                <Pressable
                  onPress={openFilters}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.configButton,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <Settings2 size={20} color={theme.text} strokeWidth={2.3} />
                  {hasActiveFilters && (
                    <View
                      style={[
                        styles.configDot,
                        {
                          backgroundColor: theme.accent,
                          borderColor: theme.backgroundElement,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              </Animated.View>

              <Animated.View
                style={styles.homeCopy}
                entering={FadeInDown.duration(600).delay(600)}
              >
                <ThemedText
                  style={[
                    styles.homeTitle,
                    { color: theme.text },
                    isSmallDevice && { fontSize: 26, lineHeight: 32 },
                  ]}
                >
                  Find a great spot
                </ThemedText>
              </Animated.View>

              <Animated.View
                style={styles.homeControls}
                entering={FadeInDown.duration(600).delay(800)}
              >
                <ContextSelector
                  categories={activeCategories}
                  selected={context}
                  onSelect={setContext}
                  onRemove={handleRemoveCategory}
                  onAdd={openCategoryPicker}
                  canAdd={availableCategories.length > 0}
                  isRemovable={isRemovable}
                />

                <FilterSummaryPill
                  context={context}
                  radiusMeters={radiusMeters}
                  priceFilter={priceFilter}
                  onPress={openFilters}
                />
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
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  configButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  configDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  homeCopy: {
    gap: 8,
  },
  homeTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  homeControls: {
    gap: Spacing.four,
  },
  interactionZone: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
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
