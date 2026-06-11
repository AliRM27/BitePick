import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { router, Stack } from "expo-router";
import React, { useEffect } from "react";
import { Button, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Colors } from "@/constants/theme";
import { trackAppOpen } from "@/services/analytics";

const queryClient = new QueryClient();

/**
 * CupMap root layout — simple stack navigator.
 * Home → Result flow, no tabs.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={isDark ? BitePickDark : BitePickLight}>
          <AnimatedSplashOverlay />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerTransparent: true,
                headerShadowVisible: false,
                title: "",
              }}
            />
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
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
