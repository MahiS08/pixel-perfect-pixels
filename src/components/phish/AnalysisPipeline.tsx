import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const PIPELINE_STAGES = [
  { id: "ingest", label: "Ingest", detail: "Message normalized into MESSAGES" },
  { id: "features", label: "Feature extraction", detail: "Tokens, URLs, headers, entities" },
  { id: "cortex", label: "Cortex analysis", detail: "Snowflake Cortex semantic classification" },
  { id: "risk", label: "Risk engine", detail: "Weighted deterministic scoring" },
  { id: "campaign", label: "Campaign correlation", detail: "Vector similarity over embeddings" },
  { id: "explain", label: "Explanation", detail: "Evidence assembly and attribution" },
] as const;

export function AnalysisPipeline({ stage }: { stage: number }) {
  return (
    <div className="panel relative overflow-hidden p-8">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-40" />
      <motion.div
        className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-cyan/10 to-transparent"
        animate={{ y: ["-10%", "420%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative">
        <div className="label-xs">Snowflake analysis pipeline</div>
        <h3 className="mt-1 text-lg font-semibold">Analyzing message</h3>
        <div className="mt-6 space-y-3">
          {PIPELINE_STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors",
                  active
                    ? "border-cyan/40 bg-cyan/5"
                    : done
                      ? "border-emerald/25 bg-emerald/5"
                      : "border-border/60 bg-surface-2/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[11px]",
                    done
                      ? "border-emerald/40 text-emerald"
                      : active
                        ? "border-cyan/50 text-cyan"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      "text-sm font-medium uppercase tracking-[0.12em]",
                      !done && !active && "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.detail}</div>
                </div>
                {active ? (
                  <motion.div
                    className="h-[2px] w-24 overflow-hidden rounded-full bg-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full w-1/3 bg-cyan"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
