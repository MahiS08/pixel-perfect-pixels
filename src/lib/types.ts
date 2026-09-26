export type RiskBand = "critical" | "high" | "medium" | "low";

export interface EvidenceSignal {
  id: string;
  name: string;
  contribution: number;
  evidence: string;
  source: "Snowflake SQL" | "Snowflake Cortex" | "Vector Engine";
  details: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: "sender" | "domain" | "message" | "keywords" | "urgency" | "url" | "tactics" | "risk";
  x: number;
  y: number;
  suspicious: boolean;
  evidence: string;
  step: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface MessageInput {
  senderEmail: string;
  senderDomain: string;
  subject: string;
  body: string;
  recipient?: string;
  knownSender: boolean;
}

export interface AnalysisResult {
  id: string;
  score: number;
  band: RiskBand;
  confidence: "High" | "Medium" | "Low";
  summary: string;
  signals: EvidenceSignal[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  campaignId: string | null;
  campaignSimilarity: number | null;
  createdAt: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  delta: number;
  unit?: string;
  accent: "cyan" | "rose" | "violet" | "amber" | "emerald";
}

export interface Detection {
  id: string;
  time: string;
  sender: string;
  subject: string;
  score: number;
  band: RiskBand;
  campaign: string | null;
}

export interface Investigation {
  id: string;
  caseId: string;
  timestamp: string;
  sender: string;
  subject: string;
  score: number;
  band: RiskBand;
  campaign: string | null;
  status: "Open" | "Triage" | "Contained" | "Closed";
  analyst: string;
  notes: string[];
}

export interface DashboardData {
  metrics: DashboardMetric[];
  detections: Detection[];
  investigations: Investigation[];
}

export interface Campaign {
  id: string;
  name: string;
  similarity: number;
  messages: string[];
  commonLanguage: string[];
  commonDomain: string;
  commonTactics: string[];
  urlPattern: string;
  firstSeen: string;
  volume: number;
}

export interface SimulatorFactor {
  id: string;
  label: string;
  weight: number;
  enabled: boolean;
  explanation: string;
}

export interface ThreatFeedItem {
  id: string;
  value: string;
  detail: string;
  count: number;
  severity: RiskBand;
  time: string;
}

export interface ThreatFeed {
  domains: ThreatFeedItem[];
  urls: ThreatFeedItem[];
  patterns: ThreatFeedItem[];
  tactics: { name: string; share: number }[];
}

export interface DataLabStats {
  snowflakeConnected: boolean;
  cortexAvailable: boolean;
  messagesStored: number;
  embeddingsGenerated: number;
  campaignsDiscovered: number;
  analysesCompleted: number;
  warehouse: string;
  latencyMs: number;
}
