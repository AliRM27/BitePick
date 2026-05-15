import analytics from "@react-native-firebase/analytics";
import type { Restaurant } from "@/types/restaurant";

/**
 * Centralized logging function that handles errors and console logs in dev mode.
 */
const logEvent = async (eventName: string, params?: Record<string, any>) => {
  // if (__DEV__) {
  //   console.log(
  //     `[Analytics] 📊 ${eventName}`,
  //     params ? JSON.stringify(params, null, 2) : '',
  //   );
  // }

  try {
    if (eventName === "app_open") {
      await analytics().logAppOpen();
    } else {
      await analytics().logEvent(eventName, params);
    }
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
