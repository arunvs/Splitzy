import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { DateField } from "@/components/date-field";
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

  // In edit mode, the group/friend context comes from the expense itself
  // rather than route params, since it's already fixed for that expense.
  const effectiveGroupId = editingExpense ? editingExpense.groupId : params.groupId;
  const group = effectiveGroupId ? groups.find((g) => g.id === effectiveGroupId) : undefined;
  const effectiveFriendUid =
    editingExpense && !editingExpense.groupId
      ? editingExpense.participants.find((uid) => uid !== me?.uid)
      : params.friendUid;
  const friend = effectiveFriendUid ? friends.find((f) => f.uid === effectiveFriendUid) : undefined;

  useEffect(() => {
    navigation.setOptions({ title: isEditMode ? "Edit Expense" : "Add Expense" });
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

  const effectiveIncluded =
    includedUids ?? new Set(allParticipants.map((p) => p.uid));
  const includedParticipants = allParticipants.filter((p) => effectiveIncluded.has(p.uid));
  const effectivePaidBy = paidBy || me?.uid || "";
  const amountCents = parseAmountToCents(amountInput);

  function toggleIncluded(uid: string) {
    setIncludedUids(new Set([...effectiveIncluded].includes(uid)
      ? [...effectiveIncluded].filter((id) => id !== uid)
      : [...effectiveIncluded, uid]));
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="decimal-pad"
        value={amountInput}
        onChangeText={setAmountInput}
      />

      <Text style={styles.sectionLabel}>Date</Text>
      <DateField value={expenseDate} onChange={setExpenseDate} />

      <Text style={styles.sectionLabel}>Paid by</Text>
      <View style={styles.chipRow}>
        {includedParticipants.map((p) => {
          const selected = p.uid === effectivePaidBy;
          return (
            <Pressable
              key={p.uid}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setPaidBy(p.uid)}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {p.uid === me?.uid ? "You" : p.displayName || p.email}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Split</Text>
      <View style={styles.chipRow}>
        {SPLIT_TYPES.map((t) => {
          const selected = t.value === splitType;
          return (
            <Pressable
              key={t.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setSplitType(t.value)}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.participants}>
        {allParticipants.map((p) => {
          const included = effectiveIncluded.has(p.uid);
          const label = p.uid === me?.uid ? "You" : p.displayName || p.email;
          return (
            <View key={p.uid} style={styles.participantRow}>
              <Pressable
                style={styles.participantToggle}
                onPress={() => toggleIncluded(p.uid)}>
                <MaterialIcons
                  name={included ? "check-box" : "check-box-outline-blank"}
                  size={22}
                  color={included ? "#2f6feb" : "#bbb"}
                />
                <Text style={styles.participantName}>{label}</Text>
              </Pressable>

              {included && splitType === "equal" && equalPreview && (
                <Text style={styles.participantAmount}>
                  {formatCents(equalPreview[p.uid] ?? 0)}
                </Text>
              )}
              {included && splitType === "percentage" && (
                <TextInput
                  style={styles.smallInput}
                  keyboardType="decimal-pad"
                  placeholder="%"
                  value={percentInputs[p.uid] ?? ""}
                  onChangeText={(v) => setPercentInputs((prev) => ({ ...prev, [p.uid]: v }))}
                />
              )}
              {included && splitType === "exact" && (
                <TextInput
                  style={styles.smallInput}
                  keyboardType="decimal-pad"
                  placeholder="$"
                  value={exactInputs[p.uid] ?? ""}
                  onChangeText={(v) => setExactInputs((prev) => ({ ...prev, [p.uid]: v }))}
                />
              )}
            </View>
          );
        })}
      </View>

      {splitType === "percentage" && (
        <Text style={[styles.totalHint, Math.abs(percentTotal - 100) > 0.01 && styles.totalHintError]}>
          Total: {percentTotal.toFixed(2)}% of 100%
        </Text>
      )}
      {splitType === "exact" && amountCents && (
        <Text style={[styles.totalHint, exactTotalCents !== amountCents && styles.totalHintError]}>
          Total: {formatCents(exactTotalCents)} of {formatCents(amountCents)}
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveButton} disabled={saving} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : isEditMode ? "Save changes" : "Save expense"}
        </Text>
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
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: "#2f6feb",
    borderColor: "#2f6feb",
  },
  chipText: {
    fontSize: 13,
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  participants: {
    gap: 4,
    marginTop: 8,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  participantToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  participantName: {
    fontSize: 15,
  },
  participantAmount: {
    fontSize: 14,
    color: "#666",
  },
  smallInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 70,
    textAlign: "right",
  },
  totalHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  totalHintError: {
    color: "#d32f2f",
    fontWeight: "600",
  },
  error: {
    color: "#d32f2f",
  },
  saveButton: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
