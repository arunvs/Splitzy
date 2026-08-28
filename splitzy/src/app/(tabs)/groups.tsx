import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AddExpenseFab } from "@/components/add-expense-fab";
import { SearchField } from "@/components/search-field";
import { cardBorder } from "@/constants/shadows";
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
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);

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

  const filteredGroups = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return groups;
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(normalized) ||
        group.description.toLowerCase().includes(normalized),
    );
  }, [groups, search]);

  return (
    <View style={styles.container}>
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
          <View style={styles.headerRow}>
            <View style={styles.searchSlot}>
              <SearchField
                value={search}
                onChangeText={setSearch}
                placeholder="Search groups"
                onExpandedChange={setSearchExpanded}
              />
            </View>
            {!searchExpanded && (
              <Pressable style={styles.addIconButton} onPress={() => router.push("/create-group")}>
                <MaterialIcons name="group-add" size={22} color="#2f6feb" />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.noResults}>No groups match &quot;{search}&quot;.</Text>
            }
            renderItem={({ item }) => {
              const balance = groupBalances[item.id] ?? 0;
              return (
                <Pressable
                  style={({ pressed }) => [styles.groupRow, pressed && styles.groupRowPressed]}
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

      <AddExpenseFab />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  searchSlot: {
    flex: 1,
  },
  addIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8effd",
    alignItems: "center",
    justifyContent: "center",
  },
  noResults: {
    textAlign: "center",
    color: "#888",
    marginTop: 24,
  },
  list: {
    gap: 10,
    paddingBottom: 8,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    ...cardBorder,
  },
  groupRowPressed: {
    backgroundColor: "#f7f9fd",
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
