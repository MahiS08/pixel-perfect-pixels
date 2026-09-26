import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { getDashboard } from "@/services/api";
import { Counter, DemoBadge, Panel, RiskBadge, SectionHeader } from "@/components/phish/primitives";
import { ThreatActivity } from "@/components/phish/ThreatActivity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Threat Operations Overview — PhishGraph" },
      {
        name: "description",
        content:
          "Live-style operations view of analyzed messages, high-risk detections, active investigations and discovered phishing campaigns.",
      },
      { property: "og:title", content: "Threat Operations Overview — PhishGraph" },
      {
        property: "og:description",
        content: "Messages analyzed, high-risk detections and campaign discovery at a glance.",
      },
    ],
  }),
  component: Overview,
});

const accentClass = {
  cyan: "text-cyan",
  rose: "text-rose",
  violet: "text-violet",
  amber: "text-amber",
  emerald: "text-emerald",
};

function Overview() {
  const { data, error, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Threat operations"
        title="Overview"
        description="Explainable phishing intelligence across every analyzed message, correlated campaign and open investigation."
        actions={<DemoBadge />}
      />

      {error && (
        <div className="rounded-lg border border-rose/30 bg-rose/10 p-4 text-rose text-sm text-center">
          <strong>SNOWFLAKE CONNECTION ERROR:</strong> {error.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.metrics ?? []).map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Panel hover className="relative overflow-hidden p-5">
              <div className="label-xs">{m.label}</div>
              <div className="mt-3 flex items-end justify-between">
                <Counter value={m.value} className="text-4xl font-semibold" />
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    m.delta >= 0 ? "text-rose" : "text-emerald",
                  )}
                >
                  {m.delta >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(m.delta)}%
                </span>
              </div>
              <div className={cn("mt-4 h-[2px] w-full bg-border", accentClass[m.accent])}>
                <motion.div
                  className="h-full bg-current"
                  initial={{ width: 0 }}
                  animate={{ width: `${45 + i * 13}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.07 }}
                />
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="relative overflow-hidden p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-xs">Threat activity</div>
              <h2 className="mt-1 text-lg font-semibold">Message flow and correlation</h2>
            </div>
            <span className="rounded-md border border-cyan/30 bg-cyan/10 px-2 py-1 text-[10px] tracking-[0.14em] text-cyan">
              STREAMING
            </span>
          </div>
          <ThreatActivity />
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div className="label-xs">Active investigations</div>
            <Link to="/investigations" className="text-xs text-cyan hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.investigations ?? [])
              .filter((i) => i.status !== "Closed")
              .slice(0, 5)
              .map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to="/investigations/$caseId"
                    params={{ caseId: inv.caseId }}
                    className="block rounded-lg border border-border/60 bg-surface-2/40 p-3 transition-colors hover:border-cyan/35"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-cyan">{inv.caseId}</span>
                      <RiskBadge band={inv.band} score={inv.score} />
                    </div>
                    <div className="mt-2 truncate text-sm">{inv.subject}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{inv.sender}</div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="label-xs">Recent detections</div>
            <h2 className="mt-1 text-lg font-semibold">Last 6 hours</h2>
          </div>
          <DemoBadge />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-y border-border text-left">
                {["Time", "Sender", "Subject", "Campaign", "Score", ""].map((h) => (
                  <th key={h} className="label-xs px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.detections ?? []).map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/50 transition-colors hover:bg-surface-2/50"
                >
                  <td className="numeric px-5 py-3 text-muted-foreground">{d.time}</td>
                  <td className="px-5 py-3 font-mono text-xs">{d.sender}</td>
                  <td className="px-5 py-3">{d.subject}</td>
                  <td className="px-5 py-3 text-muted-foreground">{d.campaign ?? "—"}</td>
                  <td className="px-5 py-3">
                    <RiskBadge band={d.band} score={d.score} />
                  </td>
                  <td className="px-5 py-3">
                    <Link to="/analyze" className="text-cyan">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
