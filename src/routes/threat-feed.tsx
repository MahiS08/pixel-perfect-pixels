import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getThreatFeed } from "@/services/api";
import { SectionHeader } from "@/components/phish/primitives";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/threat-feed")({
  component: ThreatFeed,
});

function ThreatFeed() {
  const { data, error, isLoading } = useQuery({ queryKey: ["threat-feed"], queryFn: () => getThreatFeed() });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Global intelligence"
        title="Threat Feed"
        description="Live global threat intelligence."
      />
      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface-2/30">
          <p className="text-muted-foreground text-sm animate-pulse">Loading threat feed...</p>
        </div>
      )}
      {error && (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-rose/30 bg-rose/10 p-6 text-rose">
          <AlertCircle className="mb-4 h-8 w-8" />
          <p className="font-semibold">Failed to load threat feed</p>
          <p className="mt-2 text-sm text-rose/70 text-center">{error.message}</p>
        </div>
      )}
      {data && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface-2/30">
          <p className="text-muted-foreground text-sm">No new threat indicators.</p>
        </div>
      )}
    </div>
  );
}
