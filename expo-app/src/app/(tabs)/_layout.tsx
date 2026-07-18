import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";

/**
 * CupMap bottom tab navigator — Discover / Map / Saved.
 * Settings is not a tab; it's opened from Discover's header icon.
 *
 * Uses expo-router's native tab bar (unstable_native-tabs) — a real
 * platform tab bar on iOS/Android instead of a JS-rendered one. Icons use
 * plain SF Symbol / Material Symbol identifiers (`sf` / `md`) rather than
 * NativeTabs.Trigger.VectorIcon — VectorIcon rasterizes via
 * expo-font.renderToImageAsync, which throws on web.
 */
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      tintColor={theme.accent}
      backgroundColor={theme.background}
    >
      <NativeTabs.Trigger name="(discover)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "safari", selected: "safari.fill" }}
          md="explore"
        />
        <NativeTabs.Trigger.Label>
          {i18n.t("tabs.discover")}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Icon
          sf={{ default: "map", selected: "map.fill" }}
          md="map"
        />
        <NativeTabs.Trigger.Label>{i18n.t("tabs.map")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Icon
          sf={{ default: "bookmark", selected: "bookmark.fill" }}
          md="bookmark"
        />
        <NativeTabs.Trigger.Label>
          {i18n.t("tabs.saved")}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
