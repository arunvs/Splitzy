import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Avatar, Card } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useGroups } from "@/hooks/use-groups";
import { addGroupMember, removeGroupMember } from "@/lib/groups";
import { shareInvite } from "@/lib/invite";
import { logError } from "@/lib/log-error";
import type { UserProfile } from "@/lib/types";

export default function ManageMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const { groups } = useGroups(user?.uid);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const group = groups.find((g) => g.id === groupId);

  if (!group || !user?.email) {
    return (
      <View style={styles.centered}>
        <AppText variant="body" color="textFaint">
          Group not found.
        </AppText>
      </View>
    );
  }

  const me: UserProfile = { uid: user.uid, email: user.email, displayName: user.displayName ?? "" };
  const addableFriends = friends.filter((f) => !group.members.includes(f.uid));

  async function handleRemove(memberUid: string, memberName: string) {
    if (!group) return;
    setError(null);
    setBusyUid(memberUid);
    try {
      await removeGroupMember(group, me, memberUid, memberName);
    } catch (err) {
      logError(err, { screen: "manage-members", action: "remove" });
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyUid(null);
    }
  }

  async function handleAdd(friend: UserProfile) {
    if (!group) return;
    setError(null);
    setBusyUid(friend.uid);
    try {
      await addGroupMember(group, me, friend);
    } catch (err) {
      logError(err, { screen: "manage-members", action: "add" });
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyUid(null);
    }
  }

  async function handleInvite() {
    const outcome = await shareInvite();
    if (outcome === "copied") {
      setInviteStatus("Invite message copied to clipboard.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="label" color="textMuted">
        CURRENT MEMBERS
      </AppText>
      <Card padded={false}>
        {group.members.map((uid, i) => {
          const profile = group.memberProfiles[uid];
          const isMe = uid === user.uid;
          const label = isMe ? "You" : profile?.displayName || profile?.email || uid;
          return (
            <View key={uid} style={[styles.row, i > 0 && styles.rowDivider]}>
              <Avatar name={label} size={36} />
              <AppText variant="bodySemibold" style={styles.rowText} numberOfLines={1}>
                {label}
              </AppText>
              {!isMe && (
                <Pressable
                  onPress={() => handleRemove(uid, profile?.displayName || profile?.email || uid)}
                  disabled={busyUid === uid}
                  hitSlop={8}>
                  <MaterialIcons name="close" size={20} color={colors.negative} />
                </Pressable>
              )}
            </View>
          );
        })}
      </Card>

      {error && (
        <AppText variant="body" color="negative">
          {error}
        </AppText>
      )}

      <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
        ADD FRIENDS
      </AppText>
      {addableFriends.length === 0 ? (
        <AppText variant="body" color="textFaint">
          All your friends are already in this group.
        </AppText>
      ) : (
        <Card padded={false}>
          {addableFriends.map((friend, i) => (
            <View key={friend.uid} style={[styles.row, i > 0 && styles.rowDivider]}>
              <Avatar name={friend.displayName || friend.email} size={36} />
              <AppText variant="bodySemibold" style={styles.rowText} numberOfLines={1}>
                {friend.displayName || friend.email}
              </AppText>
              <Pressable
                onPress={() => handleAdd(friend)}
                disabled={busyUid === friend.uid}
                hitSlop={8}>
                <MaterialIcons name="add-circle-outline" size={22} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <Pressable style={styles.inviteRow} onPress={handleInvite}>
        <MaterialIcons name="person-add" size={18} color={colors.primary} />
        <AppText variant="bodySemibold" color="primary">
          Invite someone not on Splitzy yet
        </AppText>
      </Pressable>
      {inviteStatus && (
        <AppText variant="body" color="primary">
          {inviteStatus}
        </AppText>
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
    gap: spacing.md,
    ...centeredContent,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
