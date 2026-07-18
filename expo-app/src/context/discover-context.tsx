import React, { createContext, useContext, useMemo, useState } from "react";

import type { FoodContext } from "@/types/restaurant";

export interface DiscoverSearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  context: FoodContext;
}

interface DiscoverContextValue {
  searchParams: DiscoverSearchParams | null;
  setSearchParams: (params: DiscoverSearchParams | null) => void;
  /** placeId of the restaurant currently "front and center" on Discover. */
  activeRestaurantId: string | null;
  setActiveRestaurantId: (placeId: string | null) => void;
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null);

/**
 * Cross-tab state shared between Discover and Map. Deliberately does NOT
 * hold the restaurant list itself — both tabs fetch via the same
 * useRestaurantSearch(searchParams) query key, so TanStack Query's cache
 * is the single source of truth for result data.
 */
export function DiscoverProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useState<DiscoverSearchParams | null>(
    null,
  );
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(
    null,
  );

  const value = useMemo(
    () => ({
      searchParams,
      setSearchParams,
      activeRestaurantId,
      setActiveRestaurantId,
    }),
    [searchParams, activeRestaurantId],
  );

  return (
    <DiscoverContext.Provider value={value}>
      {children}
    </DiscoverContext.Provider>
  );
}

export function useDiscoverContext() {
  const ctx = useContext(DiscoverContext);
  if (!ctx) {
    throw new Error("useDiscoverContext must be used within a DiscoverProvider");
  }
  return ctx;
}
