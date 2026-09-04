/** @type {import('next').NextConfig} */

// Runs as a Node server so the backend (auth, leaderboards, orgs, admin) is
// available via /api routes. In production the backend is Supabase (Postgres +
// Auth + email); for local dev / CI, with no Supabase env vars, it falls back to a
// zero-dependency file-backed store (src/server/jsonRepository.ts) so the app runs
// with no external services. The game itself stays fully offline-first: if the
// backend is ever unreachable, the UI degrades to guest-only solo play + duels.
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
