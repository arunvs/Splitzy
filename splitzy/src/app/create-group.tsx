import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Avatar, Card, FormField, PrimaryButton } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { createGroup } from "@/lib/groups";
import { shareInvite } from "@/lib/invite";
import { logError } from "@/lib/log-error";
import type { UserProfile } from "@/lib/types";

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { friends } = useFriends(user?.uid);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  function toggleMember(uid: string) {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleInvite() {
    const outcome = await shareInvite();
    if (outcome === "copied") {
      setInviteStatus("Invite message copied to clipboard.");
    }
  }

  async function handleCreate() {
    if (!user?.email) return;
    setError(null);

    if (!name.trim()) {
      setError("Enter a group name.");
      return;
    }

    setCreating(true);
    try {
      const members: UserProfile[] = friends.filter((f) => selectedUids.has(f.uid));
      await createGroup(
        { uid: user.uid, email: user.email, displayName: user.displayName ?? "" },
        name.trim(),
        description.trim(),
        members,
      );
      router.back();
    } catch (err) {
      logError(err, { screen: "create-group", action: "create" });
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FormField
        label="Group name"
        placeholder="Weekend trip"
        value={name}
        onChangeText={setName}
        error={error}
      />
      <FormField
        label="Description (optional)"
        placeholder="What's this group for?"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
        ADD FRIENDS
      </AppText>

      {friends.length === 0 ? (
        <AppText variant="body" color="textFaint">
          You don&apos;t have any friends yet — add some first, or invite someone new below.
        </AppText>
      ) : (
        <Card padded={false}>
          {friends.map((friend, i) => {
            const selected = selectedUids.has(friend.uid);
            return (
              <Pressable
                key={friend.uid}
                onPress={() => toggleMember(friend.uid)}
                style={[styles.friendRow, i > 0 && styles.rowDivider]}>
                <MaterialIcons
                  name={selected ? "check-box" : "check-box-outline-blank"}
                  size={22}
                  color={selected ? colors.primary : colors.borderStrong}
                />
                <Avatar name={friend.displayName || friend.email} size={36} />
                <View style={styles.friendInfo}>
                  <AppText variant="bodySemibold" numberOfLines={1}>
                    {friend.displayName || friend.email}
                  </AppText>
                  <AppText variant="body" color="textMuted" numberOfLines={1}>
                    {friend.email}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
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

      <PrimaryButton
        label={creating ? "Creating…" : "Create group"}
        full
        loading={creating}
        onPress={handleCreate}
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.gutter,
    ...centeredContent,
  },
  sectionLabel: {
    marginTop: spacing.xs,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
