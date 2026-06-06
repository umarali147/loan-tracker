import { colors } from "@loan/ui";
import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { fontWeight: "700" },
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
