import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";

import { AppText, Card, IconBadge, Screen } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useActivity } from "@/hooks/use-activity";
import { useAuthState } from "@/hooks/use-auth-state";
import type { ActivityEntry } from "@/lib/activity";
import { formatCents } from "@/lib/money";

function describeActivity(entry: ActivityEntry, currentUid: string) {
  if (entry.type === "friend_added") {
    return entry.actorUid === currentUid
      ? `You added ${entry.friendName} as a friend`
      : `${entry.actorName} added you as a friend`;
  }
  if (entry.type === "signed_up") {
    return "You joined Splitzy";
  }
  if (entry.type === "group_created") {
    return entry.actorUid === currentUid
      ? `You created ${entry.groupName}`
      : `${entry.actorName} added you to ${entry.groupName}`;
  }
  if (entry.type === "expense_added") {
    const who = entry.actorUid === currentUid ? "You" : entry.actorName;
    const where = entry.groupName ? ` in ${entry.groupName}` : "";
    return `${who} added "${entry.description}" (${formatCents(entry.amountCents)})${where}`;
  }
  if (entry.type === "expense_edited") {
    const who = entry.actorUid === currentUid ? "You" : entry.actorName;
    const where = entry.groupName ? ` in ${entry.groupName}` : "";
    return `${who} edited "${entry.description}" (${formatCents(entry.amountCents)})${where}`;
  }
  if (entry.type === "expense_deleted") {
    const who = entry.actorUid === currentUid ? "You" : entry.actorName;
    const where = entry.groupName ? ` in ${entry.groupName}` : "";
    return `${who} deleted "${entry.description}" (${formatCents(entry.amountCents)})${where}`;
  }
  if (entry.type === "group_member_added") {
    const who = entry.actorUid === currentUid ? "You" : entry.actorName;
    if (entry.memberUid === currentUid) {
      return `${who === "You" ? "You" : entry.actorName} added you to ${entry.groupName}`;
    }
    return `${who} added ${entry.memberName} to ${entry.groupName}`;
  }
  if (entry.type === "group_member_removed") {
    const who = entry.actorUid === currentUid ? "You" : entry.actorName;
    if (entry.memberUid === currentUid) {
      return `${who === "You" ? "You" : entry.actorName} removed you from ${entry.groupName}`;
    }
    return `${who} removed ${entry.memberName} from ${entry.groupName}`;
  }
  return "Activity";
}

function activityIcon(entry: ActivityEntry): keyof typeof MaterialIcons.glyphMap {
  if (entry.type === "signed_up") return "how-to-reg";
  if (entry.type === "expense_edited") return "edit";
  if (entry.type === "expense_deleted") return "delete";
  if (entry.type === "group_created") return "group";
  if (entry.type === "group_member_added") return "person-add";
  if (entry.type === "group_member_removed") return "person-remove";
  if (entry.type === "expense_added") return "receipt-long";
  return "people";
}

function activityTone(entry: ActivityEntry): "primary" | "positive" | "negative" | "neutral" {
  if (entry.type === "expense_deleted" || entry.type === "group_member_removed") return "negative";
  if (entry.type === "expense_added" || entry.type === "friend_added") return "primary";
  if (entry.type === "signed_up") return "positive";
  return "neutral";
}

// Where tapping an entry should take you — mirrors the same detail screens
// reachable from the Friends/Groups tabs, just entered from the log instead.
function getActivityRoute(entry: ActivityEntry, currentUid: string): string | null {
  switch (entry.type) {
    case "friend_added": {
      const otherUid = entry.actorUid === currentUid ? entry.friendUid : entry.actorUid;
      return `/friend/${otherUid}`;
    }
    case "group_created":
    case "group_member_added":
    case "group_member_removed":
      return `/group/${entry.groupId}`;
    case "expense_added":
    case "expense_edited":
      return `/expense/${entry.expenseId}`;
    default:
      return null;
  }
}

function dayLabel(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - day) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

type Section = { label: string; entries: ActivityEntry[] };

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { entries, loading, loadingMore, hasMore, loadMore, refresh } = useActivity(user?.uid);

  // useActivity fetches once and doesn't listen live (deliberately — see its
  // own comment). Bottom tabs stay mounted, so without this a revisited tab
  // would show stale data.
  useFocusEffect(
    useCallback(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]),
  );

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    for (const entry of entries) {
      const label = entry.createdAt ? dayLabel(entry.createdAt) : "Earlier";
      const last = out[out.length - 1];
      if (last && last.label === label) last.entries.push(entry);
      else out.push({ label, entries: [entry] });
    }
    return out;
  }, [entries]);

  return (
    <Screen>
      <AppText variant="headlineLg" style={styles.title}>
        Activity
      </AppText>

      {!loading && entries.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="history" size={44} color={colors.primary} />
          </View>
          <AppText variant="title">No activity yet</AppText>
        </View>
      )}

      <FlatList
        data={sections}
        keyExtractor={(section) => section.label + section.entries[0]?.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
              {section.label.toUpperCase()}
            </AppText>
            <Card padded={false}>
              {section.entries.map((entry, i) => {
                const route = user ? getActivityRoute(entry, user.uid) : null;
                return (
                  <Pressable
                    key={entry.id}
                    disabled={!route}
                    onPress={() => route && router.push(route as never)}
                    style={({ pressed }) => [
                      styles.row,
                      i > 0 && styles.rowDivider,
                      pressed && styles.rowPressed,
                    ]}>
                    <IconBadge name={activityIcon(entry)} tone={activityTone(entry)} size={40} />
                    <View style={styles.rowInfo}>
                      <AppText variant="body">
                        {user ? describeActivity(entry, user.uid) : ""}
                      </AppText>
                      {entry.createdAt && (
                        <AppText variant="label" color="textFaint">
                          {entry.createdAt.toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </AppText>
                      )}
                    </View>
                    {route && (
                      <MaterialIcons name="chevron-right" size={22} color={colors.textFaint} />
                    )}
                  </Pressable>
                );
              })}
            </Card>
          </View>
        )}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footerSpinner} color={colors.primary} />
          ) : !hasMore && entries.length > 0 ? (
            <AppText variant="body" color="textFaint" style={styles.footerText}>
              That&apos;s the beginning — you joined here.
            </AppText>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.gutter,
  },
  list: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.gutter,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: 64,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  footerSpinner: {
    marginVertical: spacing.gutter,
  },
  footerText: {
    textAlign: "center",
    marginVertical: spacing.gutter,
  },
});
