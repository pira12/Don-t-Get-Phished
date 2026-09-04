import { Suspense } from "react";
import { PageShell } from "@/components/online/PageShell";
import { TrainView } from "@/components/scenarios/TrainView";

export const metadata = {
  title: "Practice all channels · Don't Get Phished",
};

export default function TrainPage() {
  return (
    <PageShell>
      <Suspense fallback={null}>
        <TrainView />
      </Suspense>
    </PageShell>
  );
}
