import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function NotFound({
  title = "Nothing to split here",
  message = "This friend, group, or expense doesn't exist — or it's simply none of your business. Either way, there's nothing to see.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="sentiment-dissatisfied" size={72} color="#bbb" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {/* Expo Router's own guidance for +not-found screens specifically:
          use a Link back to "/", not the imperative router API — a
          +not-found screen isn't always mounted the same way a normal
          in-stack screen is, and router.replace() wasn't resolving there. */}
      <Link href="/" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Back to Splitzy</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
