"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/online/PageShell";
import { AftermathSim } from "@/components/AftermathSim";

export default function AftermathPage() {
  const [scenarioId, setScenarioId] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("scenario");
    setScenarioId(s ?? undefined);
    setReady(true);
  }, []);
  if (!ready) return <PageShell><div /></PageShell>;
  return (
    <PageShell>
      <AftermathSim initialScenarioId={scenarioId} />
    </PageShell>
  );
}
