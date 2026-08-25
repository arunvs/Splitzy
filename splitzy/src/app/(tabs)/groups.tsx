import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuthState } from "@/hooks/use-auth-state";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { sumBalances, computeBalancesByOtherUser } from "@/lib/expenses";
import { formatCents } from "@/lib/money";

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { groups, loading } = useGroups(user?.uid);
  const { expenses } = useMyExpenses(user?.uid);

  const hasGroups = groups.length > 0;

  const groupBalances = useMemo(() => {
    if (!user) return {};
    const result: Record<string, number> = {};
    for (const group of groups) {
      const groupExpenses = expenses.filter((e) => e.groupId === group.id);
      result[group.id] = sumBalances(computeBalancesByOtherUser(groupExpenses, user.uid));
    }
    return result;
  }, [groups, expenses, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups</Text>

      {!loading && !hasGroups && (
        <View style={styles.empty}>
          <MaterialIcons name="group" size={64} color="#bbb" />
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a group to start splitting expenses with more than one friend.
          </Text>
          <Pressable style={styles.addButton} onPress={() => router.push("/create-group")}>
            <Text style={styles.addButtonText}>Create a group</Text>
          </Pressable>
        </View>
      )}

      {hasGroups && (
        <>
          <Pressable style={styles.addRow} onPress={() => router.push("/create-group")}>
            <View style={styles.addIconCircle}>
              <MaterialIcons name="group-add" size={20} color="#2f6feb" />
            </View>
            <Text style={styles.addRowText}>Create group</Text>
            <MaterialIcons name="chevron-right" size={22} color="#bbb" />
          </Pressable>

          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const balance = groupBalances[item.id] ?? 0;
              return (
                <Pressable
                  style={styles.groupRow}
                  onPress={() => router.push(`/group/${item.id}`)}>
                  <View style={styles.groupIconCircle}>
                    <MaterialIcons name="group" size={24} color="#2f6feb" />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.groupMeta}>
                      {item.members.length} member{item.members.length === 1 ? "" : "s"}
                      {item.description ? ` · ${item.description}` : ""}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.groupBalance,
                      balance > 0 ? styles.owedToYou : balance < 0 ? styles.youOwe : undefined,
                    ]}>
                    {balance === 0
                      ? "settled"
                      : balance > 0
                        ? `owed ${formatCents(balance)}`
                        : `owe ${formatCents(-balance)}`}
                  </Text>
                </Pressable>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  addButton: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 12,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8effd",
    alignItems: "center",
    justifyContent: "center",
  },
  addRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2f6feb",
  },
  list: {
    gap: 4,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  groupIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8effd",
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
  },
  groupMeta: {
    fontSize: 13,
    color: "#666",
  },
  groupBalance: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    maxWidth: 90,
    textAlign: "right",
  },
  owedToYou: {
    color: "#2e7d32",
  },
  youOwe: {
    color: "#d32f2f",
  },
});
