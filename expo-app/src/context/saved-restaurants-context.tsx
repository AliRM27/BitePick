import React, { createContext, useContext } from "react";

import { useSavedRestaurants as useSavedRestaurantsState } from "@/hooks/use-saved-restaurants";

type SavedRestaurantsContextValue = ReturnType<typeof useSavedRestaurantsState>;

const SavedRestaurantsContext =
  createContext<SavedRestaurantsContextValue | null>(null);

/**
 * Wraps the single shared useSavedRestaurants() instance. Discover, Map,
 * Saved, and the result-detail screen all read/write saved state — with
 * each calling the hook independently, saving on one screen would only
 * update that screen's own local copy, since useState instances never
 * share state across separate call sites. Same bug shape (and fix) as
 * OnboardingContext.
 */
export function SavedRestaurantsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useSavedRestaurantsState();
  return (
    <SavedRestaurantsContext.Provider value={value}>
      {children}
    </SavedRestaurantsContext.Provider>
  );
}

export function useSavedRestaurantsContext() {
  const ctx = useContext(SavedRestaurantsContext);
  if (!ctx) {
    throw new Error(
      "useSavedRestaurantsContext must be used within a SavedRestaurantsProvider",
    );
  }
  return ctx;
}
