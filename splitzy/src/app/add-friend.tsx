import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { centeredContent } from "@/constants/layout";
import { useAuthState } from "@/hooks/use-auth-state";
import { addFriend, findUserByEmail, isAlreadyFriend, type UserProfile } from "@/lib/friends";
import { shareInvite } from "@/lib/invite";
import { logError } from "@/lib/log-error";

type SearchResult =
  | { status: "idle" }
  | { status: "found"; user: UserProfile; alreadyFriend: boolean }
  | { status: "not-found" };

export default function AddFriendScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult>({ status: "idle" });
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  async function handleSearch() {
    if (!user?.email) return;
    const normalized = email.trim().toLowerCase();
    setError(null);
    setInviteStatus(null);
    setResult({ status: "idle" });

    if (!normalized) {
      setError("Enter an email address.");
      return;
    }
    if (normalized === user.email.toLowerCase()) {
      setError("That's your own email.");
      return;
    }

    setSearching(true);
    try {
      const found = await findUserByEmail(normalized);
      if (!found) {
        setResult({ status: "not-found" });
        return;
      }
      const already = await isAlreadyFriend(user.uid, found.uid);
      setResult({ status: "found", user: found, alreadyFriend: already });
    } catch (err) {
      logError(err, { screen: "add-friend", action: "search" });
      setError("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAddFriend(friend: UserProfile) {
    if (!user?.email) return;
    setAdding(true);
    setError(null);
    try {
      await addFriend(
        { uid: user.uid, email: user.email, displayName: user.displayName ?? "" },
        friend,
      );
      router.back();
    } catch (err) {
      logError(err, { screen: "add-friend", action: "add" });
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleInvite() {
    const outcome = await shareInvite();
    if (outcome === "copied") {
      setInviteStatus("Invite message copied to clipboard.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Friend&apos;s email</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="friend@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.searchButton} disabled={searching} onPress={handleSearch}>
          {searching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {result.status === "found" && (
        <View style={styles.card}>
          <Text style={styles.cardName}>{result.user.displayName || result.user.email}</Text>
          <Text style={styles.cardEmail}>{result.user.email}</Text>
          {result.alreadyFriend ? (
            <Text style={styles.alreadyFriend}>Already in your friends list.</Text>
          ) : (
            <Pressable
              style={styles.primaryButton}
              disabled={adding}
              onPress={() => handleAddFriend(result.user)}>
              <Text style={styles.primaryButtonText}>{adding ? "Adding..." : "Add friend"}</Text>
            </Pressable>
          )}
        </View>
      )}

      {result.status === "not-found" && (
        <View style={styles.card}>
          <Text style={styles.cardName}>No Splitzy account with that email</Text>
          <Text style={styles.cardEmail}>Invite them to join instead.</Text>
          <Pressable style={styles.primaryButton} onPress={handleInvite}>
            <Text style={styles.primaryButtonText}>Invite to Splitzy</Text>
          </Pressable>
          {inviteStatus && <Text style={styles.inviteStatus}>{inviteStatus}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    ...centeredContent,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchButton: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#d32f2f",
    marginTop: 12,
  },
  card: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 16,
    gap: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  alreadyFriend: {
    color: "#888",
    fontStyle: "italic",
  },
  inviteStatus: {
    color: "#2f6feb",
    marginTop: 8,
    textAlign: "center",
  },
});
