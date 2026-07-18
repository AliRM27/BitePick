import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { AnimatedIcon } from "@/components/animated-icon";
import { OnboardingButton } from "@/components/onboarding-button";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import { trackOnboardingStepViewed } from "@/services/analytics";

const BULLETS = [
  { emoji: "⚡", key: "welcome_bullet_instant" },
  { emoji: "🎯", key: "welcome_bullet_no_scrolling" },
  { emoji: "🔒", key: "welcome_bullet_private" },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    trackOnboardingStepViewed("welcome", 0);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <AnimatedIcon />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(250)}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {i18n.t("onboarding.welcome_title")}
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(350)}>
            <ThemedText
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              {i18n.t("onboarding.welcome_subtitle")}
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(450)}
          style={styles.bullets}
        >
          {BULLETS.map((b) => (
            <View key={b.key} style={styles.bulletRow}>
              <ThemedText style={styles.bulletEmoji}>{b.emoji}</ThemedText>
              <ThemedText style={[styles.bulletText, { color: theme.text }]}>
                {i18n.t(`onboarding.${b.key}`)}
              </ThemedText>
            </View>
          ))}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(600)}
          style={styles.footer}
        >
          <OnboardingButton
            label={i18n.t("onboarding.welcome_cta")}
            onPress={() => router.push("/preferences")}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
  bullets: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  bulletEmoji: {
    fontSize: 22,
  },
  bulletText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  footer: {
    paddingBottom: Spacing.four,
  },
});
