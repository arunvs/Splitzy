import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { centeredContent } from "@/constants/layout";
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
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Group name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.sectionLabel}>Add friends</Text>

      {friends.length === 0 ? (
        <Text style={styles.noFriends}>
          You don&apos;t have any friends yet — add some first, or invite someone new below.
        </Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.uid}
          style={styles.friendsList}
          renderItem={({ item }) => {
            const selected = selectedUids.has(item.uid);
            return (
              <Pressable style={styles.friendRow} onPress={() => toggleMember(item.uid)}>
                <MaterialIcons
                  name={selected ? "check-box" : "check-box-outline-blank"}
                  size={22}
                  color={selected ? "#2f6feb" : "#bbb"}
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{item.displayName || item.email}</Text>
                  <Text style={styles.friendEmail}>{item.email}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable style={styles.inviteRow} onPress={handleInvite}>
        <MaterialIcons name="person-add" size={18} color="#2f6feb" />
        <Text style={styles.inviteText}>Invite someone not on Splitzy yet</Text>
      </Pressable>
      {inviteStatus && <Text style={styles.inviteStatus}>{inviteStatus}</Text>}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.createButton} disabled={creating} onPress={handleCreate}>
        <Text style={styles.createButtonText}>{creating ? "Creating..." : "Create group"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    ...centeredContent,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
  },
  noFriends: {
    color: "#888",
    fontSize: 14,
  },
  friendsList: {
    maxHeight: 220,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "600",
  },
  friendEmail: {
    fontSize: 12,
    color: "#666",
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  inviteText: {
    color: "#2f6feb",
    fontWeight: "600",
  },
  inviteStatus: {
    color: "#2f6feb",
    fontSize: 12,
  },
  error: {
    color: "#d32f2f",
  },
  createButton: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
