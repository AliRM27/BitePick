/**
 * Web fallback for category-picker-sheet.tsx — @expo/ui has no native
 * toolkit binding on web, so this keeps the JS-drawn Modal version.
 * Props must stay in sync with the native file.
 */

import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";

import { sheetStyles } from "@/components/sheet-styles";
import { ThemedText } from "@/components/themed-text";
import { CONTEXT_OPTION_MAP } from "@/constants/categories";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import type { FoodContext } from "@/types/restaurant";

export interface CategoryPickerSheetProps {
  visible: boolean;
  available: FoodContext[];
  onAdd: (ctx: FoodContext) => void;
  onClose: () => void;
}

export function CategoryPickerSheet({
  visible,
  available,
  onAdd,
  onClose,
}: CategoryPickerSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={sheetStyles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
      />
      <View style={sheetStyles.sheetWrap}>
        <View
          style={[
            sheetStyles.sheet,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={sheetStyles.grabber} />

          <View style={sheetStyles.sheetHeader}>
            <View>
              <ThemedText
                style={[sheetStyles.sheetTitle, { color: theme.text }]}
              >
                {i18n.t("home.category_add_title")}
              </ThemedText>
              <ThemedText
                style={[
                  sheetStyles.sheetSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                {i18n.t("home.category_add_subtitle")}
              </ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[
                sheetStyles.closeButton,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.list}>
            {available.map((category) => {
              const option = CONTEXT_OPTION_MAP[category];
              if (!option) return null;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onAdd(option.key);
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <option.Icon
                      size={20}
                      color={theme.textSecondary}
                      strokeWidth={2}
                    />
                  </View>
                  <ThemedText style={[styles.rowLabel, { color: theme.text }]}>
                    {option.label()}
                  </ThemedText>
                  <Plus size={20} color={theme.accent} strokeWidth={2.4} />
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
            {i18n.t("home.category_remove_hint")}
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 56,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
