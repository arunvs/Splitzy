import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/constants/theme";

type Tone = "primary" | "positive" | "negative" | "neutral";

type IconBadgeProps = {
  name: keyof typeof MaterialIcons.glyphMap;
  tone?: Tone;
  size?: number;
};

const TONES: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primaryTint, fg: colors.primary },
  positive: { bg: colors.positiveTint, fg: colors.positive },
  negative: { bg: colors.negativeTint, fg: colors.negative },
  neutral: { bg: colors.surfaceSunken, fg: colors.textMuted },
};

// A category/activity icon inside a soft tinted circle.
export function IconBadge({ name, tone = "primary", size = 44 }: IconBadgeProps) {
  const { bg, fg } = TONES[tone];
  return (
    <View
      style={[styles.circle, { width: size, height: size, backgroundColor: bg }]}>
      <MaterialIcons name={name} size={size * 0.5} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
