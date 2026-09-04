"use client";

import { useSearchParams } from "next/navigation";
import { Radar } from "lucide-react";
import type { Channel } from "@/game/types";
import { CHANNEL_ORDER } from "@/game/channels";
import { TOTAL_SCENARIOS, type ScenarioMode } from "@/hooks/useScenarioGame";
import { ScenarioArena } from "./ScenarioArena";

const NON_EMAIL: string[] = CHANNEL_ORDER.filter((c) => c !== "email");

/** Resolve the initial mode from a ?c= deep-link (channel name or "mixed"). */
function initialMode(param: string | null): ScenarioMode {
  if (param && param !== "mixed" && NON_EMAIL.includes(param)) {
    return { kind: "channel", channel: param as Exclude<Channel, "email"> };
  }
  return { kind: "mixed" };
}

export function TrainView() {
  const params = useSearchParams();
  const initial = initialMode(params.get("c"));

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-3 py-4 md:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Radar size={17} className="text-accent" aria-hidden /> Spot social engineering — every channel
          </div>
          <p className="text-[13px] text-ink-muted">
            Phishing isn&apos;t just email. Practise the same investigate → decide → act habit across text messages,
            phone calls, chat &amp; DMs, and QR codes &amp; fake login pages — or take a{" "}
            <strong>Mixed</strong> round that switches channel every scenario. {TOTAL_SCENARIOS} scenarios, all feeding
            one score and your stats.
          </p>
        </div>
      </div>
      <ScenarioArena initial={initial} />
    </div>
  );
}
