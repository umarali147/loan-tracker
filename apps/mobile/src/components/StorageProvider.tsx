import { OrbitNestStorageAdapter, useLoanStore } from "@loan/core";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@loan/ui";
import { type ReactNode, useEffect, useState } from "react";
import { orbitnest } from "../lib/orbitnest";

export function StorageProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const adapter = new OrbitNestStorageAdapter(
      orbitnest,
      () => orbitnest.auth.getSession()?.access_token,
    );
    useLoanStore.getState().setStorage(adapter);
    useLoanStore
      .getState()
      .loadAll()
      .then(() => setReady(true))
      .catch((err) => {
        console.error("Failed to initialize storage", err);
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
