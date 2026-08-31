import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "@/constants/theme";

import { AppText } from "./app-text";

type Variant = "solid" | "tonal" | "ghost";

type PrimaryButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant?: Variant;
  // Swap the accent from primary blue to the "negative" red — for
  // destructive actions (delete account / expense).
  danger?: boolean;
  loading?: boolean;
  full?: boolean;
};

// The app's call-to-action button.
//  - solid: filled accent, white text (primary Save / Add actions)
//  - tonal: pale accent fill, accent text (secondary action beside a solid)
//  - ghost: no fill, accent text (tertiary / destructive text actions)
export function PrimaryButton({
  label,
  icon,
  variant = "solid",
  danger = false,
  loading = false,
  full = false,
  disabled,
  style,
  ...rest
}: PrimaryButtonProps) {
  const accent = danger ? colors.negative : colors.primary;
  const tint = danger ? colors.negativeTint : colors.primaryTint;
  const fg = variant === "solid" ? colors.onPrimary : accent;
  const bg = variant === "solid" ? accent : variant === "tonal" ? tint : "transparent";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        full && styles.full,
        { backgroundColor: bg },
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <>
            {icon ? <MaterialIcons name={icon} size={18} color={fg} /> : null}
            <AppText style={[typography.bodyLgSemibold, { color: fg }]}>{label}</AppText>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  full: {
    alignSelf: "stretch",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
