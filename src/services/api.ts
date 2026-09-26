/**
 * Centralized API layer.
 *
 * Every UI component talks to PhishGraph only through these functions.
 * The current implementation returns synthetic DEMONSTRATION DATA.
 * Replacing the bodies with `fetch(API_BASE + "/...")` calls against the
 * Snowflake-backed REST API requires no changes in any component.
 */
import type {
  AnalysisResult,
  Campaign,
  DashboardData,
  DataLabStats,
  EvidenceSignal,
  GraphEdge,
  GraphNode,
  Investigation,
  MessageInput,
  RiskBand,
  SimulatorFactor,
  ThreatFeed,
} from "@/lib/types";

export const API_BASE = "/api";
export const DEMO_MODE = true;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function bandFor(score: number): RiskBand {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const URGENCY_WORDS = ["urgent", "immediately", "within 24 hours", "final notice", "expire", "now"];
const THREAT_WORDS = ["suspend", "locked", "terminate", "legal", "unauthorized", "closed"];
const KEYWORDS = ["verify", "password", "payroll", "invoice", "delivery", "bank", "credential"];

function occurrences(text: string, list: string[]) {
  const lower = text.toLowerCase();
  return list.filter((w) => lower.includes(w));
}

function buildGraph(input: MessageInput, signals: EvidenceSignal[], score: number) {
  const find = (id: string) => signals.find((s) => s.id === id);
  const nodes: GraphNode[] = [
    {
      id: "sender",
      label: input.senderEmail || "unknown@sender",
      kind: "sender",
      x: 90,
      y: 180,
      suspicious: !input.knownSender,
      evidence: input.knownSender
        ? "Sender appears in the known-correspondent table."
        : "No prior correspondence found in MESSAGES history.",
      step: 0,
    },
    {
      id: "domain",
      label: input.senderDomain || "unknown.tld",
      kind: "domain",
      x: 265,
      y: 90,
      suspicious: (find("domain")?.contribution ?? 0) > 0,
      evidence: `Domain reputation lookup for ${input.senderDomain || "unknown.tld"}.`,
      step: 1,
    },
    {
      id: "message",
      label: input.subject || "Untitled message",
      kind: "message",
      x: 300,
      y: 250,
      suspicious: score >= 65,
      evidence: "Message body tokenized and embedded for correlation.",
      step: 2,
    },
    {
      id: "keywords",
      label: "Keywords",
      kind: "keywords",
      x: 480,
      y: 340,
      suspicious: (find("keywords")?.contribution ?? 0) > 0,
      evidence: find("keywords")?.evidence ?? "No high-risk keywords detected.",
      step: 3,
    },
    {
      id: "urgency",
      label: "Urgency",
      kind: "urgency",
      x: 470,
      y: 150,
      suspicious: (find("urgency")?.contribution ?? 0) > 0,
      evidence: find("urgency")?.evidence ?? "No urgency framing detected.",
      step: 3,
    },
    {
      id: "url",
      label: "URL",
      kind: "url",
      x: 505,
      y: 45,
      suspicious: (find("url")?.contribution ?? 0) > 0,
      evidence: find("url")?.evidence ?? "No embedded links found.",
      step: 3,
    },
    {
      id: "tactics",
      label: "Tactics",
      kind: "tactics",
      x: 680,
      y: 235,
      suspicious: score >= 50,
      evidence: "Cortex mapped the message to social-engineering tactics.",
      step: 4,
    },
    {
      id: "risk",
      label: `Risk ${score}`,
      kind: "risk",
      x: 855,
      y: 175,
      suspicious: score >= 65,
      evidence: "Deterministic risk engine aggregates weighted signal contributions.",
      step: 5,
    },
  ];

  const edges: GraphEdge[] = [
    { from: "sender", to: "domain" },
    { from: "sender", to: "message" },
    { from: "domain", to: "message" },
    { from: "message", to: "keywords" },
    { from: "message", to: "urgency" },
    { from: "message", to: "url" },
    { from: "keywords", to: "tactics" },
    { from: "urgency", to: "tactics" },
    { from: "url", to: "tactics" },
    { from: "tactics", to: "risk" },
  ];

  return { nodes, edges };
}

export async function analyzeMessage(input: MessageInput): Promise<AnalysisResult> {
  await delay(400);
  const text = `${input.subject} ${input.body}`;
  const urgency = occurrences(text, URGENCY_WORDS);
  const threats = occurrences(text, THREAT_WORDS);
  const keywords = occurrences(text, KEYWORDS);
  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
  const url = urlMatch?.[0] ?? "";
  const lookalike = /[-.]?(secure|verify|login|update|account|support)[-.]/i.test(
    `${input.senderDomain}.`,
  );

  const signals: EvidenceSignal[] = [
    {
      id: "urgency",
      name: "Urgency language",
      contribution: urgency.length ? Math.min(15, 6 + urgency.length * 4) : 0,
      evidence: urgency.length
        ? `Urgency markers: ${urgency.join(", ")}`
        : "No urgency framing detected.",
      source: "Snowflake Cortex",
      details:
        "Cortex classifies time-pressure framing, a core social-engineering primitive used to bypass deliberate verification.",
    },
    {
      id: "sender",
      name: "Unknown sender",
      contribution: input.knownSender ? 0 : 25,
      evidence: input.knownSender
        ? "Sender has prior legitimate correspondence."
        : `No prior messages from ${input.senderEmail || "this sender"} in 180 days.`,
      source: "Snowflake SQL",
      details:
        "SELECT COUNT(*) FROM MESSAGES WHERE SENDER_EMAIL = ? AND RECEIVED_AT > DATEADD(day,-180,CURRENT_DATE)",
    },
    {
      id: "url",
      name: "Suspicious URL",
      contribution: url ? (/(bit\.ly|tinyurl|\d{1,3}(\.\d{1,3}){3}|-)/i.test(url) ? 20 : 8) : 0,
      evidence: url ? `Embedded link: ${url}` : "No embedded links found.",
      source: "Snowflake SQL",
      details:
        "URL host is compared against the DOMAIN_REPUTATION table and shortener/IP-literal heuristics.",
    },
    {
      id: "keywords",
      name: "Suspicious keywords",
      contribution: keywords.length ? Math.min(27, keywords.length * 9) : 0,
      evidence: keywords.length
        ? `Credential/finance terms: ${keywords.join(", ")}`
        : "No high-risk keywords detected.",
      source: "Snowflake Cortex",
      details:
        "Token-level scoring over a curated credential-harvesting lexicon, weighted by co-occurrence density.",
    },
    {
      id: "threat",
      name: "Threat language",
      contribution: threats.length ? Math.min(12, threats.length * 6) : 0,
      evidence: threats.length
        ? `Consequence framing: ${threats.join(", ")}`
        : "No consequence framing detected.",
      source: "Snowflake Cortex",
      details: "Detects punitive consequences used to suppress recipient scrutiny.",
    },
    {
      id: "domain",
      name: "Domain risk",
      contribution: lookalike ? 14 : 0,
      evidence: lookalike
        ? `${input.senderDomain} resembles a brand look-alike pattern.`
        : `${input.senderDomain || "Domain"} has no adverse reputation records.`,
      source: "Snowflake SQL",
      details:
        "Look-alike detection compares the registrable domain against protected brand tokens with edit-distance scoring.",
    },
  ];

  const score = Math.max(
    2,
    Math.min(99, signals.reduce((sum, s) => sum + s.contribution, 0)),
  );
  const band = bandFor(score);
  const { nodes, edges } = buildGraph(input, signals, score);

  return {
    id: `MSG-${Math.floor(Math.random() * 900 + 100)}`,
    score,
    band,
    confidence: score >= 70 ? "High" : score >= 40 ? "Medium" : "Low",
    summary:
      score >= 65
        ? "The message combines an unrecognised sender with credential-oriented language and time pressure — a pattern consistent with credential-harvesting phishing."
        : "The message shows limited phishing indicators. Residual risk comes from isolated signals rather than a coherent attack pattern.",
    signals: signals.sort((a, b) => b.contribution - a.contribution),
    nodes,
    edges,
    campaignId: score >= 65 ? "Campaign #042" : null,
    campaignSimilarity: score >= 65 ? 94.2 : null,
    createdAt: new Date().toISOString(),
  };
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  input: MessageInput;
}

export const demoScenarios: DemoScenario[] = [
  {
    id: "banking",
    title: "Banking account verification",
    description: "Credential harvesting via account-hold pretext",
    input: {
      senderEmail: "alerts@secure-northbank.com",
      senderDomain: "secure-northbank.com",
      subject: "Urgent: verify your account within 24 hours",
      body: "We detected unauthorized access. Your bank account will be locked immediately unless you verify your credentials now: https://secure-northbank-verify.com/login",
      recipient: "finance@acme.io",
      knownSender: false,
    },
  },
  {
    id: "payroll",
    title: "Fake payroll notification",
    description: "Payroll redirection / direct-deposit fraud",
    input: {
      senderEmail: "hr-notice@payroll-acme.net",
      senderDomain: "payroll-acme.net",
      subject: "Action required: payroll update before expire date",
      body: "Your payroll details must be confirmed immediately or your invoice payment will be suspended. Update here: http://bit.ly/pay-acme",
      recipient: "staff@acme.io",
      knownSender: false,
    },
  },
  {
    id: "package",
    title: "Package delivery",
    description: "Delivery pretext with shortened redirect",
    input: {
      senderEmail: "tracking@parcel-update-support.com",
      senderDomain: "parcel-update-support.com",
      subject: "Final notice: delivery failed",
      body: "Your delivery could not be completed. Confirm your address now: https://tinyurl.com/parcel-fix",
      recipient: "ops@acme.io",
      knownSender: false,
    },
  },
  {
    id: "itreset",
    title: "IT password reset",
    description: "Internal helpdesk impersonation",
    input: {
      senderEmail: "it-helpdesk@acme-login.support",
      senderDomain: "acme-login.support",
      subject: "Your password will expire — reset immediately",
      body: "Unauthorized sign-in attempts detected. Reset your password now or your account will be terminated: https://192.168.42.9/reset",
      recipient: "everyone@acme.io",
      knownSender: false,
    },
  },
];

export const emptyMessage: MessageInput = {
  senderEmail: "",
  senderDomain: "",
  subject: "",
  body: "",
  recipient: "",
  knownSender: false,
};

const investigations: Investigation[] = [
  {
    id: "1",
    caseId: "CASE-2291",
    timestamp: "2026-09-26T03:14:00Z",
    sender: "alerts@secure-northbank.com",
    subject: "Urgent: verify your account within 24 hours",
    score: 87,
    band: "critical",
    campaign: "Campaign #042",
    status: "Open",
    analyst: "M. Shah",
    notes: [
      "Sender domain registered 6 days ago.",
      "Vector match against 4 prior messages at 94.2% similarity.",
    ],
  },
  {
    id: "2",
    caseId: "CASE-2288",
    timestamp: "2026-09-26T01:48:00Z",
    sender: "hr-notice@payroll-acme.net",
    subject: "Action required: payroll update",
    score: 79,
    band: "high",
    campaign: "Campaign #042",
    status: "Triage",
    analyst: "D. Okafor",
    notes: ["Direct-deposit redirection pretext.", "Shortened URL resolves to a credential form."],
  },
  {
    id: "3",
    caseId: "CASE-2284",
    timestamp: "2026-09-25T22:09:00Z",
    sender: "tracking@parcel-update-support.com",
    subject: "Final notice: delivery failed",
    score: 68,
    band: "high",
    campaign: "Campaign #017",
    status: "Contained",
    analyst: "L. Brenner",
    notes: ["Mailbox rule created to quarantine sender.", "No credential submission observed."],
  },
  {
    id: "4",
    caseId: "CASE-2280",
    timestamp: "2026-09-25T18:31:00Z",
    sender: "billing@vendor-invoices.io",
    subject: "Outstanding invoice #40192",
    score: 54,
    band: "medium",
    campaign: null,
    status: "Triage",
    analyst: "M. Shah",
    notes: ["Vendor exists but banking details differ from record."],
  },
  {
    id: "5",
    caseId: "CASE-2276",
    timestamp: "2026-09-25T15:02:00Z",
    sender: "it-helpdesk@acme-login.support",
    subject: "Your password will expire",
    score: 91,
    band: "critical",
    campaign: "Campaign #061",
    status: "Open",
    analyst: "D. Okafor",
    notes: ["IP-literal reset link.", "Targeted 214 mailboxes in 9 minutes."],
  },
  {
    id: "6",
    caseId: "CASE-2271",
    timestamp: "2026-09-25T09:55:00Z",
    sender: "newsletter@northwind-news.com",
    subject: "Weekly product digest",
    score: 18,
    band: "low",
    campaign: null,
    status: "Closed",
    analyst: "L. Brenner",
    notes: ["Benign marketing message, closed as false positive."],
  },
];

export async function getDashboard(): Promise<DashboardData> {
  await delay(120);
  return {
    metrics: [
      { id: "m1", label: "Messages analyzed", value: 48213, delta: 6.4, accent: "cyan" },
      { id: "m2", label: "High-risk messages", value: 1842, delta: 12.1, accent: "rose" },
      { id: "m3", label: "Active investigations", value: 27, delta: -4.2, accent: "violet" },
      { id: "m4", label: "Campaigns discovered", value: 14, delta: 2, accent: "amber" },
    ],
    detections: [
      {
        id: "d1",
        time: "03:14",
        sender: "alerts@secure-northbank.com",
        subject: "Urgent: verify your account",
        score: 87,
        band: "critical",
        campaign: "Campaign #042",
      },
      {
        id: "d2",
        time: "02:51",
        sender: "it-helpdesk@acme-login.support",
        subject: "Your password will expire",
        score: 91,
        band: "critical",
        campaign: "Campaign #061",
      },
      {
        id: "d3",
        time: "02:22",
        sender: "hr-notice@payroll-acme.net",
        subject: "Action required: payroll update",
        score: 79,
        band: "high",
        campaign: "Campaign #042",
      },
      {
        id: "d4",
        time: "01:40",
        sender: "tracking@parcel-update-support.com",
        subject: "Final notice: delivery failed",
        score: 68,
        band: "high",
        campaign: "Campaign #017",
      },
      {
        id: "d5",
        time: "01:05",
        sender: "billing@vendor-invoices.io",
        subject: "Outstanding invoice #40192",
        score: 54,
        band: "medium",
        campaign: null,
      },
      {
        id: "d6",
        time: "00:32",
        sender: "no-reply@docs-sharecenter.com",
        subject: "A document was shared with you",
        score: 61,
        band: "medium",
        campaign: "Campaign #017",
      },
    ],
    investigations,
  };
}

export async function getInvestigations(): Promise<Investigation[]> {
  await delay(120);
  return investigations;
}

export async function getInvestigation(caseId: string): Promise<Investigation | undefined> {
  await delay(80);
  return investigations.find((i) => i.caseId === caseId);
}

export async function getCampaigns(): Promise<Campaign[]> {
  await delay(120);
  return [
    {
      id: "Campaign #042",
      name: "Financial verification cluster",
      similarity: 94.2,
      messages: ["MSG-001", "MSG-014", "MSG-029", "MSG-031"],
      commonLanguage: ["verify your account", "within 24 hours", "unauthorized access"],
      commonDomain: "secure-northbank.com",
      commonTactics: ["Urgency", "Authority impersonation", "Credential harvesting"],
      urlPattern: "https://secure-*-verify.com/login",
      firstSeen: "2026-09-21",
      volume: 412,
    },
    {
      id: "Campaign #061",
      name: "Helpdesk credential reset",
      similarity: 91.7,
      messages: ["MSG-044", "MSG-052", "MSG-058"],
      commonLanguage: ["password will expire", "reset immediately", "sign-in attempts"],
      commonDomain: "acme-login.support",
      commonTactics: ["Internal impersonation", "Urgency", "Threat language"],
      urlPattern: "https://<ip-literal>/reset",
      firstSeen: "2026-09-23",
      volume: 214,
    },
    {
      id: "Campaign #017",
      name: "Parcel redirect wave",
      similarity: 88.4,
      messages: ["MSG-007", "MSG-011", "MSG-020", "MSG-024", "MSG-036"],
      commonLanguage: ["delivery failed", "confirm your address", "final notice"],
      commonDomain: "parcel-update-support.com",
      commonTactics: ["Pretexting", "Shortened redirect"],
      urlPattern: "https://tinyurl.com/*",
      firstSeen: "2026-09-19",
      volume: 668,
    },
  ];
}

export const baseSimulatorFactors: SimulatorFactor[] = [
  {
    id: "sender",
    label: "Unknown sender",
    weight: 25,
    enabled: true,
    explanation: "No prior correspondence history with this sender.",
  },
  {
    id: "url",
    label: "Suspicious link",
    weight: 20,
    enabled: true,
    explanation: "Embedded link points to a non-reputable host.",
  },
  {
    id: "urgency",
    label: "Urgency language",
    weight: 15,
    enabled: true,
    explanation: "Time pressure suppresses recipient verification.",
  },
  {
    id: "threat",
    label: "Threat language",
    weight: 12,
    enabled: false,
    explanation: "Punitive consequences framing.",
  },
  {
    id: "keywords",
    label: "Suspicious keywords",
    weight: 27,
    enabled: true,
    explanation: "Credential and finance terminology density.",
  },
];

export interface SimulationResult {
  score: number;
  band: RiskBand;
  breakdown: { id: string; label: string; value: number }[];
}

export async function simulateRisk(factors: SimulatorFactor[]): Promise<SimulationResult> {
  await delay(120);
  const breakdown = factors.map((f) => ({
    id: f.id,
    label: f.label,
    value: f.enabled ? f.weight : 0,
  }));
  const score = Math.min(99, breakdown.reduce((s, b) => s + b.value, 0));
  return { score, band: bandFor(score), breakdown };
}

export async function getThreatFeed(): Promise<ThreatFeed> {
  await delay(120);
  return {
    domains: [
      {
        id: "f1",
        value: "secure-northbank.com",
        detail: "Registered 6 days ago · brand look-alike",
        count: 412,
        severity: "critical",
        time: "03:14",
      },
      {
        id: "f2",
        value: "acme-login.support",
        detail: "Internal helpdesk impersonation",
        count: 214,
        severity: "critical",
        time: "02:51",
      },
      {
        id: "f3",
        value: "parcel-update-support.com",
        detail: "Delivery pretext infrastructure",
        count: 668,
        severity: "high",
        time: "01:40",
      },
      {
        id: "f4",
        value: "docs-sharecenter.com",
        detail: "File-share lure",
        count: 96,
        severity: "medium",
        time: "00:32",
      },
    ],
    urls: [
      {
        id: "u1",
        value: "https://secure-northbank-verify.com/login",
        detail: "Credential form, TLS issued 5 days ago",
        count: 188,
        severity: "critical",
        time: "03:14",
      },
      {
        id: "u2",
        value: "https://192.168.42.9/reset",
        detail: "IP-literal host, no certificate",
        count: 77,
        severity: "critical",
        time: "02:51",
      },
      {
        id: "u3",
        value: "https://tinyurl.com/parcel-fix",
        detail: "Shortener redirect chain (3 hops)",
        count: 231,
        severity: "high",
        time: "01:40",
      },
    ],
    patterns: [
      {
        id: "p1",
        value: "verify your account within 24 hours",
        detail: "Recurring phrase across 3 campaigns",
        count: 344,
        severity: "high",
        time: "today",
      },
      {
        id: "p2",
        value: "password will expire — reset immediately",
        detail: "Helpdesk impersonation template",
        count: 209,
        severity: "high",
        time: "today",
      },
      {
        id: "p3",
        value: "final notice: delivery failed",
        detail: "Consumer-pretext template",
        count: 402,
        severity: "medium",
        time: "yesterday",
      },
    ],
    tactics: [
      { name: "Urgency", share: 34 },
      { name: "Credential harvesting", share: 27 },
      { name: "Authority impersonation", share: 18 },
      { name: "Pretexting", share: 13 },
      { name: "Threat language", share: 8 },
    ],
  };
}

export async function getDataLabStats(): Promise<DataLabStats> {
  await delay(120);
  return {
    snowflakeConnected: true,
    cortexAvailable: true,
    messagesStored: 48213,
    embeddingsGenerated: 47690,
    campaignsDiscovered: 14,
    analysesCompleted: 12984,
    warehouse: "PHISHGRAPH_WH · X-SMALL",
    latencyMs: 184,
  };
}
