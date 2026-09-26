import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/types";

const kindColor: Record<GraphNode["kind"], string> = {
  sender: "var(--cyan)",
  domain: "var(--violet)",
  message: "var(--cyan)",
  keywords: "var(--amber)",
  urgency: "var(--amber)",
  url: "var(--rose)",
  tactics: "var(--violet)",
  risk: "var(--rose)",
};

export function AttackGraph({
  nodes,
  edges,
  activeStep = 99,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeStep?: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const selectedNode = selected ? byId[selected] : null;

  return (
    <div className="relative">
      <svg viewBox="0 0 960 400" className="h-[380px] w-full">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
          </radialGradient>
          <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M40 0H0V40"
              fill="none"
              stroke="color-mix(in oklab, var(--foreground) 5%, transparent)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="960" height="400" fill="url(#graph-grid)" />

        {edges.map((e, i) => {
          const a = byId[e.from];
          const b = byId[e.to];
          if (!a || !b) return null;
          const active = Math.max(a.step, b.step) <= activeStep;
          const mx = (a.x + b.x) / 2;
          const d = `M ${a.x} ${a.y} Q ${mx} ${(a.y + b.y) / 2 - 40} ${b.x} ${b.y}`;
          return (
            <g key={`${e.from}-${e.to}`}>
              <motion.path
                d={d}
                fill="none"
                stroke={active ? "color-mix(in oklab, var(--cyan) 45%, transparent)" : "color-mix(in oklab, var(--foreground) 10%, transparent)"}
                strokeWidth="1.2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
              {active ? (
                <motion.circle
                  r="2.6"
                  fill="var(--cyan)"
                  style={{ filter: "drop-shadow(0 0 6px var(--cyan))" }}
                  animate={{ offsetDistance: ["0%", "100%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.25, ease: "linear" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  {...({ style: { offsetPath: `path("${d}")`, filter: "drop-shadow(0 0 6px var(--cyan))" } } as any)}
                />
              ) : null}
            </g>
          );
        })}

        {nodes.map((n) => {
          const active = n.step <= activeStep;
          const color = kindColor[n.kind];
          const isSelected = selected === n.id;
          const label = n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              className="cursor-pointer"
              onClick={() => setSelected(isSelected ? null : n.id)}
            >
              {active && n.suspicious ? (
                <motion.circle
                  r="34"
                  fill={color}
                  opacity={0.12}
                  animate={{ r: [26, 44, 26], opacity: [0.18, 0, 0.18] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              ) : null}
              <motion.circle
                r="22"
                fill="color-mix(in oklab, var(--surface) 92%, transparent)"
                stroke={active ? color : "color-mix(in oklab, var(--foreground) 14%, transparent)"}
                strokeWidth={isSelected ? 2.4 : 1.4}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: active ? 1 : 0.85, opacity: active ? 1 : 0.4 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                style={active ? { filter: `drop-shadow(0 0 10px ${color})` } : undefined}
              />
              <text
                textAnchor="middle"
                y="4"
                className="fill-foreground text-[10px] font-semibold uppercase"
                style={{ fontSize: 9, letterSpacing: "0.08em" }}
              >
                {n.kind.slice(0, 3).toUpperCase()}
              </text>
              <text
                textAnchor="middle"
                y="42"
                style={{ fontSize: 11 }}
                className="fill-muted-foreground"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {selectedNode ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="panel absolute bottom-3 left-3 right-3 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="label-xs">{selectedNode.kind} evidence</div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="mt-1 text-sm font-medium">{selectedNode.label}</div>
            <p className="mt-1 text-sm text-muted-foreground">{selectedNode.evidence}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
