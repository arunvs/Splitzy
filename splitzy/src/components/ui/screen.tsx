import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/constants/theme";

import { AppText } from "./app-text";

type ScreenProps = {
  children: ReactNode;
  // Drop the horizontal gutter for screens that need edge-to-edge lists.
  gutter?: boolean;
  style?: ViewStyle;
};

// Standard screen shell: fills the background, respects the top safe-area
// inset, and applies the consistent side gutter.
export function Screen({ children, gutter = true, style }: ScreenProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={[styles.body, gutter && { paddingHorizontal: spacing.screen }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

type ScreenTitleProps = {
  title: string;
  right?: ReactNode;
};

// The large screen title row ("Friends"), with optional action controls
// pinned to the right.
export function ScreenTitle({ title, right }: ScreenTitleProps) {
  return (
    <View style={styles.titleRow}>
      <AppText variant="headlineLg">{title}</AppText>
      {right ? <View style={styles.titleActions}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    marginTop: spacing.sm,
    marginBottom: spacing.gutter,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
