"use client";

import { useAuthStore } from "@loan/core";
import { useEffect } from "react";
import { orbitnest, webSessionPersistence } from "@/lib/orbitnest";
import { AuthForm } from "@/components/AuthForm";

/**
 * Configures the auth store, restores any saved session on mount, and gates
 * the app: unauthenticated users see the auth form; authenticated users see
 * the app (children).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    useAuthStore.getState().configure({
      client: orbitnest,
      persistence: webSessionPersistence,
    });
    useAuthStore.getState().hydrate();
  }, []);

  if (status === "loading") {
    return <div style={{ padding: 32, color: "#64748b" }}>Loading…</div>;
  }

  if (status !== "authenticated") {
    return <AuthForm />;
  }

  return <>{children}</>;
}
