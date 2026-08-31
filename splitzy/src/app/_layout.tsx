import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors, fonts } from "@/constants/theme";
import { useAuthState } from "@/hooks/use-auth-state";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { user, initializing } = useAuthState();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Hold the splash screen until auth has resolved AND fonts are ready (or
  // failed — a font error shouldn't wedge the app on the splash forever).
  const ready = !initializing && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-friend"
            options={{ presentation: "modal", title: "Add Friend" }}
          />
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
          <Stack.Screen name="settle-up" options={{ presentation: "modal", title: "Settle Up" }} />
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
    </SafeAreaProvider>
  );
}
