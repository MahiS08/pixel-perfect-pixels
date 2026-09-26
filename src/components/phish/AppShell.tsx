import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  Database,
  FlaskConical,
  LayoutDashboard,
  Radar,
  Search,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusPill } from "./primitives";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/analyze", label: "Analyze", icon: Search },
  { to: "/investigations", label: "Investigations", icon: ShieldAlert },
  { to: "/campaigns", label: "Campaigns", icon: Radar },
  { to: "/simulator", label: "Risk Simulator", icon: SlidersHorizontal },
  { to: "/threat-feed", label: "Threat Feed", icon: Activity },
  { to: "/data-lab", label: "Data Lab", icon: Database },
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10">
        <Sparkles className="h-4 w-4 text-cyan" />
        <span className="absolute inset-0 rounded-lg shadow-[0_0_24px_-6px_var(--cyan)]" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-[0.18em]">PHISHGRAPH</div>
        <div className="text-[10px] tracking-[0.12em] text-muted-foreground">
          EXPLAINABLE PHISHING INTELLIGENCE
        </div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-surface-2 text-foreground"
                : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_12px_var(--cyan)]"
              />
            ) : null}
            <Icon className={cn("h-4 w-4", active && "text-cyan")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Logo />
      <NavList onNavigate={onNavigate} />
      <div className="mt-auto space-y-2">
        <div className="label-xs px-1">Snowflake intelligence</div>
        <StatusPill label="Snowflake" state="CONNECTED" tone="cyan" />
        <StatusPill label="Cortex" state="READY" tone="violet" />
        <StatusPill label="Vector engine" state="READY" tone="emerald" />
        <StatusPill label="Analytics" state="READY" tone="emerald" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-border bg-sidebar/80 backdrop-blur-xl lg:block">
        <SidebarBody />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="absolute inset-y-0 left-0 w-[264px] border-r border-border bg-sidebar"
          >
            <SidebarBody onNavigate={() => setOpen(false)} />
          </motion.aside>
        </div>
      ) : null}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-3 md:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md border border-border p-2 text-muted-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search senders, domains, cases, campaigns…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground md:block">
                ⌘K
              </kbd>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-md border border-emerald/30 bg-emerald/10 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-emerald">
                SNOWFLAKE · CONNECTED
              </span>
              <span className="rounded-md border border-violet/30 bg-violet/10 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-violet">
                CORTEX · READY
              </span>
              <span className="rounded-md border border-border bg-surface-2/60 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">
                ENV · DEMO
              </span>
            </div>
            <button
              className="relative rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose" />
            </button>
            <div className="hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 text-[11px] font-semibold md:flex">
              MS
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
        <footer className="flex flex-wrap items-center gap-3 px-4 pb-8 text-[11px] text-muted-foreground md:px-8">
          <FlaskConical className="h-3.5 w-3.5" />
          Demonstration dataset — synthetic messages generated for evaluation. Not live threat
          intelligence.
        </footer>
      </div>
    </div>
  );
}
