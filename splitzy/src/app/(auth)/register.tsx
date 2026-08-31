import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppText, FormField, PrimaryButton, Screen } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, fonts, radius, spacing, webInputReset } from "@/constants/theme";
import { logSignedUpActivity } from "@/lib/activity";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import { logError } from "@/lib/log-error";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name.trim() });

      try {
        await sendEmailVerification(credential.user);
      } catch (verificationErr) {
        logError(verificationErr, { screen: "register", action: "send-verification" });
      }
      try {
        await logSignedUpActivity({
          uid: credential.user.uid,
          email: credential.user.email ?? email,
          displayName: name.trim(),
        });
      } catch (activityErr) {
        logError(activityErr, { screen: "register", action: "log-signup-activity" });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, { screen: "register" }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="headlineLg" style={styles.title}>
          Create account
        </AppText>

        <FormField
          label="Name"
          placeholder="Jane Doe"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
        <FormField
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.field}>
          <AppText variant="label" color="textMuted">
            PASSWORD
          </AppText>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.passwordInput, webInputReset]}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={22}
                color={colors.textFaint}
              />
            </Pressable>
          </View>
        </View>

        {error && (
          <AppText variant="body" color="negative">
            {error}
          </AppText>
        )}

        <PrimaryButton
          label={submitting ? "Creating account…" : "Sign up"}
          full
          loading={submitting}
          onPress={handleRegister}
          style={styles.submit}
        />

        <Pressable onPress={() => router.back()} style={styles.linkRow}>
          <AppText variant="body" color="primary">
            Already have an account? Log in
          </AppText>
        </Pressable>
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
    marginBottom: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  submit: {
    marginTop: spacing.sm,
  },
  linkRow: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
});
