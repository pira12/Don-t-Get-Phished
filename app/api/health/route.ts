import { NextResponse } from "next/server";
import { activeDriver } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness/readiness probe for the host (uptime checks, load balancers). */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    driver: activeDriver,
    time: new Date().toISOString(),
  });
}
