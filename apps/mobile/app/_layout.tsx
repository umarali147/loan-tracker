import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthGate } from "../src/components/AuthGate";
import { StorageProvider } from "../src/components/StorageProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthGate>
        <StorageProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "#ffffff" },
              headerTitleStyle: { fontWeight: "700" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="loans/new" options={{ title: "New loan" }} />
            <Stack.Screen
              name="loans/[id]/index"
              options={{ title: "Loan" }}
            />
            <Stack.Screen
              name="loans/[id]/edit"
              options={{ title: "Edit loan" }}
            />
          </Stack>
        </StorageProvider>
      </AuthGate>
    </SafeAreaProvider>
  );
}
