/**
 * Settings Screen — lightweight, calm, intentional.
 *
 * Sections:
 *   1. Preferences  → Maps provider
 *   2. About        → Privacy, Feedback, Version
 *   + Footer
 */

import { Stack, useRouter } from "expo-router";
import Constants from "expo-constants";
import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { SettingsRow } from "@/components/settings-row";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useSettings, type MapsPreference } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";

/* ------------------------------------------------------------------ */
/*  Maps options                                                       */
/* ------------------------------------------------------------------ */

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
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={handleGoBack} icon="chevron.left" />
      </Stack.Toolbar>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* ── Screen title ── */}
        <ThemedText style={[styles.screenTitle, { color: theme.text }]}>
          Settings
        </ThemedText>

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
      </ScrollView>
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

  /* Title */
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
