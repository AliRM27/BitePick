import { useQuery } from "@tanstack/react-query";

import type { DiscoverSearchParams } from "@/context/discover-context";
import { pickRestaurant } from "@/services/restaurant";

/**
 * Shared query key — Discover and Map both call useRestaurantSearch with
 * the same DiscoverContext.searchParams, so TanStack Query's cache dedups
 * automatically: Map reads the identical cached array with zero extra
 * network calls once Discover has fetched it (and vice versa).
 */
export function restaurantSearchKey(params: DiscoverSearchParams | null) {
  if (!params) return ["pick", null] as const;
  return [
    "pick",
    params.latitude.toFixed(4),
    params.longitude.toFixed(4),
    params.radiusMeters,
    params.context,
  ] as const;
}

export function useRestaurantSearch(params: DiscoverSearchParams | null) {
  return useQuery({
    queryKey: restaurantSearchKey(params),
    queryFn: () => {
      if (!params) {
        return Promise.reject(new Error("useRestaurantSearch: no search params"));
      }
      return pickRestaurant(
        params.latitude,
        params.longitude,
        params.radiusMeters,
        params.context,
      );
    },
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
  });
}
