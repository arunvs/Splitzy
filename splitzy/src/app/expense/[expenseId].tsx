import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import type { Group } from "@/lib/groups";
import { formatCents } from "@/lib/money";
import type { UserProfile } from "@/lib/types";

const SPLIT_TYPE_LABELS = {
  equal: "Split equally",
  percentage: "Split by percentage",
  exact: "Split by exact amounts",
};

function resolveName(
  uid: string,
  meUid: string | undefined,
  friends: UserProfile[],
  group: Group | undefined,
) {
  if (uid === meUid) return "You";
  if (group?.memberProfiles[uid]) {
    const profile = group.memberProfiles[uid];
    return profile.displayName || profile.email;
  }
  const friend = friends.find((f) => f.uid === uid);
  if (friend) return friend.displayName || friend.email;
  return uid;
}

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const { groups } = useGroups(user?.uid);
  const { expenses } = useMyExpenses(user?.uid);

  const expense = expenses.find((e) => e.id === expenseId);
  const group = expense?.groupId ? groups.find((g) => g.id === expense.groupId) : undefined;

  if (!expense) {
    return (
      <View style={[styles.container, styles.content]}>
        <Text style={styles.notFound}>Expense not found.</Text>
      </View>
    );
  }

  const payerName = resolveName(expense.paidBy, user?.uid, friends, group);
  const editorName = expense.updatedBy ? resolveName(expense.updatedBy, user?.uid, friends, group) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <MaterialIcons name="receipt-long" size={48} color="#2f6feb" />
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.amount}>{formatCents(expense.amountCents)}</Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialIcons name="event" size={18} color="#666" />
        <Text style={styles.metaText}>
          {(expense.expenseDate ?? expense.createdAt)?.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          }) ?? "Unknown date"}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialIcons name="payments" size={18} color="#666" />
        <Text style={styles.metaText}>{payerName} paid {formatCents(expense.amountCents)}</Text>
      </View>

      {group && (
        <View style={styles.metaRow}>
          <MaterialIcons name="group" size={18} color="#666" />
          <Text style={styles.metaText}>{group.name}</Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <MaterialIcons name="calculate" size={18} color="#666" />
        <Text style={styles.metaText}>{SPLIT_TYPE_LABELS[expense.splitType]}</Text>
      </View>

      {editorName && expense.updatedAt && (
        <View style={styles.metaRow}>
          <MaterialIcons name="edit" size={18} color="#666" />
          <Text style={styles.metaText}>
            Last edited by {editorName} on {expense.updatedAt.toLocaleDateString()}
          </Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Breakdown</Text>
      {expense.participants.map((uid) => {
        const name = resolveName(uid, user?.uid, friends, group);
        const share = expense.splits[uid] ?? 0;
        const isPayer = uid === expense.paidBy;
        return (
          <View key={uid} style={styles.breakdownRow}>
            <MaterialIcons name="account-circle" size={28} color="#888" />
            <Text style={styles.breakdownName}>{name}</Text>
            <Text style={styles.breakdownShare}>
              {isPayer ? `paid ${formatCents(expense.amountCents)}, owes ` : "owes "}
              {formatCents(share)}
            </Text>
          </View>
        );
      })}

      <Pressable
        style={styles.editButton}
        onPress={() => router.push({ pathname: "/add-expense", params: { expenseId: expense.id } })}>
        <MaterialIcons name="edit" size={18} color="#fff" />
        <Text style={styles.editButtonText}>Edit expense</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  notFound: {
    textAlign: "center",
    color: "#888",
    marginTop: 40,
  },
  header: {
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  description: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  amount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2f6feb",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#333",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  breakdownName: {
    flex: 1,
    fontSize: 15,
  },
  breakdownShare: {
    fontSize: 13,
    color: "#666",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 24,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
