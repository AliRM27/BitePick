/**
 * Settings Screen — lightweight, calm, intentional.
 *
 * Features a collapsing header: the large "Settings" title fades out
 * as you scroll, and a compact title fades into the header bar.
 *
 * Sections:
 *   1. Preferences  → Maps provider
 *   2. About        → Privacy, Feedback, Version
 *   + Footer
 */

import { Stack, useRouter } from "expo-router";
import Constants from "expo-constants";
import React from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { SettingsRow } from "@/components/settings-row";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useSettings, type MapsPreference } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Scroll distance over which the title transition completes */
const COLLAPSE_THRESHOLD = 45;

const MAPS_OPTIONS: { key: MapsPreference; label: string; icon: string }[] = [
  { key: "apple", label: "Apple Maps", icon: "🗺️" },
  { key: "google", label: "Google Maps", icon: "📍" },
  { key: "ask", label: "Ask Every Time", icon: "🤔" },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mapsPreference, setMapsPreference } = useSettings();

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    "1.0.0";

  /* ── Scroll tracking ── */

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  /* ── Animated styles ── */

  // Large inline title: fades out + slides up
  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [1, 0],
      "clamp",
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, COLLAPSE_THRESHOLD],
          [0, -8],
          "clamp",
        ),
      },
    ],
  }));

  // Small header title: fades in
  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [COLLAPSE_THRESHOLD * 0.6, COLLAPSE_THRESHOLD],
      [0, 1],
      "clamp",
    ),
  }));

  // Subtle header border: appears when scrolled
  const headerBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [COLLAPSE_THRESHOLD * 0.5, COLLAPSE_THRESHOLD],
      [0, 1],
      "clamp",
    ),
  }));

  /* ── Handlers ── */

  const handleGoBack = () => {
    router.back();
  };

  const handleMapsSelect = (key: MapsPreference) => {
    Haptics.selectionAsync();
    setMapsPreference(key);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert("Privacy Policy", "Coming soon.", [{ text: "OK" }]);
  };

  const handleSendFeedback = () => {
    Linking.openURL("mailto:feedback@bitepick.app?subject=BitePick Feedback");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* <SafeAreaView style={styles.safeArea}> */}
      {/* ── Fixed header overlay ── */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Animated.View style={headerTitleStyle}>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                Settings
              </ThemedText>
            </Animated.View>
          ),
        }}
      />

      {/* Header bottom border */}
      <Animated.View
        style={[
          styles.headerBorder,
          { backgroundColor: theme.border },
          headerBorderStyle,
        ]}
      />

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ── Large title (collapses on scroll) ── */}
        <Animated.View style={largeTitleStyle}>
          <ThemedText style={[styles.screenTitle, { color: theme.text }]}>
            Settings
          </ThemedText>
        </Animated.View>

        {/* ── Section 1: Preferences ── */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            PREFERENCES
          </ThemedText>

          <View style={styles.group}>
            {MAPS_OPTIONS.map((opt, i) => (
              <SettingsRow
                key={opt.key}
                label={opt.label}
                icon={opt.icon}
                isSelected={mapsPreference === opt.key}
                onPress={() => handleMapsSelect(opt.key)}
                isFirst={i === 0}
                isLast={i === MAPS_OPTIONS.length - 1}
              />
            ))}
          </View>

          <ThemedText
            style={[styles.sectionFooter, { color: theme.textSecondary }]}
          >
            Choose your preferred maps app for navigation.
          </ThemedText>
        </View>

        {/* ── Section 2: About ── */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            ABOUT
          </ThemedText>

          <View style={styles.group}>
            <SettingsRow
              label="Privacy Policy"
              icon="🔒"
              showChevron
              onPress={handlePrivacyPolicy}
              isFirst
            />
            <SettingsRow
              label="Send Feedback"
              icon="💬"
              showChevron
              onPress={handleSendFeedback}
            />
            <SettingsRow
              label="App Version"
              icon="✨"
              value={appVersion}
              isLast
            />
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <ThemedText
            style={[styles.footerText, { color: theme.textSecondary }]}
          >
            Made for indecisive food lovers 🍜
          </ThemedText>
        </View>
      </Animated.ScrollView>
      {/* </SafeAreaView> */}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },

  /* Header */
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  headerBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
    zIndex: 10,
  },

  /* Large title */
  screenTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },

  /* Sections */
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  sectionFooter: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.one,
    lineHeight: 18,
  },
  group: {
    overflow: "hidden",
  },

  /* Footer */
  footer: {
    alignItems: "center",
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
