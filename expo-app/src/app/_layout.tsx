import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Colors } from "@/constants/theme";
import { DiscoverProvider } from "@/context/discover-context";
import { OnboardingProvider, useOnboardingContext } from "@/context/onboarding-context";
import { SavedRestaurantsProvider } from "@/context/saved-restaurants-context";
import { trackAppOpen } from "@/services/analytics";

const queryClient = new QueryClient();

/**
 * CupMap root layout — hosts the (tabs) navigator plus
 * modal-style stack screens (settings, result) layered above it.
 * Gates on onboarding completion via Stack.Protected.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <SavedRestaurantsProvider>
            <DiscoverProvider>
              <RootLayoutContent />
            </DiscoverProvider>
          </SavedRestaurantsProvider>
        </OnboardingProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Split out so it can read useOnboardingContext() — a component can't
 * consume a context it renders the Provider for in the same function body.
 */
function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const { hasCompletedOnboarding, loaded: onboardingLoaded } =
    useOnboardingContext();

  useEffect(() => {
    trackAppOpen();
  }, []);

  // Customize the navigation themes to match CupMap branding
  const BitePickDark = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  const BitePickLight = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <ThemeProvider value={isDark ? BitePickDark : BitePickLight}>
      <AnimatedSplashOverlay ready={onboardingLoaded} />
      {onboardingLoaded && (
        // Mounting the Stack is deferred until the onboarding flag has
        // resolved, so the very first render already has exactly one
        // Stack.Protected branch active — otherwise, with both guards
        // false during the async read, expo-router falls back to the
        // first unconditional screen ("settings") and gets stuck there.
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Protected guard={hasCompletedOnboarding === false}>
            <Stack.Screen
              name="(onboarding)"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
          </Stack.Protected>
          <Stack.Protected guard={hasCompletedOnboarding === true}>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
          </Stack.Protected>
          <Stack.Screen
            name="settings"
            options={{
              headerTransparent: true,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="result"
            options={{
              gestureEnabled: false,
              headerTransparent: true,
              headerShadowVisible: false,
              title: "",
            }}
          />
        </Stack>
      )}
    </ThemeProvider>
  );
}
