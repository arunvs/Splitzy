import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

// Extended pill FAB, pinned bottom-right above the list. Opens the
// "who's this expense with?" picker.
export function AddExpenseFab() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      onPress={() => router.push("/select-expense-target")}>
      <MaterialIcons name="add" size={22} color={colors.onPrimary} />
      <AppText style={[typography.bodyLgSemibold, styles.label]}>Add expense</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.screen,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 14,
    paddingLeft: spacing.gutter,
    paddingRight: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadow.fab,
  },
  label: {
    color: colors.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
