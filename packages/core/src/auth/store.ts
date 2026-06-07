import { create } from "zustand";
import type { ApiResult, AuthSession, AuthUser, OrbitNestClient } from "@orbitnest/node";
import type { SessionPersistence } from "./persistence";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface SignUpResult {
  /** True when the backend requires OTP verification before the account is usable. */
  needsVerification: boolean;
}

interface AuthStoreState {
  client: OrbitNestClient | null;
  persistence: SessionPersistence | null;

  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  submitting: boolean;
  /** Email awaiting OTP verification after signUp (when verification is required). */
  pendingEmail: string | null;

  configure: (opts: { client: OrbitNestClient; persistence: SessionPersistence }) => void;
  hydrate: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<SignUpResult>;
  verifySignUp: (code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

function requireConfigured(s: AuthStoreState): {
  client: OrbitNestClient;
  persistence: SessionPersistence;
} {
  if (!s.client || !s.persistence) {
    throw new Error("Auth store not configured. Call configure() first.");
  }
  return { client: s.client, persistence: s.persistence };
}

/** A signup/signin response carries a session only when it includes tokens. */
function isSession(data: unknown): data is AuthSession {
  return (
    !!data &&
    typeof data === "object" &&
    typeof (data as { access_token?: unknown }).access_token === "string"
  );
}

/** Pull a human message out of an ApiResult error or thrown value. */
function messageFrom(result: ApiResult<unknown>): string {
  return result.error?.message ?? "Something went wrong. Please try again.";
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Something went wrong. Please try again.";
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  client: null,
  persistence: null,
  status: "loading",
  user: null,
  error: null,
  submitting: false,
  pendingEmail: null,

  configure: ({ client, persistence }) => set({ client, persistence }),

  clearError: () => set({ error: null }),

  hydrate: async () => {
    const { client, persistence } = requireConfigured(get());
    set({ status: "loading", error: null });
    const stored = await persistence.load();
    if (!stored) {
      set({ status: "unauthenticated", user: null });
      return;
    }
    client.auth.setSession(stored);
    // Rotate the (15-minute) access token using the stored refresh token.
    const refreshed = await client.auth.refreshSession();
    if (refreshed.data) {
      await persistence.save(refreshed.data);
      set({ status: "authenticated", user: refreshed.data.user });
      return;
    }
    // A 401 means the refresh token is dead — sign out. A network error
    // shouldn't nuke the session, so keep the stored user optimistically.
    if (refreshed.error?.status === 401 || refreshed.error?.code === "NO_SESSION") {
      await persistence.clear();
      set({ status: "unauthenticated", user: null });
    } else {
      set({ status: "authenticated", user: stored.user });
    }
  },

  signUp: async (email, password, metadata) => {
    const { client, persistence } = requireConfigured(get());
    set({ submitting: true, error: null });
    try {
      const res = await client.auth.signUp({ email, password, metadata });
      if (res.error) {
        set({ submitting: false, error: messageFrom(res) });
        throw new Error(messageFrom(res));
      }
      // When email verification is disabled the backend returns a session
      // straight away; otherwise it returns an OTP-confirmation payload.
      if (isSession(res.data)) {
        await persistence.save(res.data);
        set({
          submitting: false,
          status: "authenticated",
          user: res.data.user,
          pendingEmail: null,
        });
        return { needsVerification: false };
      }
      set({ submitting: false, pendingEmail: email });
      return { needsVerification: true };
    } catch (err) {
      set({ submitting: false, error: toMessage(err) });
      throw err;
    }
  },

  verifySignUp: async (code) => {
    const { client, persistence } = requireConfigured(get());
    const email = get().pendingEmail;
    if (!email) throw new Error("No signup in progress.");
    set({ submitting: true, error: null });
    try {
      const res = await client.auth.verifySignUp({ email, code });
      if (res.error || !res.data) {
        set({ submitting: false, error: messageFrom(res) });
        throw new Error(messageFrom(res));
      }
      await persistence.save(res.data);
      set({
        submitting: false,
        status: "authenticated",
        user: res.data.user,
        pendingEmail: null,
      });
    } catch (err) {
      set({ submitting: false, error: toMessage(err) });
      throw err;
    }
  },

  signIn: async (email, password) => {
    const { client, persistence } = requireConfigured(get());
    set({ submitting: true, error: null });
    try {
      const res = await client.auth.signIn({ email, password });
      if (res.error || !res.data) {
        set({ submitting: false, error: messageFrom(res) });
        throw new Error(messageFrom(res));
      }
      await persistence.save(res.data);
      set({
        submitting: false,
        status: "authenticated",
        user: res.data.user,
        pendingEmail: null,
      });
    } catch (err) {
      set({ submitting: false, error: toMessage(err) });
      throw err;
    }
  },

  signOut: async () => {
    const { client, persistence } = requireConfigured(get());
    try {
      await client.auth.signOut();
    } catch {
      // Best-effort server signout; local clear below is what matters.
    }
    await persistence.clear();
    set({ status: "unauthenticated", user: null, pendingEmail: null, error: null });
  },
}));
