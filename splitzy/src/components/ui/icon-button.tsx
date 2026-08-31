import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, type PressableProps, StyleSheet } from "react-native";

import { colors, radius } from "@/constants/theme";

type IconButtonProps = Omit<PressableProps, "children"> & {
  name: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  size?: number;
  // Circular pale fill behind the icon (used for header actions).
  tinted?: boolean;
};

export function IconButton({
  name,
  color = colors.primary,
  size = 22,
  tinted = true,
  style,
  ...rest
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      style={(state) => [
        styles.base,
        tinted && { backgroundColor: colors.primaryTint },
        state.pressed && styles.pressed,
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}>
      <MaterialIcons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});
