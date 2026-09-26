import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { analyzeMessage, demoScenarios, getInvestigation } from "@/services/api";
import {
  DemoBadge,
  Panel,
  RiskBadge,
  ScoreRing,
  SectionHeader,
} from "@/components/phish/primitives";
import { AttackGraph } from "@/components/phish/AttackGraph";
import { EvidenceCard } from "@/components/phish/EvidenceCard";

export const Route = createFileRoute("/investigations/$caseId")({
  head: () => ({
    meta: [
      { title: "Case detail — PhishGraph" },
      {
        name: "description",
        content:
          "Full investigation detail: risk score, attack graph, evidence chain and analyst notes.",
      },
      { property: "og:title", content: "Case detail — PhishGraph" },
      {
        property: "og:description",
        content: "Risk score, attack graph and evidence chain for a phishing case.",
      },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { caseId } = useParams({ from: "/investigations/$caseId" });
  const { data: inv } = useQuery({
    queryKey: ["investigation", caseId],
    queryFn: () => getInvestigation(caseId),
  });
  const { data: analysis } = useQuery({
    queryKey: ["case-analysis", caseId],
    queryFn: () => analyzeMessage(demoScenarios[0]!.input),
  });

  if (!inv) {
    return <div className="text-sm text-muted-foreground">Loading case {caseId}…</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/investigations"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All investigations
      </Link>

      <SectionHeader
        eyebrow={inv.caseId}
        title={inv.subject}
        description={`${inv.sender} · ${inv.status} · Analyst ${inv.analyst}`}
        actions={
          <div className="flex items-center gap-3">
            <RiskBadge band={inv.band} score={inv.score} />
            <DemoBadge />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel className="flex flex-col items-center p-6 xl:col-span-3">
          <div className="label-xs self-start">Threat score</div>
          <div className="mt-6">
            <ScoreRing score={inv.score} band={inv.band} />
          </div>
          <div className="mt-6 w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Campaign</span>
              <span>{inv.campaign ?? "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Detected</span>
              <span className="numeric">{new Date(inv.timestamp).toUTCString().slice(5, 22)}</span>
            </div>
          </div>
          <div className="mt-6 w-full">
            <div className="label-xs">Analyst notes</div>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              {inv.notes.map((n) => (
                <li key={n} className="rounded-lg border border-border/60 bg-surface-2/40 p-2.5">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-5 xl:col-span-6">
          <div className="label-xs">Attack graph</div>
          {analysis ? (
            <AttackGraph nodes={analysis.nodes} edges={analysis.edges} />
          ) : (
            <div className="h-[380px]" />
          )}
        </Panel>

        <Panel className="p-5 xl:col-span-3">
          <div className="label-xs">Why this message is suspicious</div>
          <div className="mt-4 space-y-3">
            {(analysis?.signals ?? []).map((s, i) => (
              <EvidenceCard key={s.id} signal={s} index={i} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
