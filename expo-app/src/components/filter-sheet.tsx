/**
 * Radius + price filters as a real native sheet (@expo/ui): a SwiftUI
 * `sheet` with native `Picker` menus on iOS, a Material `ModalBottomSheet`
 * with Compose pickers on Android.
 *
 * Radius and price are stored as a number / string union, but Picker.Item
 * values are plain strings, so both are serialized on the way in and
 * parsed on the way out.
 *
 * Web keeps the JS-drawn version in filter-sheet.web.tsx — keep props in
 * sync.
 */

import React from "react";
import {
  BottomSheet,
  Button,
  Column,
  Host,
  Picker,
  Text,
} from "@expo/ui";

import {
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  categoryLabel,
  type PriceFilter,
} from "@/constants/categories";
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

export function FilterSheet({
  visible,
  context,
  radiusMeters,
  priceFilter,
  onClose,
  onRadiusChange,
  onPriceChange,
}: FilterSheetProps) {
  return (
    <Host matchContents>
      <BottomSheet isPresented={visible} onDismiss={onClose}>
        <Column spacing={16}>
          <Text textStyle={{ fontSize: 22, fontWeight: "700" }}>
            {i18n.t("home.filters_title")}
          </Text>
          <Text textStyle={{ fontSize: 14 }}>{categoryLabel(context)}</Text>

          <Text textStyle={{ fontSize: 13, fontWeight: "600" }}>
            {i18n.t("home.radius_label")}
          </Text>
          <Picker
            selectedValue={String(radiusMeters)}
            onValueChange={(value) => onRadiusChange(Number(value))}
          >
            {RADIUS_OPTIONS.map((option) => (
              <Picker.Item
                key={option.meters}
                label={option.label}
                value={String(option.meters)}
              />
            ))}
          </Picker>

          <Text textStyle={{ fontSize: 13, fontWeight: "600" }}>
            {i18n.t("home.price_label")}
          </Text>
          <Picker
            selectedValue={priceFilter}
            onValueChange={(value) => onPriceChange(value as PriceFilter)}
          >
            {PRICE_OPTIONS.map((option) => (
              <Picker.Item
                key={option.key}
                label={option.label}
                value={option.key}
              />
            ))}
          </Picker>

          <Button label={i18n.t("home.filters_done")} onPress={onClose} />
        </Column>
      </BottomSheet>
    </Host>
  );
}
