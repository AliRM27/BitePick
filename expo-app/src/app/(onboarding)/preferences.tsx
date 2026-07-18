import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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

export default function PreferencesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const [cuisines, setCuisines] = useState<string[]>(preferences.cuisines);
  const [dietary, setDietary] = useState<string[]>(preferences.dietary);

  useEffect(() => {
    trackOnboardingStepViewed("preferences", 1);
  }, []);

  const cuisineOptions: ChipOption[] = [
    { id: "italian", emoji: "🍝", label: i18n.t("onboarding.cuisine_italian") },
    { id: "asian", emoji: "🍜", label: i18n.t("onboarding.cuisine_asian") },
    { id: "mexican", emoji: "🌮", label: i18n.t("onboarding.cuisine_mexican") },
    { id: "american", emoji: "🍔", label: i18n.t("onboarding.cuisine_american") },
    {
      id: "mediterranean",
      emoji: "🥙",
      label: i18n.t("onboarding.cuisine_mediterranean"),
    },
    { id: "cafe", emoji: "☕", label: i18n.t("onboarding.cuisine_cafe") },
    { id: "indian", emoji: "🍛", label: i18n.t("onboarding.cuisine_indian") },
    {
      id: "middle_eastern",
      emoji: "🧆",
      label: i18n.t("onboarding.cuisine_middle_eastern"),
    },
  ];

  const dietaryOptions: ChipOption[] = [
    {
      id: "vegetarian",
      emoji: "🥦",
      label: i18n.t("onboarding.dietary_vegetarian"),
    },
    { id: "vegan", emoji: "🌱", label: i18n.t("onboarding.dietary_vegan") },
    {
      id: "gluten_free",
      emoji: "🌾",
      label: i18n.t("onboarding.dietary_gluten_free"),
    },
    { id: "halal", emoji: "🕌", label: i18n.t("onboarding.dietary_halal") },
    { id: "none", emoji: "🍽️", label: i18n.t("onboarding.dietary_none") },
  ];

  const toggleCuisine = (id: string) => {
    setCuisines((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleDietary = (id: string) => {
    setDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleContinue = () => {
    updatePreferences({ cuisines, dietary });
    router.push("/price");
  };

  const handleSkip = () => {
    router.push("/price");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <OnboardingProgress total={4} current={1} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {i18n.t("onboarding.preferences_title")}
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              {i18n.t("onboarding.preferences_subtitle")}
            </ThemedText>
          </Animated.View>

          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: theme.textSecondary }]}
            >
              {i18n.t("onboarding.cuisine_section_title")}
            </ThemedText>
            <ChipSelector
              options={cuisineOptions}
              selected={cuisines}
              onToggle={toggleCuisine}
            />
          </View>

          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: theme.textSecondary }]}
            >
              {i18n.t("onboarding.dietary_section_title")}
            </ThemedText>
            <ChipSelector
              options={dietaryOptions}
              selected={dietary}
              onToggle={toggleDietary}
            />
          </View>
        </ScrollView>

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
  scrollContent: { gap: Spacing.four, paddingBottom: Spacing.four },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: Spacing.one,
    lineHeight: 20,
  },
  section: { gap: Spacing.two, marginTop: Spacing.two },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footer: { gap: Spacing.two, paddingBottom: Spacing.four, paddingTop: Spacing.two },
});
