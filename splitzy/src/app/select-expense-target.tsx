import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Avatar, Card, IconBadge } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";
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
      <AppText variant="title">Who&apos;s this expense with?</AppText>

      <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
        GROUPS
      </AppText>
      {groups.length === 0 ? (
        <AppText variant="body" color="textFaint">
          No groups yet.
        </AppText>
      ) : (
        <View style={styles.group}>
          {groups.map((group) => (
            <Pressable
              key={group.id}
              onPress={() => router.push({ pathname: "/add-expense", params: { groupId: group.id } })}
              style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.row}>
                <IconBadge name="group" tone="primary" size={40} />
                <AppText variant="bodyLgSemibold" style={styles.rowText} numberOfLines={1}>
                  {group.name}
                </AppText>
                <MaterialIcons name="chevron-right" size={22} color={colors.textFaint} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
        FRIENDS
      </AppText>
      {friends.length === 0 ? (
        <AppText variant="body" color="textFaint">
          No friends yet.
        </AppText>
      ) : (
        <View style={styles.group}>
          {friends.map((friend) => (
            <Pressable
              key={friend.uid}
              onPress={() =>
                router.push({ pathname: "/add-expense", params: { friendUid: friend.uid } })
              }
              style={({ pressed }) => pressed && styles.pressed}>
              <Card style={styles.row}>
                <Avatar name={friend.displayName || friend.email} size={40} />
                <AppText variant="bodyLgSemibold" style={styles.rowText} numberOfLines={1}>
                  {friend.displayName || friend.email}
                </AppText>
                <MaterialIcons name="chevron-right" size={22} color={colors.textFaint} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    ...centeredContent,
  },
  sectionLabel: {
    marginTop: spacing.gutter,
  },
  group: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
