import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';

const queryClient = new QueryClient();

/**
 * BitePick root layout — simple stack navigator.
 * Home → Result flow, no tabs.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Customize the navigation themes to match BitePick branding
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={isDark ? BitePickDark : BitePickLight}>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="result"
            options={{
              animation: 'slide_from_bottom',
              gestureEnabled: true,
            }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
