/**
 * First-launch onboarding gate.
 *
 * Mirrors use-settings.ts's persistence pattern. `hasCompletedOnboarding`
 * is null while the AsyncStorage read is in flight — the root layout
 * treats null as "don't route anywhere yet" so neither the onboarding
 * stack nor the tabs stack mounts prematurely.
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@cupmap/onboarding_completed";

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        setHasCompletedOnboarding(value === "true");
      })
      .finally(() => setLoaded(true));
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    AsyncStorage.setItem(STORAGE_KEY, "true");
  }, []);

  return { hasCompletedOnboarding, completeOnboarding, loaded } as const;
}
