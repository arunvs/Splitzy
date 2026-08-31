import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { DateField } from "@/components/date-field";
import { centeredContent } from "@/constants/layout";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { createSettlement } from "@/lib/expenses";
import { logError } from "@/lib/log-error";
import { parseAmountToCents } from "@/lib/money";

export default function SettleUpScreen() {
  const router = useRouter();
  const { friendUid, balance: balanceParam } = useLocalSearchParams<{
    friendUid: string;
    balance?: string;
  }>();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const friend = friends.find((f) => f.uid === friendUid);

  const balance = Number(balanceParam ?? 0);
  // balance > 0 means they owe you, so by default they're the one paying.
  const [youPaid, setYouPaid] = useState(balance < 0);
  const [amountInput, setAmountInput] = useState(
    balance ? (Math.abs(balance) / 100).toFixed(2) : "",
  );
  const [settleDate, setSettleDate] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user?.email || !friend) return;
    setError(null);

    const amountCents = parseAmountToCents(amountInput);
    if (!amountCents) {
      setError("Enter a valid amount.");
      return;
    }

    const me = { uid: user.uid, email: user.email, displayName: user.displayName ?? "" };
    setSaving(true);
    try {
      await createSettlement({
        payer: youPaid ? me : friend,
        recipient: youPaid ? friend : me,
        amountCents,
        expenseDate: settleDate,
        actor: me,
      });
      router.back();
    } catch (err) {
      logError(err, { screen: "settle-up", action: "create" });
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const friendName = friend?.displayName || friend?.email || "them";

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Record a payment to settle up with {friendName}.</Text>

      <Text style={styles.sectionLabel}>Who paid</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, youPaid && styles.chipSelected]}
          onPress={() => setYouPaid(true)}>
          <Text style={[styles.chipText, youPaid && styles.chipTextSelected]}>You paid</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, !youPaid && styles.chipSelected]}
          onPress={() => setYouPaid(false)}>
          <Text style={[styles.chipText, !youPaid && styles.chipTextSelected]}>
            {friendName} paid
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amountInput}
        onChangeText={setAmountInput}
      />

      <Text style={styles.sectionLabel}>Date</Text>
      <DateField value={settleDate} onChange={setSettleDate} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveButton} disabled={saving} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Record settlement"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 8,
    ...centeredContent,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
  },
  chipRow: {
    flexDirection: "row",
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: "#d32f2f",
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
