import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { DateField } from "@/components/date-field";
import { AppText, Avatar, FormField, PrimaryButton, SegmentedControl } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { createSettlement } from "@/lib/expenses";
import { logError } from "@/lib/log-error";
import { formatCents, parseAmountToCents } from "@/lib/money";

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
  const [payer, setPayer] = useState<"you" | "them">(balance < 0 ? "you" : "them");
  const [amountInput, setAmountInput] = useState(balance ? (Math.abs(balance) / 100).toFixed(2) : "");
  const [settleDate, setSettleDate] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const friendName = friend?.displayName || friend?.email || "them";
  const meName = user?.displayName || user?.email || "You";

  async function handleSave() {
    if (!user?.email || !friend) return;
    setError(null);

    const amountCents = parseAmountToCents(amountInput);
    if (!amountCents) {
      setError("Enter a valid amount.");
      return;
    }

    const me = { uid: user.uid, email: user.email, displayName: user.displayName ?? "" };
    const youPaid = payer === "you";
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

  const headline =
    balance === 0
      ? `Settle up with ${friendName}`
      : balance > 0
        ? `${friendName} owes you ${formatCents(balance)}`
        : `You owe ${friendName} ${formatCents(-balance)}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="title" style={styles.headline}>
        {headline}
      </AppText>

      <View style={styles.people}>
        <View style={styles.person}>
          <Avatar name={payer === "you" ? meName : friendName} size={56} />
          <AppText variant="label" color="textMuted">
            {payer === "you" ? "You" : friendName}
          </AppText>
        </View>
        <MaterialIcons name="arrow-forward" size={22} color={colors.primary} />
        <View style={styles.person}>
          <Avatar name={payer === "you" ? friendName : meName} size={56} />
          <AppText variant="label" color="textMuted">
            {payer === "you" ? friendName : "You"}
          </AppText>
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="label" color="textMuted">
          WHO PAID
        </AppText>
        <SegmentedControl
          value={payer}
          onChange={setPayer}
          options={[
            { value: "you", label: "You paid" },
            { value: "them", label: `${friendName} paid` },
          ]}
        />
      </View>

      <FormField
        label="Amount"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amountInput}
        onChangeText={setAmountInput}
        error={error}
      />

      <View style={styles.field}>
        <AppText variant="label" color="textMuted">
          DATE
        </AppText>
        <DateField value={settleDate} onChange={setSettleDate} />
      </View>

      <PrimaryButton
        label={saving ? "Saving…" : "Mark as settled"}
        full
        loading={saving}
        onPress={handleSave}
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.gutter,
    ...centeredContent,
  },
  headline: {
    textAlign: "center",
  },
  people: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  person: {
    alignItems: "center",
    gap: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
