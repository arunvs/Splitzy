import { Stack } from "expo-router";

import { useAuthState } from "@/hooks/use-auth-state";

export default function RootLayout() {
  const { user, initializing } = useAuthState();

  if (initializing) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-friend" options={{ presentation: "modal", title: "Add Friend" }} />
        <Stack.Screen
          name="create-group"
          options={{ presentation: "modal", title: "Create Group" }}
        />
        <Stack.Screen
          name="add-expense"
          options={{ presentation: "modal", title: "Add Expense" }}
        />
        <Stack.Screen
          name="select-expense-target"
          options={{ presentation: "modal", title: "Add Expense" }}
        />
        <Stack.Screen
          name="settle-up"
          options={{ presentation: "modal", title: "Settle Up" }}
        />
        <Stack.Screen name="friend/[uid]" options={{ title: "Friend" }} />
        <Stack.Screen name="group/[groupId]" options={{ title: "Group" }} />
        <Stack.Screen name="expense/[expenseId]" options={{ title: "Expense" }} />
        <Stack.Screen
          name="manage-members"
          options={{ presentation: "modal", title: "Manage Members" }}
        />
      </Stack.Protected>

      {/* Public — reachable whether signed in or not, e.g. from a Play Store
          listing before anyone has an account. Registered last, and outside
          both guards, so it's never a candidate "default" screen during the
          auth-state transition when Stack.Protected flips which group is
          active (that's what was sending people here right after login). */}
      <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="support" options={{ title: "Support" }} />
    </Stack>
  );
}
