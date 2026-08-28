import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { centeredContent } from "@/constants/layout";
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
      <View style={[styles.container, styles.content]}>
        <Text style={styles.emptyText}>Group not found.</Text>
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
      <Text style={styles.sectionLabel}>Current members</Text>
      {group.members.map((uid) => {
        const profile = group.memberProfiles[uid];
        const isMe = uid === user.uid;
        return (
          <View key={uid} style={styles.row}>
            <MaterialIcons name="account-circle" size={32} color="#888" />
            <Text style={styles.rowText}>
              {isMe ? "You" : profile?.displayName || profile?.email || uid}
            </Text>
            {!isMe && (
              <Pressable
                onPress={() => handleRemove(uid, profile?.displayName || profile?.email || uid)}
                disabled={busyUid === uid}
                hitSlop={8}>
                <MaterialIcons name="close" size={20} color="#d32f2f" />
              </Pressable>
            )}
          </View>
        );
      })}

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.sectionLabel}>Add friends</Text>
      {addableFriends.length === 0 ? (
        <Text style={styles.emptyText}>All your friends are already in this group.</Text>
      ) : (
        addableFriends.map((friend) => (
          <View key={friend.uid} style={styles.row}>
            <MaterialIcons name="account-circle" size={32} color="#888" />
            <Text style={styles.rowText}>{friend.displayName || friend.email}</Text>
            <Pressable onPress={() => handleAdd(friend)} disabled={busyUid === friend.uid} hitSlop={8}>
              <MaterialIcons name="add-circle-outline" size={22} color="#2f6feb" />
            </Pressable>
          </View>
        ))
      )}

      <Pressable style={styles.inviteRow} onPress={handleInvite}>
        <MaterialIcons name="person-add" size={18} color="#2f6feb" />
        <Text style={styles.inviteText}>Invite someone not on Splitzy yet</Text>
      </Pressable>
      {inviteStatus && <Text style={styles.inviteStatus}>{inviteStatus}</Text>}
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
  emptyText: {
    color: "#888",
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    color: "#d32f2f",
    marginTop: 8,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  inviteText: {
    color: "#2f6feb",
    fontWeight: "600",
  },
  inviteStatus: {
    color: "#2f6feb",
    fontSize: 12,
  },
});
