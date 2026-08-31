import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { NotFound } from "@/components/not-found";
import { AppText, Avatar, Card, IconBadge, PrimaryButton } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { computeBalancesByOtherUser } from "@/lib/expenses";
import { formatCents } from "@/lib/money";

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function FriendDetailScreen() {
  const router = useRouter();
  const { uid: friendUid } = useLocalSearchParams<{ uid: string }>();
  const { user } = useAuthState();
  const { friends, loading: friendsLoading } = useFriends(user?.uid);
  const { groups } = useGroups(user?.uid);
  const { expenses, loading } = useMyExpenses(user?.uid);

  const friend = friends.find((f) => f.uid === friendUid);
  const friendName = friend?.displayName || friend?.email || "Friend";

  const sharedExpenses = useMemo(
    () => expenses.filter((e) => e.participants.includes(friendUid)),
    [expenses, friendUid],
  );

  const balance = useMemo(() => {
    if (!user) return 0;
    return computeBalancesByOtherUser(sharedExpenses, user.uid)[friendUid] ?? 0;
  }, [sharedExpenses, user, friendUid]);

  // Group the expense list by month for section headers.
  const sections = useMemo(() => {
    const out: { label: string; items: typeof sharedExpenses }[] = [];
    for (const expense of sharedExpenses) {
      const date = expense.expenseDate ?? expense.createdAt;
      const label = date ? monthLabel(date) : "Earlier";
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(expense);
      else out.push({ label, items: [expense] });
    }
    return out;
  }, [sharedExpenses]);

  if (!friendsLoading && !friend) {
    return <NotFound />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: friendName }} />

      <View style={styles.header}>
        <Avatar name={friendName} size={88} />
        <AppText variant="body" color="textMuted" style={styles.balanceCaption}>
          {balance === 0
            ? "You're settled up"
            : balance > 0
              ? `${friendName} owes you`
              : `You owe ${friendName}`}
        </AppText>
        {balance !== 0 && (
          <AppText variant="displayCurrency" color={balance > 0 ? "positive" : "negative"}>
            {formatCents(Math.abs(balance))}
          </AppText>
        )}

        <View style={styles.actions}>
          <PrimaryButton
            label="Add expense"
            icon="add"
            variant="tonal"
            onPress={() => router.push({ pathname: "/add-expense", params: { friendUid } })}
            style={styles.actionButton}
          />
          {balance !== 0 && friend && (
            <PrimaryButton
              label="Settle up"
              icon="payments"
              onPress={() =>
                router.push({
                  pathname: "/settle-up",
                  params: { friendUid, balance: String(balance) },
                })
              }
              style={styles.actionButton}
            />
          )}
        </View>
      </View>

      {!loading && sharedExpenses.length === 0 ? (
        <View style={styles.empty}>
          <IconBadge name="receipt-long" tone="neutral" size={56} />
          <AppText variant="body" color="textFaint">
            No shared expenses yet
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {sections.map((section) => (
            <View key={section.label} style={styles.section}>
              <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
                {section.label.toUpperCase()}
              </AppText>
              <Card padded={false}>
                {section.items.map((item, i) => {
                  const youPaid = item.paidBy === user?.uid;
                  const mySplit = item.splits[user?.uid ?? ""] ?? 0;
                  const expenseGroup = item.groupId
                    ? groups.find((g) => g.id === item.groupId)
                    : undefined;
                  const dateLabel = (item.expenseDate ?? item.createdAt)?.toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" },
                  );
                  const isSettlement = item.splitType === "settlement";
                  const impact = youPaid ? item.amountCents - mySplit : -mySplit;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push(`/expense/${item.id}`)}
                      style={({ pressed }) => [
                        styles.row,
                        i > 0 && styles.rowDivider,
                        pressed && styles.rowPressed,
                      ]}>
                      <IconBadge
                        name={isSettlement ? "swap-horiz" : "receipt-long"}
                        tone={isSettlement ? "neutral" : "primary"}
                        size={40}
                      />
                      <View style={styles.rowInfo}>
                        <AppText variant="bodySemibold" numberOfLines={1}>
                          {isSettlement
                            ? youPaid
                              ? `You paid ${friendName}`
                              : `${friendName} paid you`
                            : item.description}
                        </AppText>
                        <AppText variant="body" color="textMuted" numberOfLines={1}>
                          {dateLabel}
                          {expenseGroup ? ` · ${expenseGroup.name}` : ""}
                        </AppText>
                      </View>
                      {!isSettlement && (
                        <View style={styles.rowAmount}>
                          <AppText variant="label" color="textMuted">
                            {youPaid ? "you lent" : "you borrowed"}
                          </AppText>
                          <AppText
                            variant="bodyLgSemibold"
                            color={youPaid ? "positive" : "negative"}>
                            {formatCents(Math.abs(impact))}
                          </AppText>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </Card>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  balanceCaption: {
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.gutter,
    alignSelf: "stretch",
  },
  actionButton: {
    flex: 1,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  list: {
    gap: spacing.lg,
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
  rowAmount: {
    alignItems: "flex-end",
    gap: 2,
  },
});
