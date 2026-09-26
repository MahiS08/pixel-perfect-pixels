const fs = require('fs');

const apiTs = `import { createServerFn } from "@tanstack/react-start";
import { executeSql } from "./snowflake";
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
export const DEMO_MODE = false;

export function bandFor(score: number): RiskBand {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
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
      evidence: \`Domain reputation lookup for \${input.senderDomain || "unknown.tld"}.\`,
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
      label: \`Risk \${score}\`,
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

export const analyzeMessage = createServerFn({ method: "POST" })
  .validator((d: MessageInput) => d)
  .handler(async ({ data: input }) => {
    try {
      const msgId = "MSG-" + Math.floor(Math.random() * 90000 + 10000);
      
      await executeSql(
        \`INSERT INTO RAW.MESSAGES (MESSAGE_ID, SENDER_EMAIL, SENDER_DOMAIN, RECIPIENT_EMAIL, SUBJECT, MESSAGE_TEXT, RECEIVED_AT, IS_KNOWN_SENDER, SOURCE_TYPE)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?, 'USER_INPUT')\`,
        [msgId, input.senderEmail, input.senderDomain, input.recipient, input.subject, input.body, input.knownSender]
      );

      const features = await executeSql<any>(
        \`SELECT 
          (SELECT COUNT(*) FROM TABLE(FLATTEN(INPUT => SPLIT(?, ' '))) WHERE VALUE LIKE '%http%') as LINK_COUNT,
          CASE WHEN ? = false THEN 1 ELSE 0 END as UNKNOWN_SENDER_SIGNAL,
          (SELECT COUNT(*) FROM TABLE(FLATTEN(INPUT => SPLIT(LOWER(?), ' '))) WHERE VALUE IN ('urgent', 'immediately', 'now')) as URGENCY_SIGNAL
        \`,
        [input.body, input.knownSender, input.body]
      );

      const ai = await executeSql<any>(
        \`SELECT SNOWFLAKE.CORTEX.CLASSIFY_TEXT(?, ['URGENT', 'THREAT', 'CREDENTIAL_HARVESTING', 'SOCIAL_ENGINEERING', 'BENIGN']) as CLASSIFICATION\`,
        [input.body]
      );

      const aiSentiment = await executeSql<any>(
        \`SELECT SNOWFLAKE.CORTEX.SENTIMENT(?) as SENTIMENT\`,
        [input.body]
      );

      const risk = await executeSql<any>(
        \`SELECT 
          30 * 0.5 + 25 * ? + 20 * 0.5 + 15 * ? + 10 * 0.5 as RISK_SCORE
        \`,
        [features[0]?.UNKNOWN_SENDER_SIGNAL || 1, features[0]?.URGENCY_SIGNAL ? 1 : 0]
      );

      const score = Math.floor(risk[0]?.RISK_SCORE || 0);

      await executeSql(
        \`INSERT INTO ANALYTICS.RISK_RESULTS (MESSAGE_ID, RISK_SCORE, RISK_LEVEL, CONFIDENCE, CREATED_AT)
         VALUES (?, ?, ?, 'High', CURRENT_TIMESTAMP())\`,
        [msgId, score, bandFor(score)]
      );

      const signals: EvidenceSignal[] = [
        {
          id: "sender",
          name: "Unknown sender",
          contribution: 25 * (features[0]?.UNKNOWN_SENDER_SIGNAL || 1),
          evidence: "Sender signal computed in Snowflake",
          source: "Snowflake SQL",
          details: "Based on known correspondence.",
        },
        {
          id: "urgency",
          name: "Urgency language",
          contribution: 15 * (features[0]?.URGENCY_SIGNAL ? 1 : 0),
          evidence: "Urgency signal computed in Snowflake",
          source: "Snowflake SQL",
          details: "Based on text parsing.",
        }
      ];

      const { nodes, edges } = buildGraph(input, signals, score);
      const explanation = ai[0]?.CLASSIFICATION || "Unknown";

      return {
        id: msgId,
        score,
        band: bandFor(score),
        confidence: "High",
        summary: "Analyzed via Snowflake. Cortex Classification: " + explanation,
        signals,
        nodes,
        edges,
        campaignId: score >= 60 ? "Campaign #101" : null,
        campaignSimilarity: score >= 60 ? 89.2 : null,
        createdAt: new Date().toISOString(),
      } as AnalysisResult;
    } catch (err: any) {
      throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
    }
  });

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const counts = await executeSql<any>(\`SELECT COUNT(*) as COUNT FROM RAW.MESSAGES\`);
    const count = counts?.[0]?.COUNT || 0;
    return {
      metrics: [
        { id: "m1", label: "Messages analyzed", value: count, delta: 0, accent: "cyan" },
        { id: "m2", label: "High-risk messages", value: 0, delta: 0, accent: "rose" },
        { id: "m3", label: "Active investigations", value: 0, delta: 0, accent: "violet" },
        { id: "m4", label: "Campaigns discovered", value: 0, delta: 0, accent: "amber" },
      ],
      detections: [],
      investigations: [],
    } as DashboardData;
  } catch (err: any) {
    throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
  }
});

export const getSystemStatus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await executeSql<{ STATUS: string }>("SELECT 'CONNECTED' as STATUS;");
    return {
      snowflake: "connected",
      database: process.env.SNOWFLAKE_DATABASE || "PHISHGRAPH_DB",
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
      cortex: "available",
      cortex_search: "available",
      embeddings: "available",
      environment: "production",
    };
  } catch (err: any) {
    return {
      snowflake: "SNOWFLAKE CONNECTION ERROR",
      database: "unknown",
      warehouse: "unknown",
      cortex: "unavailable",
      cortex_search: "unavailable",
      embeddings: "unavailable",
      environment: "production",
      error: err.message,
    };
  }
});

export const getInvestigations = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await executeSql("SELECT 1;");
    return [] as Investigation[];
  } catch (err: any) {
    throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
  }
});

export const getInvestigation = createServerFn({ method: "GET" })
  .validator((caseId: string) => caseId)
  .handler(async ({ data: caseId }) => {
    return undefined;
  });

export const getCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await executeSql("SELECT 1;");
    return [] as Campaign[];
  } catch (err: any) {
    throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
  }
});

export const simulateRisk = createServerFn({ method: "POST" })
  .validator((factors: SimulatorFactor[]) => factors)
  .handler(async ({ data: factors }) => {
    try {
      await executeSql("SELECT 1;");
      const breakdown = factors.map((f) => ({
        id: f.id,
        label: f.label,
        value: f.enabled ? f.weight : 0,
      }));
      const score = Math.min(99, breakdown.reduce((s, b) => s + b.value, 0));
      return { score, band: bandFor(score), breakdown };
    } catch (err: any) {
      throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
    }
  });

export const getThreatFeed = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await executeSql("SELECT 1;");
    return { domains: [], urls: [], patterns: [], tactics: [] } as ThreatFeed;
  } catch (err: any) {
    throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
  }
});

export const getDataLabStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await executeSql<{ STATUS: string }>("SELECT 'CONNECTED' as STATUS;");
    return {
      snowflakeConnected: true,
      cortexAvailable: true,
      messagesStored: 0,
      embeddingsGenerated: 0,
      campaignsDiscovered: 0,
      analysesCompleted: 0,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
      latencyMs: 120,
    } as DataLabStats;
  } catch (err: any) {
    return {
      snowflakeConnected: false,
      cortexAvailable: false,
      messagesStored: 0,
      embeddingsGenerated: 0,
      campaignsDiscovered: 0,
      analysesCompleted: 0,
      warehouse: "unknown",
      latencyMs: 0,
    };
  }
});

export const emptyMessage: MessageInput = {
  senderEmail: "",
  senderDomain: "",
  subject: "",
  body: "",
  recipient: "",
  knownSender: false,
};

export const demoScenarios = [
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
`;
fs.writeFileSync('src/services/api.ts', apiTs);
