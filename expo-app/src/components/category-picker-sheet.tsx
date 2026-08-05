/**
 * The pool behind Discover's "+" tile — a real native sheet.
 *
 * Rendered with @expo/ui, so this is a SwiftUI `sheet` with native detents
 * and grabber on iOS, and a Material `ModalBottomSheet` on Android. The
 * rows are native List/ListItem, not JS-drawn views.
 *
 * Web has no native toolkit binding, so category-picker-sheet.web.tsx
 * keeps the JS-drawn Modal version. Keep the props of both in sync.
 */

import React from "react";
import { Platform } from "react-native";
import {
  BottomSheet,
  Column,
  Host,
  Icon,
  List,
  ListItem,
  Text,
} from "@expo/ui";

import { CATEGORY_SF_SYMBOL, CONTEXT_OPTION_MAP } from "@/constants/categories";
import i18n from "@/i18n";
import type { FoodContext } from "@/types/restaurant";

export interface CategoryPickerSheetProps {
  visible: boolean;
  available: FoodContext[];
  onAdd: (ctx: FoodContext) => void;
  onClose: () => void;
}

/**
 * Stays open while there's anything left to add (so several can be added
 * in one go). `available` is derived from the persisted active list, so it
 * shrinks with each tap; the screen closes the sheet when it empties.
 */
export function CategoryPickerSheet({
  visible,
  available,
  onAdd,
  onClose,
}: CategoryPickerSheetProps) {
  return (
    // matchContents keeps the host itself zero-sized — it exists only to
    // bridge into SwiftUI / Compose; the sheet presents modally above it.
    <Host matchContents>
      <BottomSheet isPresented={visible} onDismiss={onClose}>
        <Column spacing={12}>
          <Text textStyle={{ fontSize: 22, fontWeight: "700" }}>
            {i18n.t("home.category_add_title")}
          </Text>
          <Text textStyle={{ fontSize: 14 }}>
            {i18n.t("home.category_add_subtitle")}
          </Text>

          <List>
            {available.map((category) => {
              const option = CONTEXT_OPTION_MAP[category];
              if (!option) return null;

              return (
                <ListItem
                  key={category}
                  onPress={() => onAdd(category)}
                  // Android expects an XML vector drawable here rather than
                  // an SF Symbol string, so it goes without a leading icon
                  // until @expo/material-symbols is added.
                  leading={
                    Platform.OS === "ios" ? (
                      <Icon name={CATEGORY_SF_SYMBOL[category]} size={22} />
                    ) : undefined
                  }
                >
                  {option.label()}
                </ListItem>
              );
            })}
          </List>

          <Text textStyle={{ fontSize: 12 }}>
            {i18n.t("home.category_remove_hint")}
          </Text>
        </Column>
      </BottomSheet>
    </Host>
  );
}
