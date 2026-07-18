import type { TastePreferences } from "@/hooks/use-preferences";
import type { Restaurant } from "@/types/restaurant";

const PRICE_MATCH_BOOST = 0.05;

/**
 * Client-side re-sort layered on top of the backend's existing `score` —
 * never mutates the underlying query cache. Boosts restaurants whose
 * priceLevel matches the user's onboarding price preference, then
 * re-sorts by the adjusted score, preserving the backend's rating/distance
 * ordering within and across the boosted set.
 *
 * Cuisine/dietary preferences are intentionally not applied here: the
 * Restaurant type carries no place-category data finer than the food/coffee
 * context the user already picks each session, so there's nothing to
 * filter cuisine against without a backend change (see the plan's
 * "optional follow-up" note).
 */
export function applyPreferenceRanking(
  restaurants: Restaurant[],
  preferences: TastePreferences,
): Restaurant[] {
  if (preferences.priceLevels.length === 0 || restaurants.length === 0) {
    return restaurants;
  }

  return [...restaurants]
    .map((restaurant) => ({
      restaurant,
      adjustedScore:
        restaurant.score +
        (restaurant.priceLevel &&
        preferences.priceLevels.includes(restaurant.priceLevel)
          ? PRICE_MATCH_BOOST
          : 0),
    }))
    .sort((a, b) => b.adjustedScore - a.adjustedScore)
    .map((entry) => entry.restaurant);
}
