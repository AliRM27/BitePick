/**
 * Shared category / filter catalog.
 *
 * Lives outside the Discover screen because the sheets (which have
 * separate native and .web implementations) need the same option lists,
 * and duplicating them is how the two platforms drift apart.
 */

import {
  Coffee,
  Croissant,
  IceCream2,
  Martini,
  Utensils,
} from "lucide-react-native";
import type { SFSymbol } from "expo-symbols";

import i18n from "@/i18n";
import type { FoodContext } from "@/types/restaurant";

export interface ContextOption {
  key: FoodContext;
  Icon: React.ElementType;
  label: () => string;
}

/**
 * Full catalog of categories. What actually appears on the Discover row is
 * the user's active subset (see use-categories.ts) — everything else sits
 * in the pool behind the "+" tile.
 */
export const CONTEXT_OPTIONS: ContextOption[] = [
  { key: "coffee", Icon: Coffee, label: () => i18n.t("home.context_coffee") },
  { key: "food", Icon: Utensils, label: () => i18n.t("home.context_food") },
  {
    key: "dessert",
    Icon: IceCream2,
    label: () => i18n.t("home.context_dessert"),
  },
  {
    key: "bakery",
    Icon: Croissant,
    label: () => i18n.t("home.context_bakery"),
  },
  { key: "brunch", Icon: Utensils, label: () => i18n.t("home.context_brunch") },
  { key: "drinks", Icon: Martini, label: () => i18n.t("home.context_drinks") },
];

export const CONTEXT_OPTION_MAP = Object.fromEntries(
  CONTEXT_OPTIONS.map((option) => [option.key, option]),
) as Record<FoodContext, ContextOption>;

/**
 * SF Symbol per category, used by the native (@expo/ui) category sheet on
 * iOS. Android rows render without a leading icon — Icon expects an XML
 * vector drawable there (via @expo/material-symbols), which isn't a
 * dependency of this app yet.
 */
export const CATEGORY_SF_SYMBOL: Record<FoodContext, SFSymbol> = {
  coffee: "cup.and.saucer.fill",
  food: "fork.knife",
  dessert: "birthday.cake.fill",
  bakery: "takeoutbag.and.cup.and.straw.fill",
  brunch: "sunrise.fill",
  drinks: "wineglass.fill",
};

export const RADIUS_OPTIONS = [
  { meters: 500, label: "0.5 km" },
  { meters: 1000, label: "1 km" },
  { meters: 3000, label: "3 km" },
  { meters: 5000, label: "5 km" },
] as const;

export const PRICE_OPTIONS = [
  { key: "any", label: "Any price" },
  { key: "PRICE_LEVEL_INEXPENSIVE", label: "$" },
  { key: "PRICE_LEVEL_MODERATE", label: "$$" },
  { key: "PRICE_LEVEL_EXPENSIVE", label: "$$$" },
  { key: "PRICE_LEVEL_VERY_EXPENSIVE", label: "$$$$" },
] as const;

export type PriceFilter = (typeof PRICE_OPTIONS)[number]["key"];

export function formatRadiusLabel(radiusMeters: number) {
  return (
    RADIUS_OPTIONS.find((option) => option.meters === radiusMeters)?.label ??
    `${radiusMeters / 1000} km`
  );
}

export function formatPriceLabel(priceFilter: PriceFilter) {
  return (
    PRICE_OPTIONS.find((option) => option.key === priceFilter)?.label ??
    "Any price"
  );
}

export function categoryLabel(context: FoodContext) {
  return CONTEXT_OPTION_MAP[context]?.label() ?? i18n.t("home.context_food");
}
