import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface ChipOption {
  id: string;
  label: string;
  emoji?: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
}

/**
 * Multi-select chip grid — used by onboarding's preference screens
 * (cuisines, dietary, price) wherever a light multi-select is needed.
 */
export function ChipSelector({ options, selected, onToggle }: ChipSelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = selected.includes(opt.id);
        return (
          <Pressable
            key={opt.id}
            onPress={() => {
              Haptics.selectionAsync();
              onToggle(opt.id);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? theme.accent : theme.backgroundElement,
                borderColor: isActive ? theme.accent : theme.border,
              },
            ]}
          >
            {opt.emoji ? (
              <ThemedText style={styles.emoji}>{opt.emoji}</ThemedText>
            ) : null}
            <ThemedText
              style={[
                styles.label,
                { color: isActive ? "#FFFFFF" : theme.text },
              ]}
            >
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});
