import { useAuthStore } from "@loan/core";
import { colors, spacing } from "@loan/ui";
import { Tabs } from "expo-router";
import { Pressable, Text } from "react-native";

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{symbol}</Text>;
}

function SignOutButton() {
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <Pressable onPress={() => signOut()} style={{ paddingHorizontal: spacing.lg }}>
      <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>Sign out</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { fontWeight: "700" },
        headerRight: () => <SignOutButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabIcon symbol="◎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: "Archive",
          tabBarIcon: ({ color }) => <TabIcon symbol="✓" color={color} />,
        }}
      />
    </Tabs>
  );
}
