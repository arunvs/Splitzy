import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

function activityIcon(entry: ActivityEntry) {
  if (entry.type === "signed_up") return "how-to-reg";
  if (entry.type === "expense_edited") return "edit";
  if (entry.type === "expense_deleted") return "delete";
  if (entry.type === "group_created") return "group";
  if (entry.type === "group_member_added") return "person-add";
  if (entry.type === "group_member_removed") return "person-remove";
  if (entry.type === "expense_added") return "receipt-long";
  return "people";
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
    case "expense_deleted":
    case "signed_up":
    default:
      return null;
  }
}

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { entries, loading, loadingMore, hasMore, loadMore, refresh } = useActivity(user?.uid);

  // useActivity fetches once and doesn't listen live (deliberately — see its
  // own comment on why pagination + a live listener don't mix well). Bottom
  // tabs stay mounted when you switch away, so without this, coming back to
  // an already-visited Activity tab would keep showing stale data from
  // whenever it was first opened, missing anything created elsewhere since.
  useFocusEffect(
    useCallback(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]),
  );

  return (
    <View style={styles.container}>
      {!loading && entries.length === 0 && (
        <View style={styles.empty}>
          <MaterialIcons name="history" size={64} color="#bbb" />
          <Text style={styles.emptyTitle}>No activity yet</Text>
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        renderItem={({ item }) => {
          const route = user ? getActivityRoute(item, user.uid) : null;
          return (
            <Pressable
              style={styles.row}
              disabled={!route}
              onPress={() => route && router.push(route)}>
              <MaterialIcons name={activityIcon(item)} size={28} color="#2f6feb" />
              <View style={styles.rowInfo}>
                <Text style={styles.rowText}>{user ? describeActivity(item, user.uid) : ""}</Text>
                {item.createdAt && (
                  <Text style={styles.rowTime}>{item.createdAt.toLocaleString()}</Text>
                )}
              </View>
              {route && <MaterialIcons name="chevron-right" size={22} color="#bbb" />}
            </Pressable>
          );
        }}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footerSpinner} />
          ) : !hasMore && entries.length > 0 ? (
            <Text style={styles.footerText}>That&apos;s the beginning — you joined here.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    color: "#888",
  },
  list: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  rowInfo: {
    flex: 1,
  },
  rowText: {
    fontSize: 15,
  },
  rowTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  footerSpinner: {
    marginVertical: 16,
  },
  footerText: {
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    marginVertical: 16,
  },
});
