import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { getInvestigations } from "@/services/api";
import { DemoBadge, Panel, RiskBadge, SectionHeader } from "@/components/phish/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/investigations/")({
  head: () => ({
    meta: [
      { title: "Investigations — PhishGraph" },
      {
        name: "description",
        content:
          "Triage detected phishing incidents with case IDs, risk scores, campaign attribution and status tracking.",
      },
      { property: "og:title", content: "Investigations — PhishGraph" },
      {
        property: "og:description",
        content: "Case-level triage for detected phishing incidents.",
      },
    ],
  }),
  component: Investigations,
});

const statuses = ["All", "Open", "Triage", "Contained", "Closed"] as const;

function Investigations() {
  const { data } = useQuery({ queryKey: ["investigations"], queryFn: getInvestigations });
  const [filter, setFilter] = useState<(typeof statuses)[number]>("All");
  const items = (data ?? []).filter((i) => filter === "All" || i.status === filter);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Case management"
        title="Investigations"
        description="Every detection promoted to a case, with its evidence chain preserved."
        actions={<DemoBadge />}
      />

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs tracking-[0.1em] transition-colors",
              filter === s
                ? "border-cyan/40 bg-cyan/10 text-cyan"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((inv, i) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to="/investigations/$caseId" params={{ caseId: inv.caseId }}>
              <Panel hover className="h-full p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan">{inv.caseId}</span>
                  <RiskBadge band={inv.band} score={inv.score} />
                </div>
                <div className="mt-3 text-sm font-medium">{inv.subject}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{inv.sender}</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="label-xs">Campaign</div>
                    <div className="mt-1">{inv.campaign ?? "—"}</div>
                  </div>
                  <div>
                    <div className="label-xs">Status</div>
                    <div className="mt-1">{inv.status}</div>
                  </div>
                  <div>
                    <div className="label-xs">Analyst</div>
                    <div className="mt-1">{inv.analyst}</div>
                  </div>
                  <div>
                    <div className="label-xs">Detected</div>
                    <div className="numeric mt-1">
                      {new Date(inv.timestamp).toUTCString().slice(5, 22)}
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
