import { createClient, type OrbitNestClient } from "@orbitnest/node";

export interface OrbitNestClientConfig {
  /** Project anon key (the `v2:...` API key). */
  apiKey: string;
  /** API origin, e.g. `https://api.orbitnest.io`. Defaults to the SDK default. */
  baseUrl?: string;
  /**
   * Project slug, e.g. `loan_tracker`. Required because our anon key is not a
   * JWT, so the SDK can't auto-decode the slug from it.
   */
  projectSlug: string;
}

/**
 * Build the shared OrbitNest client. Centralised so web and mobile configure
 * it identically — they only differ in how the values reach the env.
 */
export function createOrbitNestClient(config: OrbitNestClientConfig): OrbitNestClient {
  if (!config.apiKey) {
    throw new Error(
      "OrbitNest: missing anon key. Set NEXT_PUBLIC_/EXPO_PUBLIC_ORBITNEST_ANON_KEY.",
    );
  }
  if (!config.projectSlug) {
    throw new Error(
      "OrbitNest: missing project slug. Set NEXT_PUBLIC_/EXPO_PUBLIC_ORBITNEST_PROJECT_SLUG.",
    );
  }
  return createClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    projectSlug: config.projectSlug,
  });
}

export type { OrbitNestClient };
