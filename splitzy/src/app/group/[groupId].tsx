import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { NotFound } from "@/components/not-found";
import { useAuthState } from "@/hooks/use-auth-state";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { computeBalancesByOtherUser, sumBalances } from "@/lib/expenses";
import { formatCents } from "@/lib/money";

export default function GroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuthState();
  const { groups, loading: groupsLoading } = useGroups(user?.uid);
  const { expenses, loading } = useMyExpenses(user?.uid);

  const group = groups.find((g) => g.id === groupId);

  const groupExpenses = useMemo(
    () => expenses.filter((e) => e.groupId === groupId),
    [expenses, groupId],
  );

  const balances = useMemo(() => {
    if (!user) return {};
    return computeBalancesByOtherUser(groupExpenses, user.uid);
  }, [groupExpenses, user]);

  const totalBalance = sumBalances(balances);

  if (!groupsLoading && !group) {
    return <NotFound />;
  }

  if (!group) {
    return null;
  }

  const otherMembers = group.members.filter((uid) => uid !== user?.uid);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="group" size={56} color="#2f6feb" />
        <Text style={styles.name}>{group.name}</Text>
        {group.description ? <Text style={styles.description}>{group.description}</Text> : null}

        {totalBalance === 0 ? (
          <Text style={styles.settled}>Settled up</Text>
        ) : (
          <Text style={[styles.balance, totalBalance > 0 ? styles.owedToYou : styles.youOwe]}>
            {totalBalance > 0
              ? `You are owed ${formatCents(totalBalance)}`
              : `You owe ${formatCents(-totalBalance)}`}
          </Text>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => router.push({ pathname: "/add-expense", params: { groupId } })}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Add expense</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Members</Text>
        <Pressable onPress={() => router.push({ pathname: "/manage-members", params: { groupId } })}>
          <Text style={styles.manageLink}>Manage</Text>
        </Pressable>
      </View>
      {otherMembers.map((uid) => {
        const profile = group.memberProfiles[uid];
        const balance = balances[uid] ?? 0;
        return (
          <View key={uid} style={styles.memberRow}>
            <MaterialIcons name="account-circle" size={32} color="#888" />
            <Text style={styles.memberName}>{profile?.displayName || profile?.email || uid}</Text>
            <Text style={[styles.memberBalance, balance > 0 ? styles.owedToYou : balance < 0 ? styles.youOwe : undefined]}>
              {balance === 0
                ? "settled"
                : balance > 0
                  ? `owes you ${formatCents(balance)}`
                  : `you owe ${formatCents(-balance)}`}
            </Text>
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>Expenses</Text>
      {!loading && groupExpenses.length === 0 && (
        <View style={styles.empty}>
          <MaterialIcons name="receipt-long" size={56} color="#bbb" />
          <Text style={styles.emptyText}>No expenses yet</Text>
        </View>
      )}
      <FlatList
        data={groupExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const youPaid = item.paidBy === user?.uid;
          const mySplit = item.splits[user?.uid ?? ""] ?? 0;
          const payerProfile = group.memberProfiles[item.paidBy];
          const dateLabel = (item.expenseDate ?? item.createdAt)?.toLocaleDateString();
          return (
            <Pressable
              style={styles.expenseRow}
              onPress={() => router.push(`/expense/${item.id}`)}>
              <MaterialIcons name="receipt-long" size={24} color="#2f6feb" />
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>{item.description}</Text>
                <Text style={styles.expenseMeta}>
                  {dateLabel ? `${dateLabel} · ` : ""}
                  {youPaid ? "You paid" : `${payerProfile?.displayName || "Someone"} paid`} ·{" "}
                  {formatCents(item.amountCents)}
                </Text>
              </View>
              <Text style={[styles.expenseShare, youPaid ? styles.owedToYou : styles.youOwe]}>
                {youPaid ? `+${formatCents(item.amountCents - mySplit)}` : `-${formatCents(mySplit)}`}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  balance: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  settled: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },
  owedToYou: {
    color: "#2e7d32",
  },
  youOwe: {
    color: "#d32f2f",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2f6feb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  manageLink: {
    color: "#2f6feb",
    fontWeight: "600",
    fontSize: 13,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  memberName: {
    flex: 1,
    fontSize: 15,
  },
  memberBalance: {
    fontSize: 13,
    color: "#888",
  },
  empty: {
    alignItems: "center",
    paddingTop: 16,
    gap: 6,
  },
  emptyText: {
    color: "#888",
  },
  list: {
    gap: 4,
    paddingBottom: 24,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: "600",
  },
  expenseMeta: {
    fontSize: 12,
    color: "#666",
  },
  expenseShare: {
    fontSize: 14,
    fontWeight: "600",
  },
});
