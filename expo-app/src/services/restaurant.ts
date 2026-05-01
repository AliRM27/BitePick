import { api } from "./api";
import type { FoodContext, PickResponse } from "@/types/restaurant";

/**
 * Call the backend to pick a restaurant based on user location and context.
 */
export async function pickRestaurant(
  latitude: number,
  longitude: number,
  radius: number = 3000,
  context: FoodContext = "food"
): Promise<PickResponse> {
  return api.post<PickResponse>("/v1/restaurants/pick", {
    latitude,
    longitude,
    radius,
    context,
  });
}
