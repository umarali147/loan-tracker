import type { AuthSession } from "@orbitnest/node";

/**
 * Platform-specific session storage. Web implements this over `localStorage`;
 * mobile over `expo-secure-store`. The auth store reads/writes through it so
 * the store itself stays platform-agnostic.
 */
export interface SessionPersistence {
  load(): Promise<AuthSession | null>;
  save(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
}
