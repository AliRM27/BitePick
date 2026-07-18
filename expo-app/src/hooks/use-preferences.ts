/**
 * Light taste preferences, collected during onboarding.
 *
 * Same persistence pattern as use-settings.ts. `priceLevels` actively
 * biases Discover's client-side ranking (see utils/rank-restaurants.ts);
 * `cuisines`/`dietary` are captured for now but don't affect ranking yet —
 * the backend doesn't return place-category data fine-grained enough to
 * filter against (see the plan's "optional follow-up" note).
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TastePreferences {
  cuisines: string[];
  dietary: string[];
  priceLevels: string[];
}

const STORAGE_KEY = "@cupmap/preferences";

const DEFAULT_PREFERENCES: TastePreferences = {
  cuisines: [],
  dietary: [],
  priceLevels: [],
};

export function usePreferences() {
  const [preferences, _setPreferences] =
    useState<TastePreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        try {
          const parsed = JSON.parse(value);
          _setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch {
          // Malformed storage — fall back to defaults silently.
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const updatePreferences = useCallback((patch: Partial<TastePreferences>) => {
    _setPreferences((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { preferences, updatePreferences, loaded } as const;
}
