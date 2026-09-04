/**
 * Central runtime configuration. The app is a hosted SaaS: production uses
 * Supabase (Postgres + Auth + email). When Supabase env vars are absent — local
 * dev and CI — it falls back to the zero-config file store + dev magic-link so the
 * app still builds, tests, and runs without any external service.
 */

export const isProd = process.env.NODE_ENV === "production";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** True when enough Supabase config is present to use it as the backend. */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Which datastore backs this instance. Override with DATABASE_DRIVER for testing. */
export const databaseDriver: "supabase" | "json" =
  (process.env.DATABASE_DRIVER as "supabase" | "json") ||
  (supabaseConfigured ? "supabase" : "json");

/** Which auth provider is active. Supabase in prod; a dev magic-link locally. */
export const authProvider: "supabase" | "dev" = supabaseConfigured ? "supabase" : "dev";
