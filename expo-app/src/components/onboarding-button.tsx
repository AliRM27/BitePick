import React from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface OnboardingButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export function OnboardingButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
}: OnboardingButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={() => {
        if (loading) return;
        Haptics.selectionAsync();
        onPress();
      }}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: isPrimary ? theme.accent : "transparent" },
        pressed && !loading && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        loading && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : theme.textSecondary} />
      ) : (
        <ThemedText
          style={[
            styles.label,
            { color: isPrimary ? "#FFFFFF" : theme.textSecondary },
          ]}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
