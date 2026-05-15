import React from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { MapPinOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";

export function LocationPermissionView() {
  const theme = useTheme();

  const handleOpenSettings = () => {
    Haptics.selectionAsync();
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconContainer, { backgroundColor: theme.backgroundElement }]}
      >
        <MapPinOff size={32} color={theme.textSecondary} />
      </View>

      <ThemedText style={[styles.title, { color: theme.text }]}>
        {i18n.t("home.permission_title")}
      </ThemedText>

      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        {i18n.t("home.permission_subtitle")}
      </ThemedText>

      <Pressable
        onPress={handleOpenSettings}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.accent },
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <ThemedText style={styles.buttonText}>
          {i18n.t("home.permission_button")}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.two,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
