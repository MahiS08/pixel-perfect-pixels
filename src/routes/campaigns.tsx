import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/services/api";
import { SectionHeader } from "@/components/phish/primitives";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/campaigns")({
  component: Campaigns,
});

function Campaigns() {
  const { data, error, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: () => getCampaigns() });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Threat correlation"
        title="Campaigns"
        description="Correlated phishing campaigns across the environment."
      />
      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface-2/30">
          <p className="text-muted-foreground text-sm animate-pulse">Loading campaigns...</p>
        </div>
      )}
      {error && (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-rose/30 bg-rose/10 p-6 text-rose">
          <AlertCircle className="mb-4 h-8 w-8" />
          <p className="font-semibold">Failed to load campaigns</p>
          <p className="mt-2 text-sm text-rose/70 text-center">{error.message}</p>
        </div>
      )}
      {data && data.length === 0 && !error && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface-2/30">
          <p className="text-muted-foreground text-sm">No campaigns discovered.</p>
        </div>
      )}
      {data && data.length > 0 && (
         <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface-2/30">
          <p className="text-muted-foreground text-sm">Campaigns loaded successfully.</p>
        </div>
      )}
    </div>
  );
}
