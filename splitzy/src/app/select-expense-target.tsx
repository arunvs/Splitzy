import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { centeredContent } from "@/constants/layout";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useGroups } from "@/hooks/use-groups";

export default function SelectExpenseTargetScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const { groups } = useGroups(user?.uid);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>Who&apos;s this expense with?</Text>

      <Text style={styles.sectionLabel}>Groups</Text>
      {groups.length === 0 ? (
        <Text style={styles.emptyText}>No groups yet.</Text>
      ) : (
        groups.map((group) => (
          <Pressable
            key={group.id}
            style={styles.row}
            onPress={() => router.push({ pathname: "/add-expense", params: { groupId: group.id } })}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="group" size={20} color="#2f6feb" />
            </View>
            <Text style={styles.rowText}>{group.name}</Text>
            <MaterialIcons name="chevron-right" size={22} color="#bbb" />
          </Pressable>
        ))
      )}

      <Text style={styles.sectionLabel}>Friends</Text>
      {friends.length === 0 ? (
        <Text style={styles.emptyText}>No friends yet.</Text>
      ) : (
        friends.map((friend) => (
          <Pressable
            key={friend.uid}
            style={styles.row}
            onPress={() => router.push({ pathname: "/add-expense", params: { friendUid: friend.uid } })}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="account-circle" size={20} color="#2f6feb" />
            </View>
            <Text style={styles.rowText}>{friend.displayName || friend.email}</Text>
            <MaterialIcons name="chevron-right" size={22} color="#bbb" />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    ...centeredContent,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8effd",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});
