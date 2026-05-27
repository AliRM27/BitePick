/**
 * Persistent settings hook.
 *
 * Stores user preferences in AsyncStorage and exposes
 * a simple read/write API.
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type MapsPreference = "apple" | "google" | "ask";

const STORAGE_KEY = "@cupmap/maps_preference";
const DEFAULT_PREFERENCE: MapsPreference = "ask";

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useSettings() {
  const [mapsPreference, _setMapsPreference] =
    useState<MapsPreference>(DEFAULT_PREFERENCE);
  const [loaded, setLoaded] = useState(false);

  // Load persisted value on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === "apple" || value === "google" || value === "ask") {
          _setMapsPreference(value);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Write + update state
  const setMapsPreference = useCallback((next: MapsPreference) => {
    _setMapsPreference(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { mapsPreference, setMapsPreference, loaded } as const;
}
