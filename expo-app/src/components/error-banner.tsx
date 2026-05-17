import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
  duration?: number;
}

export function ErrorBanner({
  error,
  onDismiss,
  duration = 3000,
}: ErrorBannerProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      if (onDismiss && duration > 0) {
        const timer = setTimeout(() => {
          onDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [error, onDismiss, duration]);

  if (!error) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15).stiffness(200)}
      exiting={FadeOutUp.duration(200)}
      layout={Layout.springify().damping(15).stiffness(200)}
      style={[
        styles.container,
        {
          top: insets.top + Spacing.two,
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name="warning"
          size={16}
          color="#EF4444"
          style={styles.icon}
        />
        <ThemedText
          style={[styles.errorText, { color: theme.text }]}
          numberOfLines={2}
        >
          {error}
        </ThemedText>
        {onDismiss && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onDismiss();
            }}
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={10}
          >
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.four,
    right: Spacing.four,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 100,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: Spacing.two,
  },
  icon: {
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  dismissButton: {
    flexShrink: 0,
    padding: 2,
  },
});
