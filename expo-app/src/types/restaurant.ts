export type PickReason =
  | "top_pick"
  | "best_rated"
  | "closest"
  | "popular"
  | "hidden_gem";

export interface Restaurant {
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


export interface PickResponse {
  success: boolean;
  message: string;
  data: {
    restaurants: Restaurant[];
    meta?: {
      totalFetched: number;
      totalQualified: number;
      radiusMeters: number;
    };
  };
}
