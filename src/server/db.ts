/**
 * Datastore selection. Production uses Supabase (Postgres); local dev / CI use the
 * zero-config file store. Everything else in the app only ever talks to the
 * Repository interface, so switching drivers changes nothing downstream.
 */

import type { Repository } from "./repository";
import { jsonRepository } from "./jsonRepository";
import { databaseDriver } from "./config";

let repo: Repository = jsonRepository;
let resolved: "supabase" | "json" = "json";

if (databaseDriver === "supabase") {
  // Lazy, optional: only loaded when Supabase is configured, so the default build
  // has no hard dependency on a live project.
  try {

    const mod = require("./supabaseRepository") as { supabaseRepository: Repository };
    repo = mod.supabaseRepository;
    resolved = "supabase";
  } catch (e) {
    console.warn("[dgp] DATABASE_DRIVER=supabase but supabaseRepository is unavailable; using the file store.", e);
  }
}

export const db: Repository = repo;
export const activeDriver = resolved;
