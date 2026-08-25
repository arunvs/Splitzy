import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { deleteUser, sendEmailVerification, signOut } from "firebase/auth";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
    Alert.alert(
      "Delete account",
      "This permanently deletes your account. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <MaterialIcons name="account-circle" size={80} color="#888" />
        <Text style={styles.name}>{user?.displayName || "Unnamed"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {user && !user.emailVerified && (
        <View style={styles.verifyBanner}>
          <View style={styles.verifyHeader}>
            <MaterialIcons name="warning" size={18} color="#a15c00" />
            <Text style={styles.verifyText}>
              {verificationSent
                ? "Verification email sent — check your inbox."
                : "Please verify your email address."}
            </Text>
          </View>
          <View style={styles.verifyActions}>
            <Pressable onPress={handleResendVerification} disabled={sendingVerification}>
              <Text style={styles.verifyLink}>
                {sendingVerification ? "Sending..." : "Resend email"}
              </Text>
            </Pressable>
            <Pressable onPress={handleCheckVerification} disabled={checkingVerification}>
              <Text style={styles.verifyLink}>
                {checkingVerification ? "Checking..." : "I've verified"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#2f6feb" />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} disabled={deleting} onPress={confirmDelete}>
        <Text style={styles.deleteText}>
          {deleting ? "Deleting account..." : "Delete account"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  profile: {
    alignItems: "center",
    gap: 4,
    marginBottom: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  verifyBanner: {
    backgroundColor: "#fff4e0",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  verifyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifyText: {
    flex: 1,
    color: "#7a4700",
  },
  verifyActions: {
    flexDirection: "row",
    gap: 20,
  },
  verifyLink: {
    color: "#2f6feb",
    fontWeight: "600",
  },
  error: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  logoutText: {
    color: "#2f6feb",
    fontWeight: "600",
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteText: {
    color: "#d32f2f",
  },
});
