import { env } from "../config/env";
import type { FoodContextType } from "../validators/restaurantValidator";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PlaceResult {
  placeId: string;
  name: string;
  rating: number;
  userRatingCount: number;
  lat: number;
  lng: number;
  photoReference: string | null;
  types: string[];
  formattedAddress: string;
  priceLevel?: string;
  openNow?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Context → Place Types Mapping                                      */
/* ------------------------------------------------------------------ */

const CONTEXT_TYPE_MAP: Record<FoodContextType, string[]> = {
  food: ["restaurant"],
  coffee: ["cafe", "bakery", "coffee_shop"],
  dessert: [
    "dessert_shop",
    "dessert_restaurant",
    "ice_cream_shop",
    "cake_shop",
    "donut_shop",
  ],
  drinks: [
    "bar",
    "pub",
    "wine_bar",
    "cocktail_bar",
    "brewpub",
    "beer_garden",
  ],
  brunch: ["brunch_restaurant", "breakfast_restaurant", "cafe", "bakery"],
  bakery: ["bakery", "bagel_shop", "pastry_shop", "donut_shop"],
};

/* ------------------------------------------------------------------ */
/*  Strict Context Filtering (second layer)                            */
/* ------------------------------------------------------------------ */

/**
 * Google Places `includedTypes` can return loosely matching results.
 * This second-layer filter ensures only truly relevant places pass through.
 */
const STRICT_CONTEXT_FILTERS: Record<FoodContextType, string[]> = {
  coffee: ["cafe", "coffee_shop", "bakery"],
  food: ["restaurant"],
  dessert: [
    "dessert_shop",
    "dessert_restaurant",
    "ice_cream_shop",
    "cake_shop",
    "candy_store",
    "chocolate_shop",
    "confectionery",
    "donut_shop",
  ],
  drinks: [
    "bar",
    "pub",
    "wine_bar",
    "cocktail_bar",
    "brewery",
    "brewpub",
    "beer_garden",
  ],
  brunch: ["brunch_restaurant", "breakfast_restaurant", "cafe", "bakery"],
  bakery: ["bakery", "bagel_shop", "pastry_shop", "donut_shop"],
};

/** Places that should never appear regardless of context */
const EXCLUDED_TYPES = [
  "gas_station",
  "convenience_store",
  "grocery_store",
  "supermarket",
];

/**
 * Check if a place's types match the user's selected context
 * and ensure it's not an excluded type (gas station, supermarket, etc.).
 */
function matchesContext(types: string[], context: FoodContextType): boolean {
  const allowed = STRICT_CONTEXT_FILTERS[context];

  const hasAllowed = types.some((t) => allowed.includes(t));
  const hasExcluded = types.some((t) => EXCLUDED_TYPES.includes(t));

  return hasAllowed && !hasExcluded;
}

/* ------------------------------------------------------------------ */
/*  Google Places API (New) — Nearby Search                            */
/* ------------------------------------------------------------------ */

const PLACES_BASE = "https://places.googleapis.com/v1/places:searchNearby";

/**
 * Fetches nearby places from the Google Places API (New).
 * Uses the `searchNearby` endpoint with field masks for efficiency.
 *
 * @param context - The food context to search for.
 */
export async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusMeters: number = 3000,
  context: FoodContextType = "food",
): Promise<PlaceResult[]> {
  const includedTypes = CONTEXT_TYPE_MAP[context];

  const body = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.rating",
    "places.userRatingCount",
    "places.location",
    "places.photos",
    "places.types",
    "places.formattedAddress",
    "places.priceLevel",
    "places.currentOpeningHours",
  ].join(",");

  const res = await fetch(PLACES_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Places API error:", res.status, errorBody);
    throw new Error(`Google Places API request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text: string };
      rating?: number;
      userRatingCount?: number;
      location?: { latitude: number; longitude: number };
      photos?: Array<{ name: string }>;
      types?: string[];
      formattedAddress?: string;
      priceLevel?: string;
      currentOpeningHours?: { openNow?: boolean };
    }>;
  };

  if (!data.places || data.places.length === 0) {
    return [];
  }

  // Filter: open now + matches context strictly + no excluded types
  return data.places
    .filter(
      (p) =>
        p.currentOpeningHours?.openNow !== false &&
        matchesContext(p.types ?? [], context),
    )
    .map((p) => ({
      placeId: p.id,
      name: p.displayName?.text ?? "Unknown",
      rating: p.rating ?? 0,
      userRatingCount: p.userRatingCount ?? 0,
      lat: p.location?.latitude ?? 0,
      lng: p.location?.longitude ?? 0,
      photoReference: p.photos?.[0]?.name ?? null,
      types: p.types ?? [],
      formattedAddress: p.formattedAddress ?? "",
      priceLevel: p.priceLevel,
      openNow: p.currentOpeningHours?.openNow,
    }));
}

/**
 * Build a Google Places photo URL from a photo resource name.
 * Returns null if no photo reference is available.
 */
export function getPhotoUrl(
  photoReference: string | null,
  maxWidthPx: number = 400,
): string | null {
  if (!photoReference) return null;
  return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidthPx}&key=${env.GOOGLE_PLACES_API_KEY}`;
}
