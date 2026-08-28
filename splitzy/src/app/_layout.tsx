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
        <Stack.Screen name="friend/[uid]" options={{ title: "Friend" }} />
        <Stack.Screen name="group/[groupId]" options={{ title: "Group" }} />
        <Stack.Screen name="expense/[expenseId]" options={{ title: "Expense" }} />
        <Stack.Screen
          name="manage-members"
          options={{ presentation: "modal", title: "Manage Members" }}
        />
      </Stack.Protected>
    </Stack>
  );
}
