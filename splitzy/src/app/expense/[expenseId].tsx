import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { NotFound } from "@/components/not-found";
import { AppText, Avatar, Card, IconBadge, PrimaryButton } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { deleteExpense } from "@/lib/expenses";
import type { Group } from "@/lib/groups";
import { logError } from "@/lib/log-error";
import { formatCents } from "@/lib/money";
import type { UserProfile } from "@/lib/types";

const SPLIT_TYPE_LABELS = {
  equal: "Split equally",
  percentage: "Split by percentage",
  exact: "Split by exact amounts",
  settlement: "Settlement",
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

function MetaRow({ icon, children }: { icon: keyof typeof MaterialIcons.glyphMap; children: string }) {
  return (
    <View style={styles.metaRow}>
      <MaterialIcons name={icon} size={18} color={colors.textFaint} />
      <AppText variant="body" color="textMuted" style={styles.metaText}>
        {children}
      </AppText>
    </View>
  );
}

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const { groups } = useGroups(user?.uid);
  const { expenses, loading: expensesLoading } = useMyExpenses(user?.uid);
  const [deleting, setDeleting] = useState(false);

  const expense = expenses.find((e) => e.id === expenseId);
  const group = expense?.groupId ? groups.find((g) => g.id === expense.groupId) : undefined;

  async function handleDelete() {
    if (!expense || !user?.email) return;
    setDeleting(true);
    try {
      await deleteExpense(
        expense,
        { uid: user.uid, email: user.email, displayName: user.displayName ?? "" },
        group?.name,
      );
      router.back();
    } catch (err) {
      logError(err, { screen: "expense-detail", action: "delete" });
      Alert.alert("Something went wrong", "Please try again.");
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete expense", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ]);
  }

  if (!expensesLoading && !expense) return <NotFound />;
  if (!expense) return null;

  const isSettlement = expense.splitType === "settlement";
  const payerName = resolveName(expense.paidBy, user?.uid, friends, group);
  const editorName = expense.updatedBy
    ? resolveName(expense.updatedBy, user?.uid, friends, group)
    : null;
  const dateText =
    (expense.expenseDate ?? expense.createdAt)?.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) ?? "Unknown date";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconBadge name={isSettlement ? "swap-horiz" : "receipt-long"} tone="primary" size={56} />
        <AppText variant="title" style={styles.description}>
          {expense.description}
        </AppText>
        <AppText variant="displayCurrency" color="primary">
          {formatCents(expense.amountCents)}
        </AppText>
      </View>

      <Card style={styles.metaCard}>
        <MetaRow icon="event">{dateText}</MetaRow>
        <MetaRow icon="payments">{`${payerName} paid ${formatCents(expense.amountCents)}`}</MetaRow>
        {group ? <MetaRow icon="group">{group.name}</MetaRow> : null}
        <MetaRow icon="calculate">{SPLIT_TYPE_LABELS[expense.splitType]}</MetaRow>
        {editorName && expense.updatedAt ? (
          <MetaRow icon="edit">
            {`Last edited by ${editorName} on ${expense.updatedAt.toLocaleDateString()}`}
          </MetaRow>
        ) : null}
      </Card>

      <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
        BREAKDOWN
      </AppText>
      <Card padded={false}>
        {expense.participants.map((uid, i) => {
          const name = resolveName(uid, user?.uid, friends, group);
          const share = expense.splits[uid] ?? 0;
          const isPayer = uid === expense.paidBy;
          return (
            <View key={uid} style={[styles.breakdownRow, i > 0 && styles.rowDivider]}>
              <Avatar name={name} size={36} />
              <AppText variant="bodySemibold" style={styles.breakdownName} numberOfLines={1}>
                {name}
              </AppText>
              <AppText variant="body" color="textMuted">
                {isPayer ? `paid ${formatCents(expense.amountCents)}, owes ` : "owes "}
                {formatCents(share)}
              </AppText>
            </View>
          );
        })}
      </Card>

      <View style={styles.actions}>
        <PrimaryButton
          label="Edit expense"
          icon="edit"
          full
          onPress={() =>
            router.push({ pathname: "/add-expense", params: { expenseId: expense.id } })
          }
        />
        <PrimaryButton
          label={deleting ? "Deleting…" : "Delete expense"}
          icon="delete"
          variant="ghost"
          danger
          full
          disabled={deleting}
          onPress={confirmDelete}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    ...centeredContent,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  description: {
    textAlign: "center",
  },
  metaCard: {
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metaText: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownName: {
    flex: 1,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
