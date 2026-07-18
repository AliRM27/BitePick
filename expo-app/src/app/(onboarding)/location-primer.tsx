import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { OnboardingButton } from "@/components/onboarding-button";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useOnboardingContext } from "@/context/onboarding-context";
import { useLocation } from "@/hooks/use-location";
import { usePreferences } from "@/hooks/use-preferences";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import {
  trackOnboardingCompleted,
  trackOnboardingSkippedLocation,
  trackOnboardingStepViewed,
} from "@/services/analytics";

export default function LocationPrimerScreen() {
  const theme = useTheme();
  const { getLocation } = useLocation();
  const { completeOnboarding } = useOnboardingContext();
  const { preferences } = usePreferences();
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    trackOnboardingStepViewed("location_primer", 3);
  }, []);

  // No explicit navigation here — completeOnboarding() flips the root
  // layout's Stack.Protected guard, which unmounts (onboarding) and mounts
  // (tabs) on its own. An explicit router.replace("/") fought this on web:
  // it changed the in-memory route but left the browser URL bar stuck on
  // "/location-primer", which only self-corrected on a later reload.
  const finish = (locationGranted: boolean) => {
    trackOnboardingCompleted(preferences, locationGranted);
    completeOnboarding();
  };

  const handleEnable = async () => {
    setRequesting(true);
    const coords = await getLocation();
    setRequesting(false);
    finish(!!coords);
  };

  const handleSkip = () => {
    trackOnboardingSkippedLocation();
    finish(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <OnboardingProgress total={4} current={3} />
        </View>

        <View style={styles.content}>
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.iconWrap}
          >
            <View
              style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}
            >
              <Ionicons name="location" size={40} color={theme.accent} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {i18n.t("onboarding.location_title")}
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              {i18n.t("onboarding.location_subtitle")}
            </ThemedText>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <OnboardingButton
            label={i18n.t("onboarding.location_cta_enable")}
            onPress={handleEnable}
            loading={requesting}
          />
          <OnboardingButton
            label={i18n.t("onboarding.location_cta_skip")}
            onPress={handleSkip}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  header: { paddingTop: Spacing.two, paddingBottom: Spacing.three },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
  iconWrap: { marginBottom: Spacing.two },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: Spacing.two,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: Spacing.two,
  },
  footer: { gap: Spacing.two, paddingBottom: Spacing.four, paddingTop: Spacing.two },
});
