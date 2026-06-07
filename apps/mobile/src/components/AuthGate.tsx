import { useAuthStore } from "@loan/core";
import { colors } from "@loan/ui";
import { type ReactNode, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { orbitnest, secureSessionPersistence } from "../lib/orbitnest";
import { AuthScreen } from "./AuthScreen";

/**
 * Configures the auth store, restores any saved session on mount, and gates
 * the app: unauthenticated users see the auth screen; authenticated users see
 * the app (children).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    useAuthStore.getState().configure({
      client: orbitnest,
      persistence: secureSessionPersistence,
    });
    useAuthStore.getState().hydrate();
  }, []);

  if (status === "loading") {
    return (
      <View style={center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status !== "authenticated") {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

const center = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.background,
} as const;
