import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

/**
 * Discover needs its own nested Stack so it gets a real native header —
 * Stack.Toolbar only attaches to a screen that's a direct child of an
 * actual Stack navigator. (tabs)/_layout.tsx uses NativeTabs, which has no
 * header of its own, so without this nested Stack a Stack.Toolbar placed
 * directly in the screen has nothing to attach to and silently renders
 * nothing.
 */
export default function ProfileLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          title: "",
        }}
      />
    </Stack>
  );
}
