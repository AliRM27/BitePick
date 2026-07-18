import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";
import type { TastePreferences } from "@/hooks/use-preferences";
import type { Restaurant } from "@/types/restaurant";

// Disable automatic collection in dev mode to avoid any background event tracking
try {
  const analyticsInstance = getAnalytics();
  setAnalyticsCollectionEnabled(analyticsInstance, !__DEV__).catch((err) => {
    console.warn("[Analytics] Failed to set analytics collection enabled:", err);
  });
} catch (err) {
  console.warn("[Analytics] Failed to initialize analytics instance:", err);
}

/**
 * Centralized logging function that handles errors and console logs in dev mode.
 */
const logEvent = async (eventName: string, params?: Record<string, any>) => {
  if (__DEV__) {
    console.log(
      `[Analytics Dev Mode] 📊 ${eventName}`,
      params ? JSON.stringify(params, null, 2) : '',
    );
    return;
  }
  console.log("TEST")
  try {
    const analyticsInstance = getAnalytics();
    await firebaseLogEvent(analyticsInstance, eventName, params || {});
  } catch (err) {
    console.warn("[Analytics Error]", err);
  }
};

/**
 * Track when the app is launched.
 */
export const trackAppOpen = () => {
  logEvent("app_open");
};

/**
 * Track when the user starts a search (presses "Pick for me").
 */
export const trackPickStarted = (category: string, radiusMeters: number) => {
  logEvent("pick_started", {
    category,
    radius_km: radiusMeters / 1000,
  });
};

/**
 * Track the backend result generation.
 * Helps monitor recommendation quality and API performance.
 */
export const trackResultsGenerated = (
  count: number,
  topScore: number | undefined,
  durationMs: number,
) => {
  logEvent("results_generated", {
    count,
    top_score: topScore ?? 0,
    duration_ms: durationMs,
  });
};

/**
 * Track user swipe behavior through recommendations.
 * Helps understand how many picks users browse before deciding.
 */
export const trackSwipe = (
  direction: "left" | "right",
  currentIndex: number,
) => {
  logEvent("swipe_restaurant", {
    direction,
    current_index: currentIndex,
  });
};

/**
 * The most important event: user tapped to navigate to a restaurant.
 * Represents trust in the recommendation.
 */
export const trackTakeMeThere = (
  restaurant: Pick<Restaurant, "name" | "placeId" | "rating" | "distanceKm">,
  index: number,
  category: string,
) => {
  logEvent("take_me_there_pressed", {
    restaurant_name: restaurant.name,
    place_id: restaurant.placeId,
    rating: restaurant.rating,
    distance_km: Number(restaurant.distanceKm.toFixed(2)),
    index,
    category,
  });
};

/**
 * Track when the user has swiped through all available recommendations.
 */
export const trackEndOfResultsReached = () => {
  logEvent("end_of_results_reached");
};

/**
 * Track location permission state on app start/changes.
 * Important for onboarding flow analysis.
 */
export const trackLocationPermissionState = (
  status: "granted" | "denied" | "undetermined" | string,
) => {
  logEvent("location_permission_state", {
    status,
  });
};

/**
 * Track each onboarding screen as the user reaches it.
 */
export const trackOnboardingStepViewed = (step: string, stepIndex: number) => {
  logEvent("onboarding_step_viewed", {
    step,
    step_index: stepIndex,
  });
};

/**
 * Track onboarding completion — the preferences collected and whether
 * location permission was granted during the flow.
 */
export const trackOnboardingCompleted = (
  preferences: TastePreferences,
  locationGranted: boolean,
) => {
  logEvent("onboarding_completed", {
    cuisines: preferences.cuisines.join(","),
    dietary: preferences.dietary.join(","),
    price_levels: preferences.priceLevels.join(","),
    location_granted: locationGranted,
  });
};

/**
 * Track when the user skips the location-permission primer.
 */
export const trackOnboardingSkippedLocation = () => {
  logEvent("onboarding_skipped_location");
};

/**
 * Track when a restaurant is promoted to Discover's active pick from
 * somewhere other than swiping — e.g. the Map tab or a detail view.
 */
export const trackReplaceRecommendation = (
  restaurant: Pick<Restaurant, "name" | "placeId" | "rating" | "distanceKm">,
  source: "map" | "map_web_list" | "result_detail",
) => {
  logEvent("replace_recommendation", {
    restaurant_name: restaurant.name,
    place_id: restaurant.placeId,
    rating: restaurant.rating,
    distance_km: Number(restaurant.distanceKm.toFixed(2)),
    source,
  });
};

/**
 * Track a restaurant being bookmarked to the Saved tab.
 */
export const trackSaveRestaurant = (
  restaurant: Pick<Restaurant, "name" | "placeId" | "rating" | "distanceKm">,
  context: string,
) => {
  logEvent("save_restaurant", {
    restaurant_name: restaurant.name,
    place_id: restaurant.placeId,
    rating: restaurant.rating,
    distance_km: Number(restaurant.distanceKm.toFixed(2)),
    context,
  });
};

/**
 * Track a restaurant being removed from the Saved tab.
 */
export const trackUnsaveRestaurant = (placeId: string) => {
  logEvent("unsave_restaurant", { place_id: placeId });
};

/**
 * Track a like/dislike signal — captured now as a future ranking input.
 */
export const trackFeedback = (
  placeId: string,
  feedback: "liked" | "disliked",
) => {
  logEvent("restaurant_feedback", { place_id: placeId, feedback });
};

/**
 * Track a saved restaurant moving between "want to try" and "visited".
 */
export const trackSavedStatusChanged = (
  placeId: string,
  status: "want_to_try" | "visited",
) => {
  logEvent("saved_status_changed", { place_id: placeId, status });
};

/**
 * Track a map pin tap opening the quick-preview sheet.
 */
export const trackMapPinTapped = (
  restaurant: Pick<Restaurant, "name" | "placeId" | "rating" | "distanceKm">,
  index: number,
) => {
  logEvent("map_pin_tapped", {
    restaurant_name: restaurant.name,
    place_id: restaurant.placeId,
    rating: restaurant.rating,
    distance_km: Number(restaurant.distanceKm.toFixed(2)),
    index,
  });
};

/**
 * Track the web list fallback being shown in place of the native map —
 * a useful signal for whether investing in a real web map is worth it.
 */
export const trackMapWebFallbackShown = () => {
  logEvent("map_web_fallback_shown");
};
