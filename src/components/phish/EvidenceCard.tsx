import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Database, Sparkles, Boxes } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { EvidenceSignal } from "@/lib/types";

export function EvidenceCard({ signal, index }: { signal: EvidenceSignal; index: number }) {
  const [open, setOpen] = useState(false);
  const positive = signal.contribution > 0;
  const Icon =
    signal.source === "Snowflake Cortex"
      ? Sparkles
      : signal.source === "Vector Engine"
        ? Boxes
        : Database;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 140, damping: 18 }}
      className={cn(
        "rounded-xl border bg-surface-2/40 p-4 transition-colors",
        positive ? "border-rose/25 hover:border-rose/45" : "border-border/60 hover:border-border",
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-medium">{signal.name}</div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{signal.evidence}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "numeric rounded-md border px-2 py-1 text-sm font-semibold",
              positive
                ? "border-rose/35 bg-rose/10 text-rose"
                : "border-emerald/30 bg-emerald/10 text-emerald",
            )}
          >
            +{signal.contribution}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      <div className="mt-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-cyan" />
        <span className="label-xs">{signal.source}</span>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-3 rounded-lg border border-border/60 bg-background/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {signal.details}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
