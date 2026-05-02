import type { Request, Response } from "express";

import { fetchNearbyRestaurants } from "../services/placesService";
import { scoreAndRank } from "../services/scoringService";
import { pickRequestSchema } from "../validators/restaurantValidator";

/**
 * POST /api/v1/restaurants/pick
 *
 * Accepts user coordinates + optional context,
 * fetches nearby restaurants from Google Places,
 * scores them, and returns the top-ranked options.
 */
export async function pickRestaurant(req: Request, res: Response) {
  // Validate request body
  const parsed = pickRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { latitude, longitude, radius, context } = parsed.data;

  try {
    // 1. Fetch nearby restaurants from Google Places (context-aware)
    const places = await fetchNearbyRestaurants(
      latitude,
      longitude,
      radius,
      context,
    );

    if (places.length === 0) {
      res.status(200).json({
        success: true,
        message: "No restaurants found nearby",
        data: { restaurants: [] },
      });
      return;
    }

    // 2. Score and rank them
    const maxDistanceKm = radius / 1000; // Convert meters to km for scoring
    const ranked = scoreAndRank(places, latitude, longitude, maxDistanceKm);

    if (ranked.length === 0) {
      res.status(200).json({
        success: true,
        message: "No restaurants matched the quality criteria (rating >= 4.0)",
        data: { restaurants: [] },
      });
      return;
    }

    // 3. Return the ranked list
    res.status(200).json({
      success: true,
      message: `Found ${ranked.length} great option${ranked.length > 1 ? "s" : ""}`,
      data: {
        restaurants: ranked,
        meta: {
          totalFetched: places.length,
          totalQualified: ranked.length,
          radiusMeters: radius,
          context,
        },
      },
    });
  } catch (error) {
    console.error("Restaurant pick error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants. Please try again.",
    });
  }
}
