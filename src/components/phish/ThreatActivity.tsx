import { motion } from "framer-motion";
import { useMemo } from "react";

interface Node {
  id: number;
  x: number;
  y: number;
  r: number;
  hot: boolean;
}

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function ThreatActivity() {
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: 60 + seeded(i + 1) * 840,
      y: 40 + seeded(i + 51) * 280,
      r: 3 + seeded(i + 101) * 4,
      hot: seeded(i + 151) > 0.72,
    }));
    const links: [Node, Node][] = [];
    nodes.forEach((a, i) => {
      const b = nodes[(i * 7 + 3) % nodes.length];
      const c = nodes[(i * 3 + 11) % nodes.length];
      if (b && b.id !== a.id) links.push([a, b]);
      if (c && c.id !== a.id && i % 2 === 0) links.push([a, c]);
    });
    return { nodes, links };
  }, []);

  return (
    <svg viewBox="0 0 960 340" className="h-[320px] w-full">
      <defs>
        <linearGradient id="ta-line" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.05" />
          <stop offset="50%" stopColor="var(--cyan)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {links.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="url(#ta-line)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0.25, 0.7, 0.25] }}
          transition={{
            pathLength: { duration: 1.2, delay: i * 0.03 },
            opacity: { duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.1 },
          }}
        />
      ))}

      {nodes.map((n, i) => (
        <g key={n.id}>
          {n.hot ? (
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="var(--rose)"
              opacity={0.25}
              animate={{ r: [n.r, n.r * 5, n.r], opacity: [0.35, 0, 0.35] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
            />
          ) : null}
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.hot ? "var(--rose)" : "var(--cyan)"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: n.hot ? 1 : 0.75 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 14 }}
            style={{ filter: `drop-shadow(0 0 8px ${n.hot ? "var(--rose)" : "var(--cyan)"})` }}
          />
        </g>
      ))}

      <motion.rect
        y="0"
        width="2"
        height="340"
        fill="var(--cyan)"
        opacity="0.35"
        animate={{ x: [0, 958, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}
