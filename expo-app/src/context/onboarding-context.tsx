import React, { createContext, useContext } from "react";

import { useOnboarding as useOnboardingState } from "@/hooks/use-onboarding";

type OnboardingContextValue = ReturnType<typeof useOnboardingState>;

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/**
 * Wraps the single shared useOnboarding() instance. Both the root layout
 * (which gates Stack.Protected on hasCompletedOnboarding) and the
 * location-primer screen (which calls completeOnboarding()) must read/write
 * the SAME state — two independent hook calls would each hold their own
 * copy, so completing onboarding in one place would never be seen by the
 * other without a full reload.
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const value = useOnboardingState();
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error(
      "useOnboardingContext must be used within an OnboardingProvider",
    );
  }
  return ctx;
}
