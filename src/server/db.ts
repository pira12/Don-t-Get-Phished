/**
 * Datastore selection. Defaults to the free, self-hosted, file-backed repository.
 * Set DATABASE_DRIVER=prisma (with DATABASE_URL) to use a Prisma/Postgres
 * implementation — the enterprise, self-controlled path. The rest of the app only
 * ever talks to the Repository interface, so nothing else changes.
 */

import type { Repository } from "./repository";
import { jsonRepository } from "./jsonRepository";

let repo: Repository = jsonRepository;

if (process.env.DATABASE_DRIVER === "prisma") {
  // Lazy, optional: only loaded when explicitly enabled so the default build has
  // zero Prisma/Postgres dependency. See prisma/schema.prisma and
  // src/server/prismaRepository.ts (implement to enable).
  try {

    const mod = require("./prismaRepository") as { prismaRepository: Repository };
    repo = mod.prismaRepository;
  } catch {
    console.warn(
      "[izd] DATABASE_DRIVER=prisma but prismaRepository is not available; falling back to the file store.",
    );
  }
}

export const db: Repository = repo;
