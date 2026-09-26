import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { simulateRisk, baseSimulatorFactors } from "@/services/api";
import { SectionHeader, ScoreRing, Panel } from "@/components/phish/primitives";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import type { SimulatorFactor, SimulationResult } from "@/lib/types";

export const Route = createFileRoute("/risk-simulator")({
  component: RiskSimulator,
});

function RiskSimulator() {
  const [factors, setFactors] = useState<SimulatorFactor[]>(baseSimulatorFactors);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const { mutate, error, isPending } = useMutation({
    mutationFn: (f: SimulatorFactor[]) => simulateRisk(f),
    onSuccess: (data) => setResult(data),
  });

  const toggleFactor = (index: number) => {
    const newFactors = [...factors];
    newFactors[index].enabled = !newFactors[index].enabled;
    setFactors(newFactors);
    mutate(newFactors);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Evaluation"
        title="Risk Simulator"
        description="Simulate phishing scenarios to understand risk scoring in Snowflake."
      />

      {error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-rose/30 bg-rose/10 p-6 text-rose">
          <AlertCircle className="mb-4 h-8 w-8" />
          <p className="font-semibold">Failed to simulate risk</p>
          <p className="mt-2 text-sm text-rose/70 text-center">{error.message}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
         <Panel className="p-6">
            <h3 className="mb-4 font-semibold">Simulation Inputs</h3>
            <div className="space-y-4">
              {factors.map((f, i) => (
                <div key={f.id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    <Switch checked={f.enabled} onCheckedChange={() => toggleFactor(i)} />
                  </div>
                  <div>
                    <div className="font-medium">{f.label}</div>
                    <div className="text-sm text-muted-foreground">{f.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
         </Panel>

         <Panel className="p-6 flex flex-col items-center justify-center">
            {isPending && !result && (
              <p className="animate-pulse text-muted-foreground">Calculating in Snowflake...</p>
            )}
            {result && (
               <>
                 <div className="label-xs self-start mb-4">Simulated Score</div>
                 <ScoreRing score={result.score} band={result.band} />
                 <div className="mt-6 w-full space-y-2 text-sm">
                    {result.breakdown.map(b => (
                       <div key={b.id} className="flex justify-between">
                         <span className="text-muted-foreground">{b.label}</span>
                         <span className={b.value > 0 ? "text-rose" : "text-emerald"}>+{b.value} pts</span>
                       </div>
                    ))}
                 </div>
               </>
            )}
         </Panel>
      </div>
    </div>
  );
}
