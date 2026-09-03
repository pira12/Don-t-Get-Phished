/** @type {import('next').NextConfig} */

// Phase 2 runs as a Node server so the optional backend (auth, leaderboards, orgs,
// admin) is available via /api routes. The free, self-hosted default needs no
// database and no external services — the file-backed store (src/server/jsonRepository.ts)
// keeps everything in ./.data. The game itself stays fully offline-first: if the
// backend is ever unreachable, the UI degrades to guest-only solo play + duels.
//
// (The Phase 1 frontend-only static export lives at the `phase-1` git history;
// it can't co-exist with server route handlers.)
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
