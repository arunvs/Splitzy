import { View, type ViewProps } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

type CardProps = ViewProps & {
  // Turn off the inner padding when the card lays out its own rows.
  padded?: boolean;
};

// A white surface with the standard soft ambient shadow and hairline
// border. The base container for list rows, summary panels, form sections.
export function Card({ padded = true, style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? spacing.gutter : 0,
        },
        shadow.card,
        style,
      ]}
    />
  );
}
