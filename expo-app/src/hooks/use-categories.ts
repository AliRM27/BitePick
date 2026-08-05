/**
 * Which category tiles the user keeps on the Discover row.
 *
 * The app ships with a small starter set (coffee + food); everything else
 * lives in a pool the user opts into via the "+" tile. Same AsyncStorage
 * persistence pattern as use-settings.ts, with the write centralized in a
 * single effect (see use-saved-restaurants.ts for why side effects must
 * not live inside the setState updaters).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FoodContext } from "@/types/restaurant";

const STORAGE_KEY = "@cupmap/categories";

/** Canonical display order — the row and the picker both follow this. */
export const CATEGORY_ORDER: FoodContext[] = [
  "coffee",
  "food",
  "dessert",
  "bakery",
  "brunch",
  "drinks",
];

/**
 * Always present and not removable, so the row can never end up empty and
 * `context` always has a valid value to fall back to.
 */
export const FIXED_CATEGORIES: FoodContext[] = ["coffee", "food"];

/**
 * Coerce stored data into a valid category list: drop unknown values
 * (e.g. a category removed in a later release), dedupe, re-add the fixed
 * ones, and restore canonical order.
 */
function sanitize(value: unknown): FoodContext[] {
  const raw = Array.isArray(value) ? value : [];
  const known = raw.filter((item): item is FoodContext =>
    CATEGORY_ORDER.includes(item as FoodContext),
  );
  const merged = new Set<FoodContext>([...FIXED_CATEGORIES, ...known]);
  return CATEGORY_ORDER.filter((category) => merged.has(category));
}

export function useCategories() {
  const [activeCategories, _setActiveCategories] =
    useState<FoodContext[]>(FIXED_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        try {
          _setActiveCategories(sanitize(JSON.parse(value)));
        } catch {
          // Malformed storage — keep the starter set.
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Skipped until the initial read resolves so the default set can't
  // clobber a stored list on first render.
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeCategories));
  }, [activeCategories, loaded]);

  /** Categories still in the pool, i.e. addable via the "+" tile. */
  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => !activeCategories.includes(c)),
    [activeCategories],
  );

  const addCategory = useCallback((category: FoodContext) => {
    _setActiveCategories((prev) =>
      prev.includes(category)
        ? prev
        : CATEGORY_ORDER.filter((c) => prev.includes(c) || c === category),
    );
  }, []);

  const removeCategory = useCallback((category: FoodContext) => {
    if (FIXED_CATEGORIES.includes(category)) return;
    _setActiveCategories((prev) => prev.filter((c) => c !== category));
  }, []);

  const isRemovable = useCallback(
    (category: FoodContext) => !FIXED_CATEGORIES.includes(category),
    [],
  );

  return {
    activeCategories,
    availableCategories,
    addCategory,
    removeCategory,
    isRemovable,
    loaded,
  } as const;
}
