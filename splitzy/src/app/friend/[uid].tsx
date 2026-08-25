import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { computeBalancesByOtherUser } from "@/lib/expenses";
import { formatCents } from "@/lib/money";

export default function FriendDetailScreen() {
  const router = useRouter();
  const { uid: friendUid } = useLocalSearchParams<{ uid: string }>();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const { groups } = useGroups(user?.uid);
  const { expenses, loading } = useMyExpenses(user?.uid);

  const friend = friends.find((f) => f.uid === friendUid);

  const sharedExpenses = useMemo(
    () => expenses.filter((e) => e.participants.includes(friendUid)),
    [expenses, friendUid],
  );

  const balance = useMemo(() => {
    if (!user) return 0;
    return computeBalancesByOtherUser(sharedExpenses, user.uid)[friendUid] ?? 0;
  }, [sharedExpenses, user, friendUid]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-circle" size={64} color="#888" />
        <Text style={styles.name}>{friend?.displayName || friend?.email || "Friend"}</Text>
        {balance === 0 ? (
          <Text style={styles.settled}>Settled up</Text>
        ) : (
          <Text style={[styles.balance, balance > 0 ? styles.owedToYou : styles.youOwe]}>
            {balance > 0
              ? `Owes you ${formatCents(balance)}`
              : `You owe ${formatCents(-balance)}`}
          </Text>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => router.push({ pathname: "/add-expense", params: { friendUid } })}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Add expense</Text>
        </Pressable>
      </View>

      {!loading && sharedExpenses.length === 0 && (
        <View style={styles.empty}>
          <MaterialIcons name="receipt-long" size={56} color="#bbb" />
          <Text style={styles.emptyText}>No expenses yet</Text>
        </View>
      )}

      <FlatList
        data={sharedExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const youPaid = item.paidBy === user?.uid;
          const mySplit = item.splits[user?.uid ?? ""] ?? 0;
          const expenseGroup = item.groupId ? groups.find((g) => g.id === item.groupId) : undefined;
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
                  {youPaid ? "You paid" : `${friend?.displayName || "They"} paid`} ·{" "}
                  {formatCents(item.amountCents)}
                  {expenseGroup ? ` · ${expenseGroup.name}` : ""}
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
  balance: {
    fontSize: 16,
    fontWeight: "600",
  },
  settled: {
    fontSize: 16,
    color: "#888",
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
  empty: {
    alignItems: "center",
    paddingTop: 40,
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
