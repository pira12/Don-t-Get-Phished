/**
 * Supabase client factories (server-side only).
 *
 * Two clients, two jobs:
 *  - serverClient(): a cookie-bound SSR client used ONLY for auth — reading the
 *    signed-in user and running the email-OTP sign-in/verify/sign-out. It reads
 *    and writes the Supabase session cookies via next/headers.
 *  - serviceClient(): the service-role client the Repository uses for all data.
 *    It bypasses RLS by design: every /api route already enforces its own authz
 *    (currentUser + membership/role checks), and the browser never talks to
 *    Postgres directly. RLS is enabled on every table as defense-in-depth.
 *
 * Importing this module without Supabase configured throws — callers must gate on
 * `supabaseConfigured` (they do, via config.ts driver/authProvider selection).
 */

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseServiceKey, supabaseUrl } from "./config";

function assertConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  }
}

/** Cookie-bound client for auth. Safe to call per-request in route handlers. */
export function serverClient(): SupabaseClient {
  assertConfigured();
  const store = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          store.set({ name, value, ...options });
        } catch {
          // Called from a Server Component render (read-only cookies) — ignore.
          // Session refresh still happens in route handlers where set() works.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          store.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          /* read-only context */
        }
      },
    },
  });
}

let _service: SupabaseClient | null = null;

/** Service-role client for Repository data access. Bypasses RLS; never exposed to
 * the browser. Cached across invocations. */
export function serviceClient(): SupabaseClient {
  assertConfigured();
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the Supabase datastore driver.");
  }
  if (_service) return _service;
  _service = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _service;
}
