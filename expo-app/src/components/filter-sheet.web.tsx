/**
 * Web fallback for filter-sheet.tsx — @expo/ui has no native toolkit
 * binding on web, so this keeps the JS-drawn Modal version (including the
 * segmented radius control it owns). Props must stay in sync with the
 * native file.
 */

import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { sheetStyles } from "@/components/sheet-styles";
import { ThemedText } from "@/components/themed-text";
import {
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  categoryLabel,
  formatPriceLabel,
  type PriceFilter,
} from "@/constants/categories";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import type { FoodContext } from "@/types/restaurant";

export interface FilterSheetProps {
  visible: boolean;
  context: FoodContext;
  radiusMeters: number;
  priceFilter: PriceFilter;
  onClose: () => void;
  onRadiusChange: (radius: number) => void;
  onPriceChange: (price: PriceFilter) => void;
}

function RadiusSelector({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (radius: number) => void;
}) {
  const theme = useTheme();
  const selectedLabel =
    RADIUS_OPTIONS.find((option) => option.meters === selected)?.label ??
    `${selected / 1000} km`;
  const { width } = useWindowDimensions();
  const isSmallDevice = width <= 375;

  return (
    <View style={radiusStyles.container}>
      <View style={radiusStyles.header}>
        <ThemedText style={[radiusStyles.title, { color: theme.textSecondary }]}>
          {i18n.t("home.radius_label")}
        </ThemedText>
        <ThemedText style={[radiusStyles.value, { color: theme.text }]}>
          {selectedLabel}
        </ThemedText>
      </View>

      <View
        style={[
          radiusStyles.segmentedControl,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        {RADIUS_OPTIONS.map((option) => {
          const isActive = selected === option.meters;

          return (
            <Pressable
              key={option.meters}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(option.meters);
              }}
              style={[
                radiusStyles.option,
                isActive && { backgroundColor: theme.accent },
              ]}
            >
              <ThemedText
                style={[
                  radiusStyles.optionLabel,
                  { color: isActive ? "#FFFFFF" : theme.textSecondary },
                  isSmallDevice && { fontSize: 12 },
                ]}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FilterSheet({
  visible,
  context,
  radiusMeters,
  priceFilter,
  onClose,
  onRadiusChange,
  onPriceChange,
}: FilterSheetProps) {
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
                {i18n.t("home.filters_title")}
              </ThemedText>
              <ThemedText
                style={[
                  sheetStyles.sheetSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                {categoryLabel(context)}
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

          <View style={sheetStyles.section}>
            <RadiusSelector selected={radiusMeters} onSelect={onRadiusChange} />
          </View>

          <View style={sheetStyles.section}>
            <View style={sheetStyles.sectionHeader}>
              <ThemedText
                style={[
                  sheetStyles.sectionTitle,
                  { color: theme.textSecondary },
                ]}
              >
                {i18n.t("home.price_label")}
              </ThemedText>
              <ThemedText
                style={[sheetStyles.sectionValue, { color: theme.text }]}
              >
                {formatPriceLabel(priceFilter)}
              </ThemedText>
            </View>

            <View style={sheetStyles.chipRow}>
              {PRICE_OPTIONS.map((option) => {
                const active = priceFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onPriceChange(option.key);
                    }}
                    style={[
                      sheetStyles.priceChip,
                      {
                        backgroundColor: active
                          ? theme.accent
                          : theme.backgroundElement,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        sheetStyles.priceChipText,
                        { color: active ? "#FFFFFF" : theme.textSecondary },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              sheetStyles.doneButton,
              { backgroundColor: theme.accent },
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
          >
            <ThemedText style={sheetStyles.doneText}>
              {i18n.t("home.filters_done")}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const radiusStyles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.one,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    fontWeight: "700",
  },
  segmentedControl: {
    width: "100%",
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
});
