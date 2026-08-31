import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppText, FormField, PrimaryButton, Screen } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, fonts, radius, spacing, webInputReset } from "@/constants/theme";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err, { screen: "login" }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="displayCurrency" color="primary" style={styles.brand}>
          Splitzy
        </AppText>

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
          <Pressable
            onPress={() => router.push("/forgot-password")}
            hitSlop={6}
            style={styles.forgotRow}>
            <AppText variant="body" color="primary">
              Forgot password?
            </AppText>
          </Pressable>
        </View>

        {error && (
          <AppText variant="body" color="negative">
            {error}
          </AppText>
        )}

        <PrimaryButton
          label={submitting ? "Logging in…" : "Log in"}
          full
          loading={submitting}
          onPress={handleLogin}
          style={styles.submit}
        />

        <Pressable onPress={() => router.push("/register")} style={styles.linkRow}>
          <AppText variant="body" color="primary">
            Don&apos;t have an account? Sign up
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
  brand: {
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
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
