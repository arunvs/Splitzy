import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuthState } from "@/hooks/use-auth-state";
import { useFriends } from "@/hooks/use-friends";
import { useMyExpenses } from "@/hooks/use-my-expenses";
import { computeBalancesByOtherUser, sumBalances } from "@/lib/expenses";
import { formatCents } from "@/lib/money";

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuthState();
  const { friends, loading } = useFriends(user?.uid);
  const { expenses } = useMyExpenses(user?.uid);
  const [search, setSearch] = useState("");

  const hasFriends = friends.length > 0;

  const balances = useMemo(() => {
    if (!user) return {};
    return computeBalancesByOtherUser(expenses, user.uid);
  }, [expenses, user]);

  const totalBalance = sumBalances(balances);

  const filteredFriends = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return friends;
    return friends.filter(
      (friend) =>
        friend.displayName.toLowerCase().includes(normalized) ||
        friend.email.toLowerCase().includes(normalized),
    );
  }, [friends, search]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>

      {!loading && !hasFriends && (
        <View style={styles.empty}>
          <MaterialIcons name="people-outline" size={64} color="#bbb" />
          <Text style={styles.emptyTitle}>No friends yet</Text>
          <Text style={styles.emptySubtitle}>
            Add a friend to start splitting expenses together.
          </Text>
          <Pressable style={styles.addButton} onPress={() => router.push("/add-friend")}>
            <Text style={styles.addButtonText}>Add a friend</Text>
          </Pressable>
        </View>
      )}

      {hasFriends && (
        <>
          {totalBalance !== 0 && (
            <View style={styles.summaryBanner}>
              <Text
                style={[
                  styles.summaryText,
                  totalBalance > 0 ? styles.owedToYou : styles.youOwe,
                ]}>
                {totalBalance > 0
                  ? `You are owed ${formatCents(totalBalance)} overall`
                  : `You owe ${formatCents(-totalBalance)} overall`}
              </Text>
            </View>
          )}

          <Pressable style={styles.addRow} onPress={() => router.push("/add-friend")}>
            <View style={styles.addIconCircle}>
              <MaterialIcons name="person-add" size={20} color="#2f6feb" />
            </View>
            <Text style={styles.addRowText}>Add friend</Text>
            <MaterialIcons name="chevron-right" size={22} color="#bbb" />
          </Pressable>

          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.noResults}>No friends match &quot;{search}&quot;.</Text>
            }
            renderItem={({ item }) => {
              const balance = balances[item.uid] ?? 0;
              return (
                <Pressable
                  style={styles.friendRow}
                  onPress={() => router.push(`/friend/${item.uid}`)}>
                  <MaterialIcons name="account-circle" size={40} color="#888" />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.displayName || item.email}</Text>
                    <Text style={styles.friendEmail}>{item.email}</Text>
                  </View>
                  <Text
                    style={[
                      styles.friendBalance,
                      balance > 0 ? styles.owedToYou : balance < 0 ? styles.youOwe : undefined,
                    ]}>
                    {balance === 0
                      ? "settled"
                      : balance > 0
                        ? `owes you ${formatCents(balance)}`
                        : `you owe ${formatCents(-balance)}`}
                  </Text>
                </Pressable>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  addButton: {
    backgroundColor: "#2f6feb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  summaryBanner: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  owedToYou: {
    color: "#2e7d32",
  },
  youOwe: {
    color: "#d32f2f",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 12,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8effd",
    alignItems: "center",
    justifyContent: "center",
  },
  addRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2f6feb",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  noResults: {
    textAlign: "center",
    color: "#888",
    marginTop: 24,
  },
  list: {
    gap: 4,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
  },
  friendEmail: {
    fontSize: 13,
    color: "#666",
  },
  friendBalance: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    maxWidth: 100,
    textAlign: "right",
  },
});
