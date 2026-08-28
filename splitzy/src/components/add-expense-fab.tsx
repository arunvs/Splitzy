import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet } from "react-native";

export function AddExpenseFab() {
  const router = useRouter();

  return (
    <Pressable style={styles.fab} onPress={() => router.push("/select-expense-target")}>
      <MaterialIcons name="receipt-long" size={24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2f6feb",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.3)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      },
    }),
  },
});
