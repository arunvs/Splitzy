import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, IconBadge } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";

export function NotFound({
  title = "Nothing to split here",
  message = "This friend, group, or expense doesn't exist — or it's simply none of your business. Either way, there's nothing to see.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <View style={styles.container}>
      <IconBadge name="search-off" tone="neutral" size={72} />
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" color="textMuted" style={styles.message}>
        {message}
      </AppText>
      {/* Expo Router's own guidance for +not-found screens: use a Link back
          to "/", not the imperative router API. */}
      <Link href="/" asChild>
        <Pressable style={styles.button}>
          <AppText variant="bodyLgSemibold" color="onPrimary">
            Back to Splitzy
          </AppText>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    marginTop: spacing.md,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
});
