import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
    <View style={styles.container}>
      <Text style={styles.title}>Splitzy</Text>

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
        onPress={handleLogin}>
        <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log in"}</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/register")}>
        <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
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
