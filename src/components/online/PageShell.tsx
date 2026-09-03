"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { loadStats } from "@/game/storage";

/** Shared chrome for the online pages: the realistic top bar (with the account
 * menu) above the page content. */
export function PageShell({ children }: { children: React.ReactNode }) {
  const [handle, setHandle] = useState("");
  useEffect(() => setHandle(loadStats().handle), []);
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas text-ink">
      <TopBar handle={handle} onShortcuts={() => {}} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
