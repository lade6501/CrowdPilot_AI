import { createContext } from "react";

export interface Gate {
  occupancy: number;
  queue: number;
  flow_rate: number;
}

export interface ParkingLot {
  occupancy: number;
  capacity: number;
}

export interface Weather {
  condition: string;
  temp: number;
  humidity: number;
  wind_speed: number;
  alerts: string[];
}

export interface Incident {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "active" | "resolved";
}

export interface Metro {
  status: string;
  delay_minutes: number;
  line: string;
}

export interface OperationalAsset {
  id: string;
  type: "medic" | "shuttle" | "security" | string;
  label: string;
  status: string;
  x: number;
  y: number;
  gate?: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  problem: string;
  reason: string;
  suggested_action: string;
  expected_outcome: string;
  confidence: number;
}

export interface PrioritizedIncidentSummary {
  incident_id: string;
  title: string;
  priority: string;
  reasoning: string;
}

export interface AISummary {
  overall_status: "normal" | "warning" | "critical";
  safety_index: number;
  efficiency_score: number;
  recommendations: RecommendationItem[];
  prioritized_incidents: PrioritizedIncidentSummary[];
  crowd_hotspots: string[];
}

export interface MatchScoreboard {
  teams: string;
  score: string;
  time_label: string;
  detail: string;
}

export interface AgentAction {
  id: string;
  proposer: string;
  why: string;
  action: string;
  risk_level: "Low" | "Medium" | "High";
  status: "review" | "pending" | "auto_executed" | "failed_governance" | "approved" | "denied" | "resolved_by_governance" | "executed";
  timestamp: string;
  verification_status: "not_started" | "pending" | "success" | "failed";
  verification_result: string;
  governance_check: "review" | "passed" | "failed";
  governance_details: string;
  target_metric?: string;
  initial_value?: number;
}

export interface StadiumState {
  mode: "live" | "replay";
  timestamp: string;
  match: MatchScoreboard;
  gates: Record<string, Gate>;
  parking: Record<string, ParkingLot>;
  weather: Weather;
  incidents: Incident[];
  metro: Metro;
  assets?: OperationalAsset[];
  ai_summary?: AISummary;
  ai_error?: string | null;
  actions_queue?: AgentAction[];
  autonomy_level?: "suggest_only" | "auto_execute_low" | "full_autonomous";
  calibration_diff?: string;
  auto_draft_announcement?: {
    situation: string;
    audience: string;
    tone: string;
  } | null;
  quota_limited?: boolean;
  quota_countdown?: number;
  sla_countdown?: number | null;
  overall_status?: string;
  ai_ops_calls?: number;
  safety_index?: number;
  efficiency_score?: number;
}

export interface SimulationResult {
  scenario: string;
  summary: string;
  average_delay_change_mins: number;
  impact_metrics: Array<{
    gate_name: string;
    occupancy_change_percent: number;
    queue_time_change_mins: number;
    projected_status: string;
  }>;
  recommendations: string[];
  confidence_score: number;
}

export interface AnnouncementResult {
  situation: string;
  tone: string;
  audience: string;
  english: string;
  spanish: string;
  french: string;
  portuguese: string;
  hindi: string;
}

export interface UploadResult {
  parsed_gates: Record<string, Gate>;
  analysis: AISummary;
}

export interface CrowdPilotContextType {
  connected: boolean;
  tick: number;
  stadiumState: StadiumState | null;
  selectedGate: string | null;
  setSelectedGate: (gate: string | null) => void;
  activeTimeSlot: string;
  selectReplaySlot: (slot: string) => Promise<void>;
  resetToLive: () => Promise<void>;
  injectorLoading: boolean;
  injectIncident: (incidentType: string) => Promise<void>;
  approvedRecIds: string[];
  approveRecommendation: (id: string) => void;
  dismissRecommendation: (id: string) => void;
  simulationLoading: boolean;
  simulationResult: SimulationResult | null;
  runSimulation: (scenario: string) => Promise<void>;
  clearSimulation: () => void;
  announcementLoading: boolean;
  announcementResult: AnnouncementResult | null;
  generateAnnouncement: (situation: string, tone: string, audience: string) => Promise<void>;
  clearAnnouncement: () => void;
  uploadLoading: boolean;
  uploadResult: UploadResult | null;
  uploadCSV: (file: File) => Promise<void>;
  clearUpload: () => void;
  orchestrateLoading: boolean;
  triggerAI: () => Promise<void>;
  appLanguage: "en" | "es" | "fr" | "hi";
  setAppLanguage: (lang: "en" | "es" | "fr" | "hi") => void;
  updateAutonomyLevel: (level: string) => Promise<void>;
  approveAction: (actionId: string) => Promise<void>;
  denyAction: (actionId: string) => Promise<void>;
  deployScenarioPlan: (planSummary: string) => Promise<void>;
  translateText: (text: string, targetLang: string) => Promise<string>;
  voiceAssistEnabled: boolean;
  setVoiceAssistEnabled: (enabled: boolean) => void;
}

export const CrowdPilotContext = createContext<CrowdPilotContextType | undefined>(undefined);
