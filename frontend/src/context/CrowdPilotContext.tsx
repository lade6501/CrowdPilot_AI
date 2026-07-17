import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

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
  status: "review" | "pending" | "auto_executed" | "failed_governance" | "approved" | "denied" | "resolved_by_governance";
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

interface SimulationResult {
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

interface AnnouncementResult {
  situation: string;
  tone: string;
  audience: string;
  english: string;
  spanish: string;
  french: string;
  portuguese: string;
  hindi: string;
}

interface CrowdPilotContextType {
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
  uploadResult: { parsed_gates: Record<string, Gate>; analysis: AISummary } | null;
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
}

const CrowdPilotContext = createContext<CrowdPilotContextType | undefined>(undefined);

export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || (window as any).process?.env?.BASE_URL || "http://localhost:8000";
  return envUrl.replace(/\/$/, "");
};

export const getWsUrl = () => {
  const baseUrl = getBaseUrl();
  if (baseUrl.startsWith("https://")) {
    return baseUrl.replace("https://", "wss://");
  }
  if (baseUrl.startsWith("http://")) {
    return baseUrl.replace("http://", "ws://");
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
};

const API_BASE = getBaseUrl();
const WS_BASE = getWsUrl();

export const CrowdPilotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [activeTimeSlot, setActiveTimeSlot] = useState<string>("Live Feed");
  
  
  const [approvedRecIds, setApprovedRecIds] = useState<string[]>([]);
  const [dismissedRecIds, setDismissedRecIds] = useState<string[]>([]);

  
  const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [announcementLoading, setAnnouncementLoading] = useState<boolean>(false);
  const [announcementResult, setAnnouncementResult] = useState<AnnouncementResult | null>(null);

  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  
  const updateAutonomyLevel = useCallback(async (level: string) => {
    try {
      await fetch(`${API_BASE}/api/autonomy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
    } catch (e) {
      console.error("Failed to update autonomy:", e);
    }
  }, []);

  const approveAction = useCallback(async (actionId: string) => {
    try {
      await fetch(`${API_BASE}/api/actions/${actionId}/approve`, {
        method: "POST",
      });
    } catch (e) {
      console.error("Failed to approve action:", e);
    }
  }, []);

  const denyAction = useCallback(async (actionId: string) => {
    try {
      await fetch(`${API_BASE}/api/actions/${actionId}/deny`, {
        method: "POST",
      });
    } catch (e) {
      console.error("Failed to deny action:", e);
    }
  }, []);

  const deployScenarioPlan = useCallback(async (planSummary: string) => {
    try {
      await fetch(`${API_BASE}/api/actions/deploy-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_summary: planSummary }),
      });
    } catch (e) {
      console.error("Failed to deploy plan:", e);
    }
  }, []);

  const [injectorLoading, setInjectorLoading] = useState<boolean>(false);
  const [orchestrateLoading, setOrchestrateLoading] = useState<boolean>(false);
  const [appLanguage, setAppLanguage] = useState<"en" | "es" | "fr" | "hi">("en");
  const [translationCache, setTranslationCache] = useState<Record<string, Record<string, string>>>({});

  const translateText = useCallback(async (text: string, targetLang: string): Promise<string> => {
    if (!text || targetLang === "en") return text;
    if (translationCache[targetLang]?.[text]) {
      return translationCache[targetLang][text];
    }
    const staticMap: Record<string, Record<string, string>> = {
      "es": {
        "Reroute incoming traffic from Gate B to adjacent entrances. Deploy digital directional signage.": "Desviar el tráfico entrante de la Puerta B a las entradas adyacentes. Desplegar señalización direccional digital.",
        "Reroute incoming traffic from Gate A to adjacent entrances. Deploy digital directional signage.": "Desviar el tráfico entrante de la Puerta A a las entradas adyacentes. Desplegar señalización direccional digital.",
        "Reroute incoming traffic from Gate C to adjacent entrances. Deploy digital directional signage.": "Desviar el tráfico entrante de la Puerta C a las entradas adyacentes. Desplegar señalización direccional digital.",
        "Reroute incoming traffic from Gate D to adjacent entrances. Deploy digital directional signage.": "Desviar el tráfico entrante de la Puerta D a las entradas adyacentes. Desplegar señalización direccional digital.",
        "Increase gate steward presence and open additional express lanes to handle arrival wave.": "Aumentar la presencia de auxiliares de puerta y abrir carriles rápidos adicionales para gestionar la ola de llegadas.",
        "Unlock all outer gate perimeter security checkpoints. Suspend turnstile ticket scans.": "Desbloquear todos los puntos de control de seguridad del perímetro exterior de las puertas. Suspender los escaneos de boletos en los torniquetes.",
        "Clear stadium plazas immediately. Guide fans to concourse shelter zones.": "Despejar las plazas del estadio de inmediato. Guiar a los aficionados a las zonas de refugio del vestíbulo."
      },
      "fr": {
        "Reroute incoming traffic from Gate B to adjacent entrances. Deploy digital directional signage.": "Rediriger le trafic entrant de la Porte B vers les entrées adjacentes. Déployer une signalisation directionnelle numérique.",
        "Reroute incoming traffic from Gate A to adjacent entrances. Deploy digital directional signage.": "Rediriger le trafic entrant de la Porte A vers les entrées adjacentes. Déployer une signalisation directionnelle numérique.",
        "Reroute incoming traffic from Gate C to adjacent entrances. Deploy digital directional signage.": "Rediriger le trafic entrant de la Porte C vers les entrées adjacentes. Déployer une signalisation directionnelle numérique.",
        "Reroute incoming traffic from Gate D to adjacent entrances. Deploy digital directional signage.": "Rediriger le trafic entrant de la Porte D vers les entrées adjacentes. Déployer une signalisation directionnelle numérique.",
        "Increase gate steward presence and open additional express lanes to handle arrival wave.": "Augmenter la présence des stewards aux portes et ouvrir des voies express supplémentaires pour absorber la vague d'arrivée.",
        "Unlock all outer gate perimeter security checkpoints. Suspend turnstile ticket scans.": "Déverrouiller tous les points de contrôle de sécurité extérieurs des portes. Suspendre le scan des tickets aux tourniquets.",
        "Clear stadium plazas immediately. Guide fans to concourse shelter zones.": "Évacuer immédiatement les esplanades du stade. Guider les supporters vers les zones de refuge des halls."
      },
      "hi": {
        "Reroute incoming traffic from Gate B to adjacent entrances. Deploy digital directional signage.": "गेट B से आने वाले ट्रैफ़िक को आस-पास के प्रवेश द्वारों पर पुनर्निर्देशित करें। डिजिटल दिशा-निर्देश बोर्ड तैनात करें।",
        "Reroute incoming traffic from Gate A to adjacent entrances. Deploy digital directional signage.": "गेट A से आने वाले ट्रैफ़िक को आस-पास के प्रवेश द्वारों पर पुनर्निर्देशित करें। डिजिटल दिशा-निर्देश बोर्ड तैनात करें।",
        "Reroute incoming traffic from Gate C to adjacent entrances. Deploy digital directional signage.": "गेट C से आने वाले ट्रैफ़िक को आस-पास के प्रवेश द्वारों पर पुनर्निर्देशित करें। डिजिटल दिशा-निर्देश बोर्ड तैनात करें।",
        "Reroute incoming traffic from Gate D to adjacent entrances. Deploy digital directional signage.": "गेट D से आने वाले ट्रैफ़िक को आस-पास के प्रवेश द्वारों पर पुनर्निर्देशित करें। डिजिटल दिशा-निर्देश बोर्ड तैनात करें।",
        "Increase gate steward presence and open additional express lanes to handle arrival wave.": "गेट सहायकों की उपस्थिति बढ़ाएं और आगमन की भीड़ से निपटने के लिए अतिरिक्त एक्सप्रेस लेन खोलें।",
        "Unlock all outer gate perimeter security checkpoints. Suspend turnstile ticket scans.": "बाहरी द्वार के सभी सुरक्षा चौकियों को अनलॉक करें। टिकट स्कैनिंग को निलंबित करें।",
        "Clear stadium plazas immediately. Guide fans to concourse shelter zones.": "स्टेडियम के खुले मैदान को तुरंत खाली कराएं। प्रशंसकों को कंक्रीट शरण क्षेत्रों में ले जाएं।"
      }
    };
    if (staticMap[targetLang]?.[text]) {
      return staticMap[targetLang][text];
    }
    try {
      const res = await fetch(`${API_BASE}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_lang: targetLang })
      });
      const data = await res.json();
      const translated = data.translated_text || text;
      setTranslationCache(prev => ({
        ...prev,
        [targetLang]: {
          ...(prev[targetLang] || {}),
          [text]: translated
        }
      }));
      return translated;
    } catch (e) {
      console.error("AI translation API failed:", e);
      return text;
    }
  }, [translationCache]);

  
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWS = () => {
      ws = new WebSocket(`${WS_BASE}/ws/events`);

      ws.onopen = () => {
        setConnected(true);
        console.log("WebSocket connected to CrowdPilot operations engine.");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "state_sync") {
            setTick(payload.tick);
            setStadiumState(payload.state);
            
            
            if (payload.state.mode === "replay") {
              const times = {"19:00:00": "7:00 PM", "19:30:00": "7:30 PM", "20:00:00": "8:00 PM", "21:00:00": "9:00 PM"};
              const matchedSlot = (times as any)[payload.state.timestamp];
              if (matchedSlot) {
                setActiveTimeSlot(matchedSlot);
              }
            } else {
              setActiveTimeSlot("Live Feed");
            }
          }
        } catch (e) {
          console.error("Error parsing WebSocket event:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("WebSocket disconnected. Reconnecting in 3 seconds...");
        reconnectTimeout = setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const selectReplaySlot = useCallback(async (slot: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time_slot: slot }),
      });
      if (!response.ok) throw new Error("Replay shift failed");
      setActiveTimeSlot(slot);
    } catch (e) {
      console.error(e);
      alert("Error shifting replay: " + e);
    }
  }, []);

  const resetToLive = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/resume`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Resume shift failed");
      setActiveTimeSlot("Live Feed");
    } catch (e) {
      console.error(e);
      alert("Error resuming live feed: " + e);
    }
  }, []);

  const injectIncident = useCallback(async (incidentType: string) => {
    setInjectorLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/inject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident_type: incidentType }),
      });
      if (!response.ok) throw new Error("Incident injection failed");
    } catch (e) {
      console.error(e);
      alert("Error injecting incident: " + e);
    } finally {
      setInjectorLoading(false);
    }
  }, []);

  
  const approveRecommendation = useCallback((id: string) => {
    setApprovedRecIds((prev) => [...prev, id]);
  }, []);

  const dismissRecommendation = useCallback((id: string) => {
    setDismissedRecIds((prev) => [...prev, id]);
  }, []);

  const runSimulation = useCallback(async (scenario: string) => {
    setSimulationLoading(true);
    setSimulationResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      if (!response.ok) throw new Error("Simulation failed");
      const data = await response.json();
      setSimulationResult(data);
    } catch (e) {
      console.error(e);
      alert("Error executing scenario simulation: " + e);
    } finally {
      setSimulationLoading(false);
    }
  }, []);

  const clearSimulation = useCallback(() => {
    setSimulationResult(null);
  }, []);

  const generateAnnouncement = useCallback(async (situation: string, tone: string, audience: string) => {
    setAnnouncementLoading(true);
    setAnnouncementResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/announcement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, tone, audience }),
      });
      if (!response.ok) throw new Error("Announcement generation failed");
      const data = await response.json();
      setAnnouncementResult(data);
    } catch (e) {
      console.error(e);
      alert("Error generating announcements: " + e);
    } finally {
      setAnnouncementLoading(false);
    }
  }, []);

  const clearAnnouncement = useCallback(() => {
    setAnnouncementResult(null);
  }, []);

  const uploadCSV = useCallback(async (file: File) => {
    setUploadLoading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("CSV Upload and Analysis failed");
      const data = await response.json();
      setUploadResult(data);
    } catch (e) {
      console.error(e);
      alert("Error analyzing CSV: " + e);
    } finally {
      setUploadLoading(false);
    }
  }, []);

  const clearUpload = useCallback(() => {
    setUploadResult(null);
  }, []);

  const triggerAI = useCallback(async () => {
    setOrchestrateLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/orchestrate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Manual AI orchestration failed");
    } catch (e) {
      console.error(e);
      alert("Error executing AI orchestration: " + e);
    } finally {
      setOrchestrateLoading(false);
    }
  }, []);

  
  const filteredStadiumState = stadiumState ? {
    ...stadiumState,
    ai_summary: stadiumState.ai_summary ? {
      ...stadiumState.ai_summary,
      recommendations: stadiumState.ai_summary.recommendations.filter(
        (rec) => !dismissedRecIds.includes(rec.id)
      )
    } : undefined
  } : null;

  return (
    <CrowdPilotContext.Provider
      value={{
        connected,
        tick,
        stadiumState: filteredStadiumState,
        selectedGate,
        setSelectedGate,
        activeTimeSlot,
        selectReplaySlot,
        resetToLive,
        injectorLoading,
        injectIncident,
        approvedRecIds,
        approveRecommendation,
        dismissRecommendation,
        simulationLoading,
        simulationResult,
        runSimulation,
        clearSimulation,
        announcementLoading,
        announcementResult,
        generateAnnouncement,
        clearAnnouncement,
        uploadLoading,
        uploadResult,
        uploadCSV,
        clearUpload,
        orchestrateLoading,
        triggerAI,
        appLanguage,
        setAppLanguage,
        updateAutonomyLevel,
        approveAction,
        denyAction,
        deployScenarioPlan,
        translateText,
      }}
    >
      {children}
    </CrowdPilotContext.Provider>
  );
};

export const useCrowdPilot = () => {
  const context = useContext(CrowdPilotContext);
  if (context === undefined) {
    throw new Error("useCrowdPilot must be used within a CrowdPilotProvider");
  }
  return context;
};
