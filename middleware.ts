import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers applied to every response.
 *
 * CSP notes: most pages here are statically prerendered, so a per-request nonce
 * can't be stamped onto Next's inline bootstrap scripts — that rules out
 * 'strict-dynamic' + nonce (it would blank the page). We instead allow scripts
 * from our own origin plus the small inline runtime scripts Next injects for
 * streaming/hydration. All app bundles load from 'self' (/_next/static).
 *
 * connect-src allows Supabase (REST + Realtime websockets), the production
 * backend. In local dev / CI the app only talks to its own origin; the extra
 * allowance is harmless and avoids a dev/prod policy split.
 */
export function middleware(_request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ].join("; ");

  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  // Run on everything except Next's static assets and the favicon, which don't
  // need dynamic headers and shouldn't pay the middleware cost.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
