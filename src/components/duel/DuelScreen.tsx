"use client";

import { useEffect, useState } from "react";
import { useDuel } from "@/hooks/useDuel";
import { store } from "@/game/store";
import { decodeChallenge, newChallenge, type DuelConfig } from "@/game/duel";
import { TopBar } from "@/components/TopBar";
import { DuelLobby } from "./DuelLobby";
import { DuelArena } from "./DuelArena";
import { DuelResult } from "./DuelResult";
import { OnlineDuel } from "./OnlineDuel";

export function DuelScreen() {
  const duel = useDuel();
  const [handle, setHandle] = useState("");
  const [incoming, setIncoming] = useState<DuelConfig | null>(null);
  const [origin, setOrigin] = useState("");
  const [online, setOnline] = useState<{ size: number; difficulty: DuelConfig["difficulty"] } | null>(null);

  useEffect(() => {
    setHandle(store.loadStats().handle);
    setOrigin(window.location.origin);
    const params = new URLSearchParams(window.location.search);
    const code = params.get("c");
    if (code) setIncoming(decodeChallenge(code));
  }, []);

  const onRematch = () => {
    const cfg = duel.config
      ? newChallenge(duel.config.size, duel.config.difficulty, handle)
      : newChallenge(7, "mixed", handle);
    duel.start(cfg, duel.botSkill, duel.opponentName);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas text-ink">
      <TopBar handle={handle} onShortcuts={() => {}} />
      <div className="min-h-0 flex-1 overflow-hidden">
        {online ? (
          <OnlineDuel
            you={handle}
            size={online.size}
            difficulty={online.difficulty}
            onPlayBot={() => {
              const cfg = newChallenge(online.size, online.difficulty, handle);
              setOnline(null);
              duel.start(cfg, duel.botSkill, duel.opponentName);
            }}
            onExit={() => setOnline(null)}
          />
        ) : (
          <>
            {duel.phase === "lobby" && (
              <DuelLobby
                duel={duel}
                you={handle}
                incoming={incoming}
                origin={origin}
                onFindOnline={(size) => setOnline({ size, difficulty: "mixed" })}
              />
            )}
            {duel.phase === "playing" && <DuelArena duel={duel} you={handle} />}
            {duel.phase === "result" && <DuelResult duel={duel} onRematch={onRematch} />}
          </>
        )}
      </div>
    </div>
  );
}
