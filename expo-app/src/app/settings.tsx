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
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";
import { useHeaderHeight } from "expo-router/react-navigation";
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
import i18n from "@/i18n";
import { SafeAreaView } from "react-native-safe-area-context";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Scroll distance over which the title transition completes */
const COLLAPSE_THRESHOLD = 45;

const MAPS_OPTIONS: { key: MapsPreference; label: () => string; icon: string }[] = [
  { key: "apple", label: () => i18n.t("settings.apple_maps"), icon: "🗺️" },
  { key: "google", label: () => i18n.t("settings.google_maps"), icon: "📍" },
  { key: "ask", label: () => i18n.t("settings.ask_every_time"), icon: "🤔" },
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

  const headerHeight = useHeaderHeight();

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
    Linking.openURL("https://cupmap.netlify.app/privacy");
  };

  const handleTerms = () => {
    Linking.openURL("https://cupmap.netlify.app/terms");
  };

  const handleSendFeedback = () => {
    Linking.openURL(
      "mailto:lotustudio.app@gmail.com?subject=CupMap Feedback",
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* <SafeAreaView style={styles.safeArea}> */}
      {Platform.OS === "ios" && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button icon={"chevron.left"} onPress={handleGoBack} />
        </Stack.Toolbar>
      )}
      {/* ── Fixed header overlay ── */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Animated.View style={headerTitleStyle}>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                {i18n.t("settings.title")}
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
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === "android" && { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ── Large title (collapses on scroll) ── */}
        <Animated.View style={largeTitleStyle}>
          <ThemedText style={[styles.screenTitle, { color: theme.text }]}>
            {i18n.t("settings.title")}
          </ThemedText>
        </Animated.View>

        {/* ── Section 1: Preferences ── */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            {i18n.t("settings.preferences")}
          </ThemedText>

          <View style={styles.group}>
            {MAPS_OPTIONS.map((opt, i) => (
              <SettingsRow
                key={opt.key}
                label={opt.label()}
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
            {i18n.t("settings.maps_footer")}
          </ThemedText>
        </View>

        {/* ── Section 2: About ── */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            {i18n.t("settings.about")}
          </ThemedText>

          <View style={styles.group}>
            <SettingsRow
              label={i18n.t("settings.privacy_policy")}
              icon="🔒"
              showChevron
              onPress={handlePrivacyPolicy}
              isFirst
            />
            <SettingsRow
              label={i18n.t("settings.terms_of_service")}
              icon="⚖️"
              showChevron
              onPress={handleTerms}
            />
            <SettingsRow
              label={i18n.t("settings.send_feedback")}
              icon="💬"
              showChevron
              onPress={handleSendFeedback}
            />
            <SettingsRow
              label={i18n.t("settings.app_version")}
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
            {i18n.t("settings.footer")}
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
