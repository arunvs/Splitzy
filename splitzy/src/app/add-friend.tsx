import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Avatar, Card, FormField, PrimaryButton } from "@/components/ui";
import { centeredContent } from "@/constants/layout";
import { spacing } from "@/constants/theme";
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
      await addFriend({ uid: user.uid, email: user.email, displayName: user.displayName ?? "" }, friend);
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
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <FormField
            label="Friend's email"
            placeholder="friend@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSearch}
            error={error}
          />
        </View>
        <PrimaryButton
          label="Search"
          loading={searching}
          onPress={handleSearch}
          style={styles.searchButton}
        />
      </View>

      {result.status === "found" && (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Avatar name={result.user.displayName || result.user.email} size={44} />
            <View style={styles.resultInfo}>
              <AppText variant="bodyLgSemibold" numberOfLines={1}>
                {result.user.displayName || result.user.email}
              </AppText>
              <AppText variant="body" color="textMuted" numberOfLines={1}>
                {result.user.email}
              </AppText>
            </View>
          </View>
          {result.alreadyFriend ? (
            <AppText variant="body" color="textFaint">
              Already in your friends list.
            </AppText>
          ) : (
            <PrimaryButton
              label={adding ? "Adding…" : "Add friend"}
              icon="person-add"
              full
              loading={adding}
              onPress={() => handleAddFriend(result.user)}
            />
          )}
        </Card>
      )}

      {result.status === "not-found" && (
        <Card style={styles.resultCard}>
          <AppText variant="bodyLgSemibold">No Splitzy account with that email</AppText>
          <AppText variant="body" color="textMuted">
            Invite them to join instead.
          </AppText>
          <PrimaryButton label="Invite to Splitzy" icon="share" variant="tonal" full onPress={handleInvite} />
          {inviteStatus && (
            <AppText variant="body" color="primary" style={styles.inviteStatus}>
              {inviteStatus}
            </AppText>
          )}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.gutter,
    ...centeredContent,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  searchField: {
    flex: 1,
  },
  searchButton: {
    marginTop: 20,
  },
  resultCard: {
    gap: spacing.md,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  inviteStatus: {
    textAlign: "center",
  },
});
