import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { NotFound } from "@/components/not-found";
import { AppText, Avatar, Card, IconBadge, PrimaryButton, SegmentedControl } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { computeBalancesByOtherUser, sumBalances } from "@/lib/expenses";
import { formatCents } from "@/lib/money";

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuthState();
  const { groups, loading: groupsLoading } = useGroups(user?.uid);
  const { expenses, loading } = useMyExpenses(user?.uid);
  const [tab, setTab] = useState<"expenses" | "balances">("expenses");

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

  const sections = useMemo(() => {
    const out: { label: string; items: typeof groupExpenses }[] = [];
    for (const expense of groupExpenses) {
      const date = expense.expenseDate ?? expense.createdAt;
      const label = date ? monthLabel(date) : "Earlier";
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(expense);
      else out.push({ label, items: [expense] });
    }
    return out;
  }, [groupExpenses]);

  if (!groupsLoading && !group) return <NotFound />;
  if (!group) return null;

  const otherMembers = group.members.filter((uid) => uid !== user?.uid);
  const shownAvatars = otherMembers.slice(0, 4);
  const extraCount = otherMembers.length - shownAvatars.length;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <Pressable
              hitSlop={8}
              onPress={() => router.push({ pathname: "/manage-members", params: { groupId } })}>
              <MaterialIcons name="group" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.summary}>
          <View style={styles.avatarStack}>
            {shownAvatars.map((uid, i) => {
              const profile = group.memberProfiles[uid];
              return (
                <View key={uid} style={[styles.stackedAvatar, { marginLeft: i === 0 ? 0 : -10 }]}>
                  <Avatar name={profile?.displayName || profile?.email || uid} size={36} />
                </View>
              );
            })}
            {extraCount > 0 && (
              <View style={[styles.stackedAvatar, styles.extraAvatar]}>
                <AppText variant="label" color="textMuted">
                  +{extraCount}
                </AppText>
              </View>
            )}
          </View>

          <AppText variant="label" color="textMuted">
            TOTAL BALANCE
          </AppText>
          <AppText
            variant="displayCurrency"
            color={totalBalance > 0 ? "positive" : totalBalance < 0 ? "negative" : "textFaint"}>
            {formatCents(Math.abs(totalBalance))}
          </AppText>
          <AppText variant="body" color="textMuted">
            {totalBalance === 0
              ? "Everyone's settled up"
              : totalBalance > 0
                ? "You are owed overall"
                : "You owe overall"}
          </AppText>
        </Card>

        <View style={styles.segment}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "expenses", label: "Expenses" },
              { value: "balances", label: "Balances" },
            ]}
          />
        </View>

        {tab === "expenses" ? (
          !loading && groupExpenses.length === 0 ? (
            <View style={styles.empty}>
              <IconBadge name="receipt-long" tone="neutral" size={56} />
              <AppText variant="body" color="textFaint">
                No expenses yet
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
                      const payerProfile = group.memberProfiles[item.paidBy];
                      const dateLabel = (item.expenseDate ?? item.createdAt)?.toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      );
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
                          <IconBadge name="receipt-long" tone="primary" size={40} />
                          <View style={styles.rowInfo}>
                            <AppText variant="bodySemibold" numberOfLines={1}>
                              {item.description}
                            </AppText>
                            <AppText variant="body" color="textMuted" numberOfLines={1}>
                              {youPaid ? "You" : payerProfile?.displayName || "Someone"} paid{" "}
                              {formatCents(item.amountCents)}
                              {dateLabel ? ` · ${dateLabel}` : ""}
                            </AppText>
                          </View>
                          <View style={styles.rowAmount}>
                            <AppText variant="label" color="textMuted">
                              {youPaid ? "you lent" : "you owe"}
                            </AppText>
                            <AppText
                              variant="bodyLgSemibold"
                              color={youPaid ? "positive" : "negative"}>
                              {formatCents(Math.abs(impact))}
                            </AppText>
                          </View>
                        </Pressable>
                      );
                    })}
                  </Card>
                </View>
              ))}
            </View>
          )
        ) : (
          <View style={styles.list}>
            <Card padded={false}>
              {otherMembers.map((uid, i) => {
                const profile = group.memberProfiles[uid];
                const balance = balances[uid] ?? 0;
                return (
                  <View key={uid} style={[styles.row, i > 0 && styles.rowDivider]}>
                    <Avatar name={profile?.displayName || profile?.email || uid} size={40} />
                    <AppText variant="bodySemibold" style={styles.rowInfo} numberOfLines={1}>
                      {profile?.displayName || profile?.email || uid}
                    </AppText>
                    <AppText
                      variant="bodySemibold"
                      color={balance > 0 ? "positive" : balance < 0 ? "negative" : "textFaint"}>
                      {balance === 0
                        ? "settled"
                        : balance > 0
                          ? `owes you ${formatCents(balance)}`
                          : `you owe ${formatCents(-balance)}`}
                    </AppText>
                  </View>
                );
              })}
            </Card>
            <Pressable
              style={styles.manageRow}
              onPress={() => router.push({ pathname: "/manage-members", params: { groupId } })}>
              <MaterialIcons name="group-add" size={18} color={colors.primary} />
              <AppText variant="bodySemibold" color="primary">
                Manage members
              </AppText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Add expense"
          icon="add"
          full
          onPress={() => router.push({ pathname: "/add-expense", params: { groupId } })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.gutter,
    paddingBottom: 96,
    gap: spacing.lg,
  },
  summary: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  avatarStack: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  stackedAvatar: {
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: radius.pill,
  },
  extraAvatar: {
    width: 36,
    height: 36,
    marginLeft: -10,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    marginTop: -spacing.xs,
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
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
