import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RiskBand } from "@/lib/types";

export const bandStyles: Record<RiskBand, { text: string; bg: string; ring: string; label: string }> =
  {
    critical: {
      text: "text-rose",
      bg: "bg-rose/10",
      ring: "border-rose/40",
      label: "CRITICAL",
    },
    high: { text: "text-amber", bg: "bg-amber/10", ring: "border-amber/40", label: "HIGH RISK" },
    medium: {
      text: "text-cyan",
      bg: "bg-cyan/10",
      ring: "border-cyan/35",
      label: "MEDIUM",
    },
    low: {
      text: "text-emerald",
      bg: "bg-emerald/10",
      ring: "border-emerald/35",
      label: "LOW",
    },
  };

export function Panel({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("panel", hover && "panel-hover", className)}>{children}</div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <div className="label-xs mb-2">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function Counter({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 22 });
  const text = useTransform(spring, (v) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  return <motion.span className={cn("numeric", className)}>{text}</motion.span>;
}

export function StatusPill({
  label,
  state,
  tone = "emerald",
}: {
  label: string;
  state: string;
  tone?: "emerald" | "cyan" | "violet" | "amber";
}) {
  const dot = {
    emerald: "bg-emerald",
    cyan: "bg-cyan",
    violet: "bg-violet",
    amber: "bg-amber",
  }[tone];
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-surface-2/50 px-3 py-2">
      <span className="label-xs">{label}</span>
      <span className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-foreground/90">
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", dot)} />
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dot)} />
        </span>
        {state}
      </span>
    </div>
  );
}

export function RiskBadge({ band, score }: { band: RiskBand; score?: number }) {
  const s = bandStyles[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] font-semibold tracking-[0.12em]",
        s.bg,
        s.ring,
        s.text,
      )}
    >
      {score !== undefined ? <span className="numeric">{score}</span> : null}
      {s.label}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-violet/35 bg-violet/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-violet",
        className,
      )}
    >
      DEMONSTRATION DATASET
    </span>
  );
}

export function ScoreRing({
  score,
  size = 200,
  band,
}: {
  score: number;
  size?: number;
  band: RiskBand;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = {
    critical: "var(--rose)",
    high: "var(--amber)",
    medium: "var(--cyan)",
    low: "var(--emerald)",
  }[band];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 12px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-1">
          <Counter value={score} className="text-5xl font-semibold" />
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <div className={cn("mt-1 text-[11px] font-semibold tracking-[0.18em]", bandStyles[band].text)}>
          {bandStyles[band].label}
        </div>
      </div>
    </div>
  );
}
