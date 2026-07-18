import { Stack } from "expo-router";
import React from "react";

import { useTheme } from "@/hooks/use-theme";

/**
 * Linear, forward-only onboarding flow — no swipe-back, no header.
 * Screens navigate explicitly via router.push.
 */
export default function OnboardingLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="price" />
      <Stack.Screen name="location-primer" />
    </Stack>
  );
}
