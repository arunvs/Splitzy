import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { DateField } from "@/components/date-field";
import {
  AppText,
  Avatar,
  Card,
  FormField,
  PrimaryButton,
  SegmentedControl,
} from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, fonts, radius, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useGroups } from "@/hooks/use-groups";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { createExpense, updateExpense } from "@/lib/expenses";
import { logError } from "@/lib/log-error";
import {
  formatCents,
  parseAmountToCents,
  parsePercentage,
  splitByPercentage,
  splitEqually,
  validateExactSplit,
  type SplitType,
} from "@/lib/money";
import type { UserProfile } from "@/lib/types";

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "percentage", label: "Percentage" },
  { value: "exact", label: "Exact" },
];

function lenientCents(input: string): number {
  const n = Number(input);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

function lenientPercent(input: string): number {
  const n = Number(input);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ friendUid?: string; groupId?: string; expenseId?: string }>();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const { groups } = useGroups(user?.uid);
  const { expenses } = useMyExpenses(user?.uid);

  const me: UserProfile | null = user?.email
    ? { uid: user.uid, email: user.email, displayName: user.displayName ?? "" }
    : null;

  const editingExpense = params.expenseId
    ? expenses.find((e) => e.id === params.expenseId)
    : undefined;
  const isEditMode = !!params.expenseId;

  const effectiveGroupId = editingExpense ? editingExpense.groupId : params.groupId;
  const group = effectiveGroupId ? groups.find((g) => g.id === effectiveGroupId) : undefined;
  const effectiveFriendUid =
    editingExpense && !editingExpense.groupId
      ? editingExpense.participants.find((uid) => uid !== me?.uid)
      : params.friendUid;
  const friend = effectiveFriendUid ? friends.find((f) => f.uid === effectiveFriendUid) : undefined;

  useEffect(() => {
    navigation.setOptions({ title: isEditMode ? "Edit expense" : "Add expense" });
  }, [navigation, isEditMode]);

  const allParticipants: UserProfile[] = useMemo(() => {
    if (!me) return [];
    if (group) {
      return group.members.map((uid) => ({
        uid,
        email: group.memberProfiles[uid]?.email ?? "",
        displayName: group.memberProfiles[uid]?.displayName ?? "",
      }));
    }
    if (friend) return [me, friend];
    return [me];
  }, [me, group, friend]);

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date());
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [paidBy, setPaidBy] = useState("");
  const [includedUids, setIncludedUids] = useState<Set<string> | null>(null);
  const [percentInputs, setPercentInputs] = useState<Record<string, string>>({});
  const [exactInputs, setExactInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!editingExpense || prefilledRef.current) return;
    prefilledRef.current = true;

    setDescription(editingExpense.description);
    setAmountInput((editingExpense.amountCents / 100).toString());
    setExpenseDate(editingExpense.expenseDate ?? editingExpense.createdAt ?? new Date());
    setSplitType(editingExpense.splitType);
    setPaidBy(editingExpense.paidBy);
    setIncludedUids(new Set(editingExpense.participants));

    if (editingExpense.splitType === "percentage") {
      const percentages: Record<string, string> = {};
      editingExpense.participants.forEach((uid) => {
        const cents = editingExpense.splits[uid] ?? 0;
        percentages[uid] = ((cents / editingExpense.amountCents) * 100).toFixed(2);
      });
      setPercentInputs(percentages);
    } else if (editingExpense.splitType === "exact") {
      const amounts: Record<string, string> = {};
      editingExpense.participants.forEach((uid) => {
        amounts[uid] = ((editingExpense.splits[uid] ?? 0) / 100).toFixed(2);
      });
      setExactInputs(amounts);
    }
  }, [editingExpense]);

  const effectiveIncluded = includedUids ?? new Set(allParticipants.map((p) => p.uid));
  const includedParticipants = allParticipants.filter((p) => effectiveIncluded.has(p.uid));
  const effectivePaidBy = paidBy || me?.uid || "";
  const amountCents = parseAmountToCents(amountInput);

  function toggleIncluded(uid: string) {
    setIncludedUids(
      new Set(
        [...effectiveIncluded].includes(uid)
          ? [...effectiveIncluded].filter((id) => id !== uid)
          : [...effectiveIncluded, uid],
      ),
    );
  }

  const equalPreview = useMemo(() => {
    if (!amountCents || includedParticipants.length === 0) return null;
    return splitEqually(amountCents, includedParticipants.map((p) => p.uid));
  }, [amountCents, includedParticipants]);

  const percentTotal = includedParticipants.reduce(
    (sum, p) => sum + lenientPercent(percentInputs[p.uid] ?? ""),
    0,
  );
  const exactTotalCents = includedParticipants.reduce(
    (sum, p) => sum + lenientCents(exactInputs[p.uid] ?? ""),
    0,
  );

  function computeFinalSplits(): Record<string, number> | null {
    if (!amountCents) {
      setError("Enter a valid amount.");
      return null;
    }
    if (includedParticipants.length === 0) {
      setError("Select at least one person to split with.");
      return null;
    }
    if (!includedParticipants.some((p) => p.uid === effectivePaidBy)) {
      setError("The person who paid must be included in the split.");
      return null;
    }

    try {
      if (splitType === "equal") {
        return splitEqually(amountCents, includedParticipants.map((p) => p.uid));
      }
      if (splitType === "percentage") {
        const percentages: Record<string, number> = {};
        includedParticipants.forEach((p) => {
          percentages[p.uid] = parsePercentage(percentInputs[p.uid] ?? "") ?? 0;
        });
        return splitByPercentage(amountCents, percentages);
      }
      const amounts: Record<string, number> = {};
      includedParticipants.forEach((p) => {
        amounts[p.uid] = parseAmountToCents(exactInputs[p.uid] ?? "") ?? 0;
      });
      validateExactSplit(amountCents, amounts);
      return amounts;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid split.");
      return null;
    }
  }

  async function handleSave() {
    if (!me) return;
    setError(null);

    if (!description.trim()) {
      setError("Enter a description.");
      return;
    }

    const splits = computeFinalSplits();
    if (!splits) return;

    setSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(
          editingExpense.id,
          {
            description: description.trim(),
            amountCents: amountCents as number,
            paidBy: effectivePaidBy,
            splitType,
            splits,
            expenseDate,
          },
          me,
          editingExpense.groupId,
          group?.name,
        );
      } else {
        await createExpense({
          description: description.trim(),
          amountCents: amountCents as number,
          paidBy: effectivePaidBy,
          splitType,
          splits,
          groupId: group ? group.id : null,
          creator: me,
          groupName: group?.name,
          expenseDate,
        });
      }
      router.back();
    } catch (err) {
      logError(err, { screen: "add-expense", action: editingExpense ? "update" : "create" });
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="Description"
          placeholder="e.g. Dinner"
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.amountBlock}>
          <AppText variant="label" color="textMuted">
            TOTAL AMOUNT
          </AppText>
          <View style={styles.amountRow}>
            <AppText style={styles.currency}>$</AppText>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
            />
          </View>
        </View>

        <View style={styles.field}>
          <AppText variant="label" color="textMuted">
            DATE
          </AppText>
          <DateField value={expenseDate} onChange={setExpenseDate} />
        </View>

        <View style={styles.field}>
          <AppText variant="label" color="textMuted">
            PAID BY
          </AppText>
          <View style={styles.chipRow}>
            {includedParticipants.map((p) => {
              const selected = p.uid === effectivePaidBy;
              return (
                <Pressable
                  key={p.uid}
                  onPress={() => setPaidBy(p.uid)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <AppText
                    variant="bodySemibold"
                    color={selected ? "onPrimary" : "textMuted"}>
                    {p.uid === me?.uid ? "You" : p.displayName || p.email}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <AppText variant="label" color="textMuted">
            SPLIT
          </AppText>
          <SegmentedControl options={SPLIT_TYPES} value={splitType} onChange={setSplitType} />
        </View>

        <Card padded={false}>
          {allParticipants.map((p, i) => {
            const included = effectiveIncluded.has(p.uid);
            const label = p.uid === me?.uid ? "You" : p.displayName || p.email;
            return (
              <View key={p.uid} style={[styles.participantRow, i > 0 && styles.rowDivider]}>
                <Pressable style={styles.participantToggle} onPress={() => toggleIncluded(p.uid)}>
                  <MaterialIcons
                    name={included ? "check-box" : "check-box-outline-blank"}
                    size={22}
                    color={included ? colors.primary : colors.borderStrong}
                  />
                  <Avatar name={label} size={32} />
                  <AppText variant="bodySemibold" numberOfLines={1} style={styles.participantName}>
                    {label}
                  </AppText>
                </Pressable>

                {included && splitType === "equal" && equalPreview && (
                  <AppText variant="bodySemibold" color="textMuted">
                    {formatCents(equalPreview[p.uid] ?? 0)}
                  </AppText>
                )}
                {included && splitType === "percentage" && (
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="decimal-pad"
                    placeholder="%"
                    placeholderTextColor={colors.textFaint}
                    value={percentInputs[p.uid] ?? ""}
                    onChangeText={(v) => setPercentInputs((prev) => ({ ...prev, [p.uid]: v }))}
                  />
                )}
                {included && splitType === "exact" && (
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="decimal-pad"
                    placeholder="$"
                    placeholderTextColor={colors.textFaint}
                    value={exactInputs[p.uid] ?? ""}
                    onChangeText={(v) => setExactInputs((prev) => ({ ...prev, [p.uid]: v }))}
                  />
                )}
              </View>
            );
          })}
        </Card>

        {splitType === "percentage" && (
          <AppText
            variant="body"
            color={Math.abs(percentTotal - 100) > 0.01 ? "negative" : "textMuted"}
            style={styles.totalHint}>
            Total: {percentTotal.toFixed(2)}% of 100%
          </AppText>
        )}
        {splitType === "exact" && amountCents && (
          <AppText
            variant="body"
            color={exactTotalCents !== amountCents ? "negative" : "textMuted"}
            style={styles.totalHint}>
            Total: {formatCents(exactTotalCents)} of {formatCents(amountCents)}
          </AppText>
        )}

        {error && (
          <AppText variant="body" color="negative">
            {error}
          </AppText>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? "Saving…" : isEditMode ? "Save changes" : "Save expense"}
          full
          loading={saving}
          onPress={handleSave}
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
    padding: spacing.lg,
    paddingBottom: 96,
    gap: spacing.gutter,
    ...centeredContent,
  },
  field: {
    gap: spacing.xs,
  },
  amountBlock: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  currency: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary,
    marginTop: 8,
  },
  amountInput: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 48,
    color: colors.primary,
    minWidth: 120,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    padding: 0,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSunken,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  participantToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  participantName: {
    flex: 1,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 76,
    textAlign: "right",
    textAlignVertical: "center",
    includeFontPadding: false,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  totalHint: {
    textAlign: "right",
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
