import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

import { AppText } from "./app-text";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Pill container with a sliding white "active" chip. Used for the split-type
// toggle, settle-up "who paid", and the group-detail Expenses/Balances tabs.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentActive]}>
            <AppText
              variant="bodySemibold"
              color={selected ? "primary" : "textMuted"}
              style={styles.label}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  label: {
    textAlign: "center",
  },
});
