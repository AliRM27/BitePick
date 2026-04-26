import { env } from "../config/env";

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
}

/* ------------------------------------------------------------------ */
/*  Google Places API (New) — Nearby Search                            */
/* ------------------------------------------------------------------ */

const PLACES_BASE = "https://places.googleapis.com/v1/places:searchNearby";

/**
 * Fetches nearby restaurants & cafes from the Google Places API (New).
 * Uses the `searchNearby` endpoint with field masks for efficiency.
 */
export async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusMeters: number = 3000
): Promise<PlaceResult[]> {
  const body = {
    includedTypes: ["restaurant", "cafe"],
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

  // Filter to only open-now places and map to our internal type
  return data.places
    .filter((p) => p.currentOpeningHours?.openNow !== false)
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
    }));
}

/**
 * Build a Google Places photo URL from a photo resource name.
 * Returns null if no photo reference is available.
 */
export function getPhotoUrl(
  photoReference: string | null,
  maxWidthPx: number = 400
): string | null {
  if (!photoReference) return null;
  return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidthPx}&key=${env.GOOGLE_PLACES_API_KEY}`;
}
