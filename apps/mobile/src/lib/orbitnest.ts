import {
  createOrbitNestClient,
  type AuthSession,
  type SessionPersistence,
} from "@loan/core";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "orbitnest_session";

/** Shared OrbitNest client, configured from public Expo env. */
export const orbitnest = createOrbitNestClient({
  apiKey: process.env.EXPO_PUBLIC_ORBITNEST_ANON_KEY ?? "",
  baseUrl: process.env.EXPO_PUBLIC_ORBITNEST_API_URL,
  projectSlug: process.env.EXPO_PUBLIC_ORBITNEST_PROJECT_SLUG ?? "",
});

/** Persist the session in the device keychain/keystore via expo-secure-store. */
export const secureSessionPersistence: SessionPersistence = {
  async load() {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
  },
  async save(session) {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  },
  async clear() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
