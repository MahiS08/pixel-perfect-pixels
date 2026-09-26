import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataLabStats } from "@/services/api";
import { SectionHeader, StatusPill } from "@/components/phish/primitives";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/data-lab")({
  component: DataLab,
});

function DataLab() {
  const { data, error, isLoading } = useQuery({ queryKey: ["data-lab"], queryFn: () => getDataLabStats() });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Observability"
        title="Data Lab"
        description="System status and data pipeline observability."
      />
      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface-2/30">
          <p className="text-muted-foreground text-sm animate-pulse">Loading system status...</p>
        </div>
      )}
      {error && (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-rose/30 bg-rose/10 p-6 text-rose">
          <AlertCircle className="mb-4 h-8 w-8" />
          <p className="font-semibold">Failed to load system status</p>
          <p className="mt-2 text-sm text-rose/70 text-center">{error.message}</p>
        </div>
      )}
      {data && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-2/30 p-6 space-y-4">
             <h3 className="font-semibold text-lg">Snowflake Connection</h3>
             <div className="space-y-2">
                <StatusPill label="Snowflake" state={data.snowflakeConnected ? "CONNECTED" : "DISCONNECTED"} tone={data.snowflakeConnected ? "cyan" : "rose"} />
                <StatusPill label="Cortex API" state={data.cortexAvailable ? "AVAILABLE" : "UNAVAILABLE"} tone={data.cortexAvailable ? "violet" : "rose"} />
                <div className="text-sm mt-4">
                   <span className="text-muted-foreground">Warehouse: </span>
                   <span className="font-mono">{data.warehouse}</span>
                </div>
             </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2/30 p-6 space-y-4">
             <h3 className="font-semibold text-lg">Pipeline Status</h3>
             <div className="space-y-2">
                <div className="text-sm">
                   <span className="text-muted-foreground">Messages Stored: </span>
                   <span className="font-mono text-cyan">{data.messagesStored}</span>
                </div>
                <div className="text-sm">
                   <span className="text-muted-foreground">Analyses Completed: </span>
                   <span className="font-mono text-cyan">{data.analysesCompleted}</span>
                </div>
                <div className="text-sm">
                   <span className="text-muted-foreground">Latency: </span>
                   <span className="font-mono">{data.latencyMs} ms</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
