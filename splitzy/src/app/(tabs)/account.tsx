import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { deleteUser, sendEmailVerification, signOut } from "firebase/auth";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { AppText, Avatar, Card, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

export default function AccountScreen() {
  const { user, refresh } = useAuthState();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  function handleLogout() {
    signOut(auth);
  }

  async function handleResendVerification() {
    if (!auth.currentUser) return;
    setError(null);
    setSendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, { screen: "account", action: "resend-verification" }));
    } finally {
      setSendingVerification(false);
    }
  }

  async function handleCheckVerification() {
    setCheckingVerification(true);
    await refresh();
    setCheckingVerification(false);
  }

  async function handleDelete() {
    if (!auth.currentUser) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteUser(auth.currentUser);
    } catch (err) {
      setError(getAuthErrorMessage(err, { screen: "account", action: "delete" }));
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete account", "This permanently deletes your account. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ]);
  }

  return (
    <Screen>
      <AppText variant="headlineLg" style={styles.title}>
        Account
      </AppText>

      <View style={styles.profile}>
        <Avatar name={user?.displayName || user?.email || "?"} size={88} />
        <AppText variant="title">{user?.displayName || "Unnamed"}</AppText>
        <AppText variant="body" color="textMuted">
          {user?.email}
        </AppText>
      </View>

      {user && !user.emailVerified && (
        <Card style={styles.verifyCard}>
          <View style={styles.verifyHeader}>
            <MaterialIcons name="mark-email-unread" size={18} color={colors.primary} />
            <AppText variant="bodySemibold" style={styles.verifyText}>
              {verificationSent
                ? "Verification email sent — check your inbox."
                : "Please verify your email address."}
            </AppText>
          </View>
          <View style={styles.verifyActions}>
            <Pressable onPress={handleResendVerification} disabled={sendingVerification} hitSlop={6}>
              <AppText variant="bodySemibold" color="primary">
                {sendingVerification ? "Sending…" : "Resend email"}
              </AppText>
            </Pressable>
            <Pressable onPress={handleCheckVerification} disabled={checkingVerification} hitSlop={6}>
              <AppText variant="bodySemibold" color="primary">
                {checkingVerification ? "Checking…" : "I've verified"}
              </AppText>
            </Pressable>
          </View>
        </Card>
      )}

      {error && (
        <AppText variant="body" color="negative" style={styles.error}>
          {error}
        </AppText>
      )}

      <View style={styles.actions}>
        <PrimaryButton label="Log out" icon="logout" variant="tonal" full onPress={handleLogout} />
        <PrimaryButton
          label={deleting ? "Deleting account…" : "Delete account"}
          variant="ghost"
          danger
          full
          disabled={deleting}
          onPress={confirmDelete}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  profile: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  verifyCard: {
    gap: spacing.md,
    borderRadius: radius.md,
  },
  verifyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  verifyText: {
    flex: 1,
  },
  verifyActions: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  error: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  actions: {
    marginTop: spacing.gutter,
    gap: spacing.sm,
  },
});
