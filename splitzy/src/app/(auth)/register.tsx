import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { logSignedUpActivity } from "@/lib/activity";
import { centeredContent } from "@/constants/layout";
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

      // Best-effort: the account already exists at this point, so a failure
      // in either of these shouldn't block registration.
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
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={8}
          style={styles.eyeButton}>
          <MaterialIcons
            name={showPassword ? "visibility-off" : "visibility"}
            size={22}
            color="#666"
          />
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={styles.button}
        disabled={submitting}
        onPress={handleRegister}>
        <Text style={styles.buttonText}>{submitting ? "Creating account..." : "Sign up"}</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
    ...centeredContent,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#d32f2f",
  },
  link: {
    textAlign: "center",
    color: "#2f6feb",
    marginTop: 16,
  },
});
