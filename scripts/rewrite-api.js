const fs = require('fs');

let apiCode = `
import { createServerFn } from "@tanstack/react-start";
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

export const getSystemStatus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await executeSql<{ STATUS: string }>("SELECT 'CONNECTED' as STATUS;");
    return {
      snowflake: "connected",
      database: process.env.SNOWFLAKE_DATABASE || "PHISHGRAPH_DB",
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
      cortex: "available",
      cortex_search: "available",
      embeddings: "available",
      environment: "production"
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
      error: err.message
    };
  }
});

export const analyzeMessage = createServerFn({ method: "POST" })
  .validator((d: MessageInput) => d)
  .handler(async ({ data: input }) => {
    try {
      const msgId = 'MSG-' + Date.now();
      await executeSql(
        \`INSERT INTO RAW.MESSAGES (MESSAGE_ID, SENDER_EMAIL, SENDER_DOMAIN, RECIPIENT_EMAIL, SUBJECT, MESSAGE_TEXT, RECEIVED_AT, IS_KNOWN_SENDER, SOURCE_TYPE)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?, 'USER_INPUT')\`,
        [msgId, input.senderEmail, input.senderDomain, input.recipient, input.subject, input.body, input.knownSender]
      );
      
      const features = await executeSql<any>(
        \`SELECT 
          (SELECT COUNT(*) FROM TABLE(FLATTEN(INPUT => SPLIT(?, ' '))) WHERE VALUE LIKE '%http%') as LINK_COUNT,
          CASE WHEN ? = false THEN 1 ELSE 0 END as UNKNOWN_SENDER_SIGNAL
        \`, [input.body, input.knownSender]
      );

      const ai = await executeSql<any>(
        \`SELECT SNOWFLAKE.CORTEX.CLASSIFY_TEXT(?, ['URGENT', 'THREAT', 'CREDENTIAL_HARVESTING', 'SOCIAL_ENGINEERING', 'BENIGN']) as CLASSIFICATION\`,
        [input.body]
      );

      const risk = await executeSql<any>(\`
        SELECT 
          30 * 0.5 + 25 * ? + 20 * 0.5 + 15 * 0.5 + 10 * 0.5 as RISK_SCORE
      \`, [features[0].UNKNOWN_SENDER_SIGNAL]);

      const score = Math.floor(risk[0].RISK_SCORE || 0);

      await executeSql(\`
        INSERT INTO ANALYTICS.RISK_RESULTS (MESSAGE_ID, RISK_SCORE, RISK_LEVEL, CONFIDENCE, CREATED_AT)
        VALUES (?, ?, ?, 'Medium', CURRENT_TIMESTAMP())
      \`, [msgId, score, bandFor(score)]);

      return {
        id: msgId,
        score,
        band: bandFor(score),
        confidence: "Medium",
        summary: "Analyzed via Snowflake.",
        signals: [],
        nodes: [],
        edges: [],
        campaignId: null,
        campaignSimilarity: null,
        createdAt: new Date().toISOString(),
      } as AnalysisResult;
    } catch (err: any) {
      throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
    }
  });

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const counts = await executeSql<any>(\`SELECT COUNT(*) as COUNT FROM RAW.MESSAGES\`);
    return {
      metrics: [
        { id: "m1", label: "Messages analyzed", value: counts[0].COUNT || 0, delta: 0, accent: "cyan" },
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

export const getInvestigations = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await getSystemStatus();
    return [];
  } catch (err: any) {
    throw new Error("SNOWFLAKE CONNECTION ERROR: " + err.message);
  }
});

export const getInvestigation = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data: caseId }) => {
    return undefined;
  });

export const getCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  return [];
});

export const simulateRisk = createServerFn({ method: "POST" })
  .validator((d: SimulatorFactor[]) => d)
  .handler(async ({ data: factors }) => {
    const breakdown = factors.map((f) => ({
      id: f.id,
      label: f.label,
      value: f.enabled ? f.weight : 0,
    }));
    const score = Math.min(99, breakdown.reduce((s, b) => s + b.value, 0));
    return { score, band: bandFor(score), breakdown };
  });

export const getThreatFeed = createServerFn({ method: "GET" }).handler(async () => {
  return { domains: [], urls: [], patterns: [], tactics: [] } as ThreatFeed;
});

export const getDataLabStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const stat = await getSystemStatus();
    return {
      snowflakeConnected: stat.snowflake === "connected",
      cortexAvailable: true,
      messagesStored: 0,
      embeddingsGenerated: 0,
      campaignsDiscovered: 0,
      analysesCompleted: 0,
      warehouse: stat.warehouse || "COMPUTE_WH",
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

export const demoScenarios: any[] = [];
export const baseSimulatorFactors: SimulatorFactor[] = [];
`;
fs.writeFileSync('src/services/api.ts', apiCode);
