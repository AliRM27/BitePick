import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { UtensilsCrossed } from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";

interface PickButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Large, animated CTA button with pulsing glow effect.
 * The primary interaction point of the app.
 */
export function PickButton({
  onPress,
  loading = false,
  disabled = false,
}: PickButtonProps) {
  const theme = useTheme();

  // Press scale animation
  const pressScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <View style={styles.wrapper}>
      {/* Main button */}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          { backgroundColor: theme.accent },
          (disabled || loading) && styles.disabled,
          buttonStyle,
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FFF" />
            <ThemedText style={[styles.buttonText, { color: "#FFFFFF" }]}>
              {i18n.t("components.finding_spot")}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <ThemedText style={[styles.buttonText, { color: "#FFFFFF" }]}>
              {i18n.t("components.pick_button")}
            </ThemedText>
            {/* <UtensilsCrossed size={30} color="#FFFFFF" /> */}
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: Spacing.four,
  },
  glow: {
    position: "absolute",
    width: "100%",
    height: 72,
    borderRadius: BorderRadius.xl,
  },
  button: {
    width: "100%",
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingIcon: {
    fontSize: 22,
  },
});
