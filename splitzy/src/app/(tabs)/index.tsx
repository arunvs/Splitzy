import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { AddExpenseFab } from "@/components/add-expense-fab";
import { SearchField } from "@/components/search-field";
import { AppText, Avatar, Card, IconButton, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { computeBalancesByOtherUser } from "@/lib/expenses";
import { formatCents } from "@/lib/money";

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { friends, loading } = useFriends(user?.uid);
  const { expenses } = useMyExpenses(user?.uid);
  const [search, setSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);

  const hasFriends = friends.length > 0;

  const balances = useMemo(() => {
    if (!user) return {};
    return computeBalancesByOtherUser(expenses, user.uid);
  }, [expenses, user]);

  // Gross totals for the summary card — what you owe across everyone vs.
  // what you're owed across everyone (not the net of the two).
  const { owedToYou, youOwe } = useMemo(() => {
    let owedToYou = 0;
    let youOwe = 0;
    for (const value of Object.values(balances)) {
      if (value > 0) owedToYou += value;
      else if (value < 0) youOwe += -value;
    }
    return { owedToYou, youOwe };
  }, [balances]);

  // How many of my expenses each friend is part of.
  const sharedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const expense of expenses) {
      const involved = new Set([expense.paidBy, ...expense.participants]);
      for (const uid of involved) {
        if (uid !== user?.uid) counts[uid] = (counts[uid] ?? 0) + 1;
      }
    }
    return counts;
  }, [expenses, user]);

  const filteredFriends = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return friends;
    return friends.filter(
      (friend) =>
        friend.displayName.toLowerCase().includes(normalized) ||
        friend.email.toLowerCase().includes(normalized),
    );
  }, [friends, search]);

  if (!loading && !hasFriends) {
    return (
      <Screen>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="group" size={44} color={colors.primary} />
          </View>
          <AppText variant="title">No friends yet</AppText>
          <AppText variant="body" color="textMuted" style={styles.emptySubtitle}>
            Add a friend to start splitting expenses together.
          </AppText>
          <PrimaryButton
            label="Add friend"
            icon="person-add"
            onPress={() => router.push("/add-friend")}
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
        {!searchExpanded && <AppText variant="headlineLg">Friends</AppText>}
        <View style={[styles.headerActions, searchExpanded && styles.headerActionsExpanded]}>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search friends"
            expanded={searchExpanded}
            onExpandedChange={setSearchExpanded}
          />
          {!searchExpanded && (
            <IconButton name="person-add" onPress={() => router.push("/add-friend")} />
          )}
        </View>
      </View>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          hasFriends ? (
            <Card style={styles.summary}>
              <View style={styles.summaryHalf}>
                <AppText variant="label" color="textMuted">
                  YOU OWE
                </AppText>
                <AppText variant="title" color={youOwe > 0 ? "negative" : "textFaint"}>
                  {formatCents(youOwe)}
                </AppText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryHalf}>
                <AppText variant="label" color="textMuted">
                  YOU&apos;RE OWED
                </AppText>
                <AppText variant="title" color={owedToYou > 0 ? "positive" : "textFaint"}>
                  {formatCents(owedToYou)}
                </AppText>
              </View>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          <AppText variant="body" color="textFaint" style={styles.noResults}>
            No friends match &quot;{search}&quot;.
          </AppText>
        }
        renderItem={({ item }) => {
          const balance = balances[item.uid] ?? 0;
          const count = sharedCounts[item.uid] ?? 0;
          const name = item.displayName || item.email;
          return (
            <Pressable
              onPress={() => router.push(`/friend/${item.uid}`)}
              style={({ pressed }) => pressed && styles.rowPressed}>
              <Card style={styles.row}>
                <Avatar name={name} size={44} />
                <View style={styles.rowInfo}>
                  <AppText variant="bodyLgSemibold" numberOfLines={1}>
                    {name}
                  </AppText>
                  <AppText variant="body" color="textMuted" numberOfLines={1}>
                    {balance === 0
                      ? "Settled up"
                      : count > 0
                        ? `${count} shared expense${count === 1 ? "" : "s"}`
                        : item.email}
                  </AppText>
                </View>
                {balance === 0 ? (
                  <MaterialIcons name="check-circle" size={20} color={colors.textFaint} />
                ) : (
                  <View style={styles.rowAmount}>
                    <AppText variant="body" color={balance > 0 ? "positive" : "negative"}>
                      {balance > 0 ? "owes you" : "you owe"}
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
  summary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginBottom: spacing.xs,
  },
  summaryHalf: {
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  summaryDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.border,
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
