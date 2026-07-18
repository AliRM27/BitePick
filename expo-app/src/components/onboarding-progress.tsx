import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

interface OnboardingProgressProps {
  total: number;
  current: number;
}

export function OnboardingProgress({ total, current }: OnboardingProgressProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i <= current ? theme.accent : theme.backgroundSelected,
              width: i === current ? 20 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
