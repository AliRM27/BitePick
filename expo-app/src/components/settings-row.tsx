/**
 * SettingsRow — reusable row component for settings screens.
 *
 * Supports: label, optional value, chevron, checkmark,
 * and rounded corners for first/last items in a group.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SettingsRowProps {
  /** Primary label text */
  label: string;
  /** Optional right-aligned value (e.g. version number) */
  value?: string;
  /** Optional left emoji/icon */
  icon?: string;
  /** Show ›  chevron on right */
  showChevron?: boolean;
  /** Show checkmark (for radio groups) */
  isSelected?: boolean;
  /** Tap handler — omit for non-interactive rows */
  onPress?: () => void;
  /** Rounds top corners when true */
  isFirst?: boolean;
  /** Rounds bottom corners and hides bottom border when true */
  isLast?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SettingsRow({
  label,
  value,
  icon,
  showChevron = false,
  isSelected = false,
  onPress,
  isFirst = false,
  isLast = false,
}: SettingsRowProps) {
  const theme = useTheme();

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.card },
    isFirst && styles.roundedTop,
    isLast && styles.roundedBottom,
    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  ];

  const content = (
    <View style={containerStyle}>
      {/* Left: emoji + label */}
      <View style={styles.leftContent}>
        {icon ? <ThemedText style={styles.icon}>{icon}</ThemedText> : null}
        <ThemedText style={[styles.label, { color: theme.text }]}>
          {label}
        </ThemedText>
      </View>

      {/* Right: value / checkmark / chevron */}
      <View style={styles.rightContent}>
        {value ? (
          <ThemedText style={[styles.value, { color: theme.textSecondary }]}>
            {value}
          </ThemedText>
        ) : null}
        {isSelected ? (
          <ThemedText style={[styles.checkmark, { color: theme.accent }]}>
            ✓
          </ThemedText>
        ) : null}
        {showChevron ? (
          <ThemedText style={[styles.chevron, { color: theme.textSecondary }]}>
            ›
          </ThemedText>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  roundedTop: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  roundedBottom: {
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "700",
  },
  chevron: {
    fontSize: 22,
    fontWeight: "400",
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.65,
  },
});
