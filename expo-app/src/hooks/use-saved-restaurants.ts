/**
 * Local "Saved" list — bookmark, visited status, and like/dislike feedback.
 * Same AsyncStorage persistence pattern as use-settings.ts, but the value
 * is a placeId-keyed map (not a scalar) for O(1) isSaved/toggle lookups.
 *
 * Analytics are fired from here rather than at each call site, since the
 * same actions (save, feedback) are triggered from Discover, Map, and the
 * Saved list itself.
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  trackFeedback,
  trackSaveRestaurant,
  trackSavedStatusChanged,
  trackUnsaveRestaurant,
} from "@/services/analytics";
import type { FoodContext, Restaurant } from "@/types/restaurant";

export type SavedStatus = "want_to_try" | "visited";
export type Feedback = "liked" | "disliked" | null;

export interface SavedRestaurant {
  restaurant: Restaurant;
  status: SavedStatus;
  feedback: Feedback;
  savedAt: string;
  context: FoodContext;
}

type SavedMap = Record<string, SavedRestaurant>;

const STORAGE_KEY = "@cupmap/saved_restaurants";

/**
 * Drops any entry missing a valid restaurant.placeId — guards against
 * malformed/legacy storage so a corrupted entry can't crash the Saved
 * screen; it's just silently dropped on next load.
 */
function sanitizeSavedMap(value: unknown): SavedMap {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, SavedRestaurant] => {
      const candidate = entry[1] as Partial<SavedRestaurant> | null;
      return !!candidate?.restaurant?.placeId;
    },
  );
  return Object.fromEntries(entries);
}

export function useSavedRestaurants() {
  const [savedMap, _setSavedMap] = useState<SavedMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        try {
          _setSavedMap(sanitizeSavedMap(JSON.parse(value)));
        } catch {
          // Malformed storage — start fresh.
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Persist whenever the map changes. Side effects don't belong inside the
  // functional setState updaters below (React can invoke an updater more
  // than once per commit, e.g. under Strict Mode double-invocation), so
  // AsyncStorage writes are centralized here instead of scattered across
  // each action — that scattering was the actual cause of entries
  // occasionally landing in storage without their `restaurant` field.
  // Skipped until the initial load resolves, so this can't clobber real
  // stored data with the default empty state.
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedMap));
  }, [savedMap, loaded]);

  const isSaved = useCallback(
    (placeId: string) => placeId in savedMap,
    [savedMap],
  );

  const getFeedback = useCallback(
    (placeId: string): Feedback => savedMap[placeId]?.feedback ?? null,
    [savedMap],
  );

  const toggleSaved = useCallback(
    (restaurant: Restaurant, context: FoodContext) => {
      _setSavedMap((prev) => {
        if (restaurant.placeId in prev) {
          const next = { ...prev };
          delete next[restaurant.placeId];
          return next;
        }
        return {
          ...prev,
          [restaurant.placeId]: {
            restaurant,
            status: "want_to_try",
            feedback: null,
            savedAt: new Date().toISOString(),
            context,
          },
        };
      });
      if (restaurant.placeId in savedMap) {
        trackUnsaveRestaurant(restaurant.placeId);
      } else {
        trackSaveRestaurant(restaurant, context);
      }
    },
    [savedMap],
  );

  const unsaveRestaurant = useCallback((placeId: string) => {
    _setSavedMap((prev) => {
      if (!(placeId in prev)) return prev;
      const next = { ...prev };
      delete next[placeId];
      return next;
    });
    trackUnsaveRestaurant(placeId);
  }, []);

  const setStatus = useCallback((placeId: string, status: SavedStatus) => {
    _setSavedMap((prev) => {
      if (!(placeId in prev)) return prev;
      return { ...prev, [placeId]: { ...prev[placeId], status } };
    });
    trackSavedStatusChanged(placeId, status);
  }, []);

  // Thumbs-up/down auto-saves the restaurant if it isn't already saved.
  const setFeedback = useCallback(
    (restaurant: Restaurant, context: FoodContext, feedback: Feedback) => {
      _setSavedMap((prev) => {
        const existing = prev[restaurant.placeId];
        return {
          ...prev,
          [restaurant.placeId]: {
            restaurant,
            status: existing?.status ?? ("want_to_try" as SavedStatus),
            feedback,
            savedAt: existing?.savedAt ?? new Date().toISOString(),
            context,
          },
        };
      });
      if (feedback) {
        trackFeedback(restaurant.placeId, feedback);
      }
    },
    [],
  );

  // Defensive: even though writes are now guaranteed well-formed, this
  // keeps the Saved screen crash-proof against any stale/corrupted entry
  // that predates this fix and hasn't been sanitized out yet.
  const savedList = Object.values(savedMap)
    .filter((entry) => !!entry?.restaurant?.placeId)
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

  return {
    savedList,
    isSaved,
    getFeedback,
    toggleSaved,
    unsaveRestaurant,
    setStatus,
    setFeedback,
    loaded,
  } as const;
}
