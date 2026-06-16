import { useAuthStore } from "@loan/core";
import { colors, fonts, spacing } from "@loan/ui";
import { Tabs } from "expo-router";
import { Archive, LayoutDashboard, LogOut } from "lucide-react-native";
import { Pressable } from "react-native";

function SignOutButton() {
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <Pressable
      onPress={() => signOut()}
      hitSlop={8}
      style={{ paddingHorizontal: spacing.lg }}
    >
      <LogOut size={20} color={colors.textMuted} />
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <SignOutButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size ?? 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: "Archive",
          tabBarIcon: ({ color, size }) => (
            <Archive color={color} size={size ?? 22} />
          ),
        }}
      />
    </Tabs>
  );
}
