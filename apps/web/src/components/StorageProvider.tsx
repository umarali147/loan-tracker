"use client";

import { useLoanStore } from "@loan/core";
import { useEffect, useState } from "react";
import { DexieStorageAdapter } from "@/lib/dexie-adapter";

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const initialized = useLoanStore((s) => s.initialized);

  useEffect(() => {
    const adapter = new DexieStorageAdapter();
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

  if (!ready && !initialized) {
    return (
      <div style={{ padding: 32, color: "#64748b" }}>Loading…</div>
    );
  }

  return <>{children}</>;
}
