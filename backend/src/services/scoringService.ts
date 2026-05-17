import { PlaceResult, getPhotoUrl } from "./placesService";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PickReason =
  | "top_pick" // Best overall score
  | "best_rated" // Highest confidence-weighted rating
  | "closest" // Nearest high-quality option
  | "popular" // Most reviews + good rating
  | "hidden_gem"; // High rating, fewer reviews but still solid

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
  openNow?: boolean;
  reason: PickReason;
  explanation: string;
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
  lng2: number,
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
const PRIOR_RATING = 4.0; // baseline assumption

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
  maxDistanceKm: number,
): PickReason {
  if (rank === 0) return "top_pick";

  const isVeryClose = distanceKm < maxDistanceKm * 0.3;
  const isPopular = restaurant.userRatingCount >= 200;
  const isHighlyRated = restaurant.rating >= 4.5;
  const isHiddenGem =
    restaurant.rating >= 4.3 && restaurant.userRatingCount < 100;

  if (isHighlyRated && isVeryClose) return "best_rated";
  if (isPopular) return "popular";
  if (isVeryClose) return "closest";
  if (isHiddenGem) return "hidden_gem";

  if (restaurant.rating >= 4.5) return "best_rated";
  if (distanceKm < 1) return "closest";
  return "popular";
}

/* ------------------------------------------------------------------ */
/*  Dynamic Explanation Generator                                      */
/* ------------------------------------------------------------------ */

/**
 * Generate a data-driven explanation string.
 *
 * Examples:
 *   "Best rated within 3 min"
 *   "Popular spot · 1.2k reviews"
 *   "Highly rated and close by"
 *   "Great reviews, just 500m away"
 */
function generateExplanation(
  rating: number,
  reviewCount: number,
  distanceKm: number,
  durationMinutes: number,
  reason: PickReason,
): string {
  const isVeryClose = durationMinutes <= 5;
  const isHighRating = rating >= 4.5;
  const isPopular = reviewCount >= 200;
  const isVeryPopular = reviewCount >= 500;

  // Format helpers
  const durationStr = durationMinutes <= 1 ? "1 min" : `${durationMinutes} min`;
  const distStr =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)}m away`
      : `${distanceKm.toFixed(1)}km away`;
  const reviewStr =
    reviewCount >= 1000
      ? `${(reviewCount / 1000).toFixed(1)}k reviews`
      : `${reviewCount} reviews`;

  // Priority-based explanation
  if (reason === "top_pick") {
    if (isHighRating && isVeryClose) return `Best rated within ${durationStr}`;
    if (isHighRating) return `Highest rated nearby · ${rating}★`;
    if (isVeryClose) return `Top pick · just ${distStr}`;
    return `Best overall match near you`;
  }

  if (reason === "best_rated") {
    if (isVeryClose) return `${rating}★ rating · only ${distStr}`;
    return `Highly rated · ${rating}★ with ${reviewStr}`;
  }

  if (reason === "popular") {
    if (isVeryPopular && isVeryClose)
      return `Popular spot · ${reviewStr} · ${distStr}`;
    if (isVeryPopular) return `Loved by many · ${reviewStr}`;
    return `Popular choice · ${reviewStr}`;
  }

  if (reason === "closest") {
    if (isHighRating) return `Great reviews · just ${distStr}`;
    return `${rating}★ rated · only ${durationStr} away`;
  }

  if (reason === "hidden_gem") {
    return `Under the radar · ${rating}★ with ${reviewStr}`;
  }

  return `${rating}★ · ${distStr}`;
}

/* ------------------------------------------------------------------ */
/*  Scoring & Ranking                                                  */
/* ------------------------------------------------------------------ */

const MIN_RATING = 4.0;
const MIN_REVIEWS = 20;
const RATING_WEIGHT = 0.45;
const DISTANCE_WEIGHT = 0.4;
const POPULARITY_WEIGHT = 0.15;

/**
 * Score and rank restaurants based on confidence-weighted rating,
 * proximity, and popularity.
 *
 * Score formula:
 *   score = weightedRating/5 * RATING_WEIGHT
 *         + exp(-distance/1.5) * DISTANCE_WEIGHT
 *         + popularityFactor * POPULARITY_WEIGHT
 *         + proximityBonus - farPenalty
 *
 * - Filters out restaurants below MIN_RATING (4.0) and MIN_REVIEWS (20)
 * - Uses exponential distance decay to strongly favor nearby places
 * - Returns top `limit` results, sorted by score descending
 */
export function scoreAndRank(
  restaurants: PlaceResult[],
  userLat: number,
  userLng: number,
  maxDistanceKm: number = 5,
  limit: number = 10,
): ScoredRestaurant[] {
  // Filter by minimum rating and review count to remove low-trust places
  const qualified = restaurants.filter(
    (r) => r.rating >= MIN_RATING && r.userRatingCount >= MIN_REVIEWS,
  );

  // Calculate distance, score, and reason for each restaurant
  const scored = qualified
    .map((r) => {
      const distanceKm = haversineDistance(userLat, userLng, r.lat, r.lng);

      // Exponential distance decay — strongly favors nearby places
      const distanceFactor = Math.exp(-distanceKm / 1.5);

      // Proximity bonus for very close places
      const proximityBonus = distanceKm < 0.5 ? 0.2 : distanceKm < 1 ? 0.1 : 0;

      // Far distance penalty
      const farPenalty = distanceKm > 3 ? 0.15 : 0;

      // Confidence-weighted rating (Bayesian)
      const adjustedRating = confidenceWeightedRating(
        r.rating,
        r.userRatingCount,
      );
      const ratingFactor = adjustedRating / 5.0;

      // Popularity factor: logarithmic scale so diminishing returns
      const popularityFactor = Math.min(
        1,
        Math.log10(r.userRatingCount + 1) / Math.log10(1001),
      );

      const score =
        ratingFactor * RATING_WEIGHT +
        distanceFactor * DISTANCE_WEIGHT +
        popularityFactor * POPULARITY_WEIGHT +
        proximityBonus -
        farPenalty;

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
        openNow: r.openNow,
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

  // Assign reasons and dynamic explanations after sorting
  const results: ScoredRestaurant[] = scored.slice(0, limit).map((r, index) => {
    const { _raw, _distanceKm, ...rest } = r;
    const reason = classifyReason(_raw, _distanceKm, index, maxDistanceKm);
    const explanation = generateExplanation(
      r.rating,
      r.userRatingCount,
      r.distanceKm,
      r.durationMinutes,
      reason,
    );
    return {
      ...rest,
      reason,
      explanation,
    };
  });

  return results;
}
