import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { AddExpenseFab } from "@/components/add-expense-fab";
import { SearchField } from "@/components/search-field";
import { AppText, Card, IconBadge, IconButton, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { computeBalancesByOtherUser, sumBalances } from "@/lib/expenses";
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

  if (!loading && !hasGroups) {
    return (
      <Screen>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="groups" size={44} color={colors.primary} />
          </View>
          <AppText variant="title">No groups yet</AppText>
          <AppText variant="body" color="textMuted" style={styles.emptySubtitle}>
            Create a group to split expenses with more than one friend.
          </AppText>
          <PrimaryButton
            label="Create a group"
            icon="group-add"
            onPress={() => router.push("/create-group")}
            style={styles.emptyButton}
          />
        </View>
        <AddExpenseFab />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        {!searchExpanded && <AppText variant="headlineLg">Groups</AppText>}
        <View style={[styles.headerActions, searchExpanded && styles.headerActionsExpanded]}>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search groups"
            expanded={searchExpanded}
            onExpandedChange={setSearchExpanded}
          />
          {!searchExpanded && (
            <IconButton name="group-add" onPress={() => router.push("/create-group")} />
          )}
        </View>
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AppText variant="body" color="textFaint" style={styles.noResults}>
            No groups match &quot;{search}&quot;.
          </AppText>
        }
        renderItem={({ item }) => {
          const balance = groupBalances[item.id] ?? 0;
          const memberLabel = `${item.members.length} member${item.members.length === 1 ? "" : "s"}`;
          return (
            <Pressable
              onPress={() => router.push(`/group/${item.id}`)}
              style={({ pressed }) => pressed && styles.rowPressed}>
              <Card style={styles.row}>
                <IconBadge name="group" tone="primary" />
                <View style={styles.rowInfo}>
                  <AppText variant="bodyLgSemibold" numberOfLines={1}>
                    {item.name}
                  </AppText>
                  <AppText variant="body" color="textMuted" numberOfLines={1}>
                    {item.description ? `${memberLabel} · ${item.description}` : memberLabel}
                  </AppText>
                </View>
                {balance === 0 ? (
                  <MaterialIcons name="check-circle" size={20} color={colors.textFaint} />
                ) : (
                  <View style={styles.rowAmount}>
                    <AppText variant="body" color={balance > 0 ? "positive" : "negative"}>
                      {balance > 0 ? "you're owed" : "you owe"}
                    </AppText>
                    <AppText variant="title" color={balance > 0 ? "positive" : "negative"}>
                      {formatCents(Math.abs(balance))}
                    </AppText>
                  </View>
                )}
              </Card>
            </Pressable>
          );
        }}
      />

      <AddExpenseFab />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    marginTop: spacing.sm,
    marginBottom: spacing.gutter,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerActionsExpanded: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 96,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowAmount: {
    alignItems: "flex-end",
    gap: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    marginTop: spacing.gutter,
  },
  noResults: {
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
