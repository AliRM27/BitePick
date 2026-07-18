import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ChipSelector, type ChipOption } from "@/components/chip-selector";
import { OnboardingButton } from "@/components/onboarding-button";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { usePreferences } from "@/hooks/use-preferences";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { trackOnboardingStepViewed } from "@/services/analytics";

const PRICE_OPTIONS: ChipOption[] = [
  { id: "PRICE_LEVEL_INEXPENSIVE", label: "$" },
  { id: "PRICE_LEVEL_MODERATE", label: "$$" },
  { id: "PRICE_LEVEL_EXPENSIVE", label: "$$$" },
  { id: "PRICE_LEVEL_VERY_EXPENSIVE", label: "$$$$" },
];

export default function PriceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const [priceLevels, setPriceLevels] = useState<string[]>(
    preferences.priceLevels,
  );

  useEffect(() => {
    trackOnboardingStepViewed("price", 2);
  }, []);

  const togglePrice = (id: string) => {
    setPriceLevels((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleContinue = () => {
    updatePreferences({ priceLevels });
    router.push("/location-primer");
  };

  const handleSkip = () => {
    router.push("/location-primer");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <OnboardingProgress total={4} current={2} />
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {i18n.t("onboarding.price_title")}
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              {i18n.t("onboarding.price_subtitle")}
            </ThemedText>
          </Animated.View>

          <ChipSelector
            options={PRICE_OPTIONS}
            selected={priceLevels}
            onToggle={togglePrice}
          />
        </View>

        <View style={styles.footer}>
          <OnboardingButton
            label={i18n.t("onboarding.continue")}
            onPress={handleContinue}
          />
          <OnboardingButton
            label={i18n.t("onboarding.skip")}
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
  content: { flex: 1, gap: Spacing.four, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: Spacing.one,
    lineHeight: 20,
  },
  footer: { gap: Spacing.two, paddingBottom: Spacing.four, paddingTop: Spacing.two },
});
