import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { RestaurantCard } from "@/components/restaurant-card";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useSavedRestaurantsContext } from "@/context/saved-restaurants-context";
import type { SavedRestaurant, SavedStatus } from "@/hooks/use-saved-restaurants";
import { useTheme } from "@/hooks/use-theme";
import i18n from "@/i18n";
import type { Restaurant } from "@/types/restaurant";

type FilterKey = "all" | SavedStatus;

const FILTERS: { key: FilterKey; label: () => string }[] = [
  { key: "all", label: () => i18n.t("saved.filter_all") },
  { key: "want_to_try", label: () => i18n.t("saved.filter_want_to_try") },
  { key: "visited", label: () => i18n.t("saved.filter_visited") },
];

export default function SavedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { savedList, unsaveRestaurant, setStatus, setFeedback } =
    useSavedRestaurantsContext();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredList = useMemo(() => {
    if (filter === "all") return savedList;
    return savedList.filter((item) => item.status === filter);
  }, [savedList, filter]);

  const handleOpenDetail = (restaurant: Restaurant, context: string) => {
    router.push({
      pathname: "/result",
      params: {
        restaurant: JSON.stringify(restaurant),
        origin: "saved",
        category: context,
      },
    });
  };

  const handleUnsave = (restaurant: Restaurant) => {
    Alert.alert(
      i18n.t("saved.unsave_confirm_title"),
      i18n.t("saved.unsave_confirm_message"),
      [
        { text: i18n.t("saved.cancel"), style: "cancel" },
        {
          text: i18n.t("saved.remove"),
          style: "destructive",
          onPress: () => unsaveRestaurant(restaurant.placeId),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: SavedRestaurant }) => (
    <View style={styles.itemWrapper}>
      <Pressable onPress={() => handleOpenDetail(item.restaurant, item.context)}>
        <RestaurantCard
          restaurant={item.restaurant}
          veryCompact
          isSaved
          onToggleSave={() => handleUnsave(item.restaurant)}
          feedback={item.feedback}
          onFeedback={(value) =>
            setFeedback(item.restaurant, item.context, value)
          }
        />
      </Pressable>

      {item.status === "want_to_try" && (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setStatus(item.restaurant.placeId, "visited");
          }}
          style={[styles.markVisitedButton, { borderColor: theme.border }]}
        >
          <ThemedText
            style={[styles.markVisitedText, { color: theme.textSecondary }]}
          >
            {i18n.t("saved.mark_visited")}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {i18n.t("saved.title")}
        </ThemedText>

        <View
          style={[
            styles.segmentedControl,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f.key);
                }}
                style={[
                  styles.segmentOption,
                  isActive && { backgroundColor: theme.accent },
                ]}
              >
                <ThemedText
                  style={[
                    styles.segmentLabel,
                    { color: isActive ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {f.label()}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>🔖</ThemedText>
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              {i18n.t("saved.empty_title")}
            </ThemedText>
            <ThemedText
              style={[styles.emptySubtitle, { color: theme.textSecondary }]}
            >
              {i18n.t("saved.empty_subtitle")}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.restaurant.placeId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  segmentOption: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  itemWrapper: {
    gap: Spacing.two,
  },
  markVisitedButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  markVisitedText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  emptySubtitle: { fontSize: 15, fontWeight: "500", textAlign: "center" },
});
