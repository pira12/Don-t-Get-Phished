/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Phase 1 ships as a fully static site (no backend). `next build` emits `out/`,
  // deployable to any static host (GitHub Pages, Netlify, S3, Vercel...).
  // Phase 2 can drop this line to re-enable server routes for the hosted backend.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
