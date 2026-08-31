import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, FormField, PrimaryButton, Screen } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { spacing } from "@/constants/theme";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

function errorCode(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    const normalized = email.trim();
    setError(null);

    if (!normalized) {
      setError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalized);
      setSent(true);
    } catch (err) {
      // Don't reveal whether an account exists — treat "no such user" the
      // same as success.
      if (errorCode(err) === "auth/user-not-found") {
        setSent(true);
      } else {
        setError(getAuthErrorMessage(err, { screen: "forgot-password" }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="headlineLg" style={styles.title}>
          Reset password
        </AppText>

        {sent ? (
          <>
            <AppText variant="bodyLg" color="textMuted" style={styles.centered}>
              If an account exists for{" "}
              <AppText variant="bodyLgSemibold">{email.trim()}</AppText>, we&apos;ve sent a link to
              reset your password. Check your inbox and spam folder.
            </AppText>
            <PrimaryButton
              label="Back to log in"
              full
              onPress={() => router.back()}
              style={styles.submit}
            />
          </>
        ) : (
          <>
            <AppText variant="body" color="textMuted" style={styles.centered}>
              Enter the email you signed up with and we&apos;ll send you a link to set a new
              password.
            </AppText>

            <FormField
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handleSend}
              error={error}
            />

            <PrimaryButton
              label={submitting ? "Sending…" : "Send reset link"}
              full
              loading={submitting}
              onPress={handleSend}
              style={styles.submit}
            />

            <Pressable onPress={() => router.back()} style={styles.linkRow}>
              <AppText variant="body" color="primary">
                Back to log in
              </AppText>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.gutter,
    ...centeredContent,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  centered: {
    textAlign: "center",
  },
  submit: {
    marginTop: spacing.sm,
  },
  linkRow: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
});
