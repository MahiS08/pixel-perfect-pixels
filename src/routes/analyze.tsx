import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Play, RotateCcw, Sparkles } from "lucide-react";
import {
  analyzeMessage,
  demoScenarios,
  emptyMessage,
  type DemoScenario,
} from "@/services/api";
import type { AnalysisResult, MessageInput } from "@/lib/types";
import {
  DemoBadge,
  Panel,
  RiskBadge,
  ScoreRing,
  SectionHeader,
} from "@/components/phish/primitives";
import { AnalysisPipeline, PIPELINE_STAGES } from "@/components/phish/AnalysisPipeline";
import { AttackGraph } from "@/components/phish/AttackGraph";
import { EvidenceCard } from "@/components/phish/EvidenceCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze a Message — PhishGraph" },
      {
        name: "description",
        content:
          "Submit a suspicious message and receive an explainable risk score, attack graph and signal-level evidence.",
      },
      { property: "og:title", content: "Analyze a Message — PhishGraph" },
      {
        property: "og:description",
        content: "Turn suspicious messages into explainable evidence.",
      },
    ],
  }),
  component: Analyze,
});

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-xs">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan/50 focus:ring-2 focus:ring-ring/30";

function Analyze() {
  const [form, setForm] = useState<MessageInput>(emptyMessage);
  const [stage, setStage] = useState<number | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [graphStep, setGraphStep] = useState(99);

  const set = <K extends keyof MessageInput>(k: K, v: MessageInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const loadDemo = (s: DemoScenario) => {
    setForm(s.input);
    setResult(null);
  };

  const run = async () => {
    setResult(null);
    setStage(0);
    const analysis = await analyzeMessage(form);
    for (let i = 1; i <= PIPELINE_STAGES.length; i++) {
      await new Promise((r) => setTimeout(r, 480));
      setStage(i);
    }
    setStage(null);
    setResult(analysis);
    setGraphStep(-1);
    for (let s = 0; s <= 5; s++) {
      await new Promise((r) => setTimeout(r, 380));
      setGraphStep(s);
    }
  };

  const canRun = form.subject.trim().length > 0 || form.body.trim().length > 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Investigation"
        title="INVESTIGATE A MESSAGE"
        description="Turn suspicious messages into explainable evidence."
        actions={<DemoBadge />}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-5 xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Sender email">
              <input
                className={inputClass}
                value={form.senderEmail}
                onChange={(e) => set("senderEmail", e.target.value)}
                placeholder="alerts@secure-northbank.com"
              />
            </Field>
            <Field label="Sender domain">
              <input
                className={inputClass}
                value={form.senderDomain}
                onChange={(e) => set("senderDomain", e.target.value)}
                placeholder="secure-northbank.com"
              />
            </Field>
            <Field label="Subject">
              <input
                className={inputClass}
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="Urgent: verify your account"
              />
            </Field>
            <Field label="Recipient (optional)">
              <input
                className={inputClass}
                value={form.recipient ?? ""}
                onChange={(e) => set("recipient", e.target.value)}
                placeholder="finance@acme.io"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Message text">
              <textarea
                rows={8}
                className={cn(inputClass, "resize-y font-mono text-[13px] leading-relaxed")}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Paste the full message body here…"
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => set("knownSender", !form.knownSender)}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm"
            >
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  form.knownSender ? "bg-emerald/70" : "bg-border",
                )}
              >
                <motion.span
                  layout
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-foreground"
                  style={{ left: form.knownSender ? 18 : 2 }}
                />
              </span>
              Known sender
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={run}
                disabled={!canRun || stage !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan/40 bg-cyan/15 px-4 py-2.5 text-sm font-semibold tracking-[0.08em] text-cyan transition-all hover:bg-cyan/25 disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                ANALYZE WITH SNOWFLAKE
              </button>
              <button
                onClick={() => loadDemo(demoScenarios[0]!)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Play className="h-4 w-4" />
                LOAD DEMO
              </button>
              <button
                onClick={() => {
                  setForm(emptyMessage);
                  setResult(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                CLEAR
              </button>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="label-xs">Demonstration scenarios</div>
          <div className="mt-4 space-y-3">
            {demoScenarios.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => loadDemo(s)}
                className="block w-full rounded-lg border border-border/60 bg-surface-2/40 p-3 text-left transition-colors hover:border-cyan/35"
              >
                <div className="text-sm font-medium">{s.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>
              </motion.button>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            All scenarios are synthetic demonstration data generated for evaluation. They are not
            live threat intelligence.
          </p>
        </Panel>
      </div>

      <AnimatePresence mode="wait">
        {stage !== null ? (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <AnalysisPipeline stage={stage} />
          </motion.div>
        ) : null}

        {result ? (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 xl:grid-cols-12"
          >
            <Panel className="flex flex-col items-center p-6 xl:col-span-3">
              <div className="label-xs self-start">Threat score</div>
              <div className="mt-6">
                <ScoreRing score={result.score} band={result.band} />
              </div>
              <div className="mt-6 w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span>{result.confidence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Message ID</span>
                  <span className="font-mono text-xs">{result.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign</span>
                  <span>{result.campaignId ?? "None"}</span>
                </div>
                {result.campaignSimilarity ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Similarity</span>
                    <span className="numeric text-cyan">{result.campaignSimilarity}%</span>
                  </div>
                ) : null}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{result.summary}</p>
            </Panel>

            <Panel className="overflow-hidden p-5 xl:col-span-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label-xs">Attack graph</div>
                  <h3 className="mt-1 text-lg font-semibold">Signal propagation</h3>
                </div>
                <RiskBadge band={result.band} score={result.score} />
              </div>
              <AttackGraph nodes={result.nodes} edges={result.edges} activeStep={graphStep} />
              <p className="text-xs text-muted-foreground">
                Select any node to open its underlying evidence.
              </p>
            </Panel>

            <Panel className="p-5 xl:col-span-3">
              <div className="label-xs">Why this message is suspicious</div>
              <div className="mt-4 space-y-3">
                {result.signals.map((s, i) => (
                  <EvidenceCard key={s.id} signal={s} index={i} />
                ))}
              </div>
            </Panel>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
