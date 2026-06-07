import {
  createOrbitNestClient,
  type AuthSession,
  type SessionPersistence,
} from "@loan/core";

const SESSION_KEY = "orbitnest.session";

/** Shared OrbitNest client, configured from public env (browser-safe). */
export const orbitnest = createOrbitNestClient({
  apiKey: process.env.NEXT_PUBLIC_ORBITNEST_ANON_KEY ?? "",
  baseUrl: process.env.NEXT_PUBLIC_ORBITNEST_API_URL,
  projectSlug: process.env.NEXT_PUBLIC_ORBITNEST_PROJECT_SLUG ?? "",
});

/** Persist the session in localStorage (browser-only). */
export const webSessionPersistence: SessionPersistence = {
  async load() {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },
  async save(session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  async clear() {
    window.localStorage.removeItem(SESSION_KEY);
  },
};
