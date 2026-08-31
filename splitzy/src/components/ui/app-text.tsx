import { StyleSheet, Text, type TextProps } from "react-native";

import { colors, typography } from "@/constants/theme";

type Variant = keyof typeof typography;

type AppTextProps = TextProps & {
  variant?: Variant;
  // A theme colour key, or any raw colour string for one-offs.
  color?: keyof typeof colors | (string & {});
};

// The one text component for the app. Pick a `variant` from the type scale
// and (optionally) a theme `color` key — everything stays consistent with
// the design tokens instead of each screen re-specifying font sizes.
export function AppText({ variant = "body", color = "text", style, ...rest }: AppTextProps) {
  const resolvedColor = (colors as Record<string, string>)[color] ?? color;
  return (
    <Text {...rest} style={[styles.base, typography[variant], { color: resolvedColor }, style]} />
  );
}

const styles = StyleSheet.create({
  // Android adds extra vertical padding around text drawn with a custom font,
  // which pushes glyphs off-centre / clips ascenders in tight containers.
  base: { includeFontPadding: false },
});
