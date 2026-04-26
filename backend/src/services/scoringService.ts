import { PlaceResult, getPhotoUrl } from "./placesService";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PickReason =
  | "top_pick"       // Best overall score
  | "best_rated"     // Highest confidence-weighted rating
  | "closest"        // Nearest high-quality option
  | "popular"        // Most reviews + good rating
  | "hidden_gem";    // High rating, fewer reviews but still solid

export interface ScoredRestaurant {
  placeId: string;
  name: string;
  rating: number;
  userRatingCount: number;
  score: number;
  distanceKm: number;
  durationMinutes: number;
  photoUrl: string | null;
  formattedAddress: string;
  lat: number;
  lng: number;
  priceLevel?: string;
  reason: PickReason;
}

/* ------------------------------------------------------------------ */
/*  Haversine Distance                                                 */
/* ------------------------------------------------------------------ */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates in kilometers
 * using the Haversine formula.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Estimate walking/driving time in minutes from distance.
 * Uses ~5 km/h walking speed for distances < 1 km,
 * ~30 km/h city driving for longer distances.
 */
function estimateDuration(distanceKm: number): number {
  if (distanceKm < 1) {
    // Walking: ~5 km/h → 12 min/km
    return Math.max(1, Math.round(distanceKm * 12));
  }
  // City driving: ~30 km/h → 2 min/km
  return Math.round(distanceKm * 2);
}

/* ------------------------------------------------------------------ */
/*  Review-Count Confidence                                            */
/* ------------------------------------------------------------------ */

/**
 * Bayesian-style confidence weighting for ratings.
 *
 * A 4.6 with 1000 reviews should beat a 4.7 with 12 reviews.
 *
 * Formula:  weightedRating = (v / (v + m)) * R + (m / (v + m)) * C
 *   - R = restaurant's raw rating
 *   - v = restaurant's review count
 *   - m = minimum reviews needed for "full confidence" (tunable)
 *   - C = prior / baseline rating (the average "good" restaurant)
 *
 * With m=50 and C=4.0:
 *   4.7 with 12 reviews → ~4.14  (pulled toward 4.0 baseline)
 *   4.6 with 1000 reviews → ~4.59 (almost no pull)
 */
const CONFIDENCE_THRESHOLD = 50; // reviews needed for ~full trust
const PRIOR_RATING = 4.0;        // baseline assumption

function confidenceWeightedRating(rating: number, reviewCount: number): number {
  const v = reviewCount;
  const m = CONFIDENCE_THRESHOLD;
  return (v / (v + m)) * rating + (m / (v + m)) * PRIOR_RATING;
}

/* ------------------------------------------------------------------ */
/*  Reason Classification                                              */
/* ------------------------------------------------------------------ */

/**
 * Assign a human-readable reason for why this restaurant was picked.
 * Called after scoring; the #1 pick always gets "top_pick".
 */
function classifyReason(
  restaurant: PlaceResult,
  distanceKm: number,
  rank: number,
  maxDistanceKm: number
): PickReason {
  if (rank === 0) return "top_pick";

  const isVeryClose = distanceKm < maxDistanceKm * 0.3; // within 30% of max radius
  const isPopular = restaurant.userRatingCount >= 200;
  const isHighlyRated = restaurant.rating >= 4.5;
  const isHiddenGem = restaurant.rating >= 4.3 && restaurant.userRatingCount < 100;

  if (isHighlyRated && isVeryClose) return "best_rated";
  if (isPopular) return "popular";
  if (isVeryClose) return "closest";
  if (isHiddenGem) return "hidden_gem";

  // Fallback based on dominant quality
  if (restaurant.rating >= 4.5) return "best_rated";
  if (distanceKm < 1) return "closest";
  return "popular";
}

/* ------------------------------------------------------------------ */
/*  Scoring & Ranking                                                  */
/* ------------------------------------------------------------------ */

const MIN_RATING = 4.0;
const RATING_WEIGHT = 0.5;
const DISTANCE_WEIGHT = 0.3;
const POPULARITY_WEIGHT = 0.2;

/**
 * Score and rank restaurants based on confidence-weighted rating,
 * proximity, and popularity.
 *
 * Score formula:
 *   score = weightedRating/5 * 0.5
 *         + (1 - distance/maxDistance) * 0.3
 *         + popularityFactor * 0.2
 *
 * popularityFactor = min(1, log10(reviewCount + 1) / log10(1001))
 *   → 1 review ≈ 0, 100 reviews ≈ 0.67, 1000 reviews ≈ 1.0
 *
 * - Filters out restaurants below MIN_RATING (4.0)
 * - Returns top `limit` results, sorted by score descending
 */
export function scoreAndRank(
  restaurants: PlaceResult[],
  userLat: number,
  userLng: number,
  maxDistanceKm: number = 5,
  limit: number = 10
): ScoredRestaurant[] {
  // Filter by minimum rating
  const qualified = restaurants.filter((r) => r.rating >= MIN_RATING);

  // Calculate distance, score, and reason for each restaurant
  const scored = qualified
    .map((r) => {
      const distanceKm = haversineDistance(userLat, userLng, r.lat, r.lng);

      // Clamp distance factor between 0 and 1
      const distanceFactor = Math.max(0, 1 - distanceKm / maxDistanceKm);

      // Confidence-weighted rating (Bayesian)
      const adjustedRating = confidenceWeightedRating(r.rating, r.userRatingCount);
      const ratingFactor = adjustedRating / 5.0;

      // Popularity factor: logarithmic scale so diminishing returns
      const popularityFactor = Math.min(
        1,
        Math.log10(r.userRatingCount + 1) / Math.log10(1001)
      );

      const score =
        ratingFactor * RATING_WEIGHT +
        distanceFactor * DISTANCE_WEIGHT +
        popularityFactor * POPULARITY_WEIGHT;

      return {
        placeId: r.placeId,
        name: r.name,
        rating: r.rating,
        userRatingCount: r.userRatingCount,
        score: Math.round(score * 1000) / 1000,
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMinutes: estimateDuration(distanceKm),
        photoUrl: getPhotoUrl(r.photoReference),
        formattedAddress: r.formattedAddress,
        lat: r.lat,
        lng: r.lng,
        priceLevel: r.priceLevel,
        // Reason is assigned below after sorting
        reason: "top_pick" as PickReason,
        // Keep raw data for reason classification
        _raw: r,
        _distanceKm: distanceKm,
      };
    })
    // Only include restaurants within the max distance
    .filter((r) => r.distanceKm <= maxDistanceKm);

  // Sort by score descending, then by distance ascending as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.distanceKm - b.distanceKm;
  });

  // Assign reasons after sorting (rank matters for "top_pick")
  const results: ScoredRestaurant[] = scored.slice(0, limit).map((r, index) => {
    const { _raw, _distanceKm, ...rest } = r;
    return {
      ...rest,
      reason: classifyReason(_raw, _distanceKm, index, maxDistanceKm),
    };
  });

  return results;
}
