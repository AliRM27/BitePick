import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";

interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [error]);

  if (!error) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15).stiffness(200)}
      exiting={FadeOutUp.duration(200)}
      layout={Layout.springify().damping(15).stiffness(200)}
      style={styles.container}
    >
      <View style={styles.content}>
        <Ionicons name="warning" size={20} color="#EF4444" style={styles.icon} />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
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
            <Ionicons name="close" size={20} color="#EF4444" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  icon: {
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  dismissButton: {
    flexShrink: 0,
    padding: 2,
  },
});
