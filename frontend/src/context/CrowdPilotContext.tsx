import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { getBaseUrl, getWsUrl } from "../utils/api";
import { recommendationTranslations } from "../utils/recommendationTranslations";
import type { AppLang } from "../utils/translations";
import { CrowdPilotContext } from "./CrowdPilotContextInstance";
import type {
  StadiumState,
  SimulationResult,
  AnnouncementResult,
  UploadResult,
} from "./CrowdPilotContextInstance";

const API_BASE = getBaseUrl();
const WS_BASE = getWsUrl();
const REPLAY_SLOT_BY_TIMESTAMP: Record<string, string> = {
  "19:00:00": "7:00 PM",
  "19:30:00": "7:30 PM",
  "20:00:00": "8:00 PM",
  "21:00:00": "9:00 PM",
};

export const CrowdPilotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [activeTimeSlot, setActiveTimeSlot] = useState<string>("Live Feed");
  const [voiceAssistEnabled, setVoiceAssistEnabled] = useState<boolean>(true);
  
  
  const [approvedRecIds, setApprovedRecIds] = useState<string[]>([]);
  const [dismissedRecIds, setDismissedRecIds] = useState<string[]>([]);

  
  const [simulationLoading, setSimulationLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [announcementLoading, setAnnouncementLoading] = useState<boolean>(false);
  const [announcementResult, setAnnouncementResult] = useState<AnnouncementResult | null>(null);

  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  
  const updateAutonomyLevel = useCallback(async (level: string) => {
    try {
      await fetch(`${API_BASE}/api/autonomy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
    } catch {
      
    }
  }, []);

  const approveAction = useCallback(async (actionId: string) => {
    try {
      await fetch(`${API_BASE}/api/actions/${actionId}/approve`, {
        method: "POST",
      });
    } catch {
      
    }
  }, []);

  const denyAction = useCallback(async (actionId: string) => {
    try {
      await fetch(`${API_BASE}/api/actions/${actionId}/deny`, {
        method: "POST",
      });
    } catch {
      
    }
  }, []);

  const deployScenarioPlan = useCallback(async (planSummary: string) => {
    try {
      await fetch(`${API_BASE}/api/actions/deploy-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_summary: planSummary }),
      });
    } catch {
      
    }
  }, []);

  const [injectorLoading, setInjectorLoading] = useState<boolean>(false);
  const [orchestrateLoading, setOrchestrateLoading] = useState<boolean>(false);
  const [appLanguage, setAppLanguage] = useState<AppLang>("en");
  const [translationCache, setTranslationCache] = useState<Record<string, Record<string, string>>>({});

  const translateText = useCallback(async (text: string, targetLang: string): Promise<string> => {
    if (!text || targetLang === "en") return text;
    if (translationCache[targetLang]?.[text]) {
      return translationCache[targetLang][text];
    }
    if (recommendationTranslations[targetLang]?.[text]) {
      return recommendationTranslations[targetLang][text];
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
    } catch {
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
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "state_sync") {
            setTick(payload.tick);
            setStadiumState(payload.state);
            
            
            if (payload.state.mode === "replay") {
              const matchedSlot = REPLAY_SLOT_BY_TIMESTAMP[payload.state.timestamp];
              if (matchedSlot) {
                setActiveTimeSlot(matchedSlot);
              }
            } else {
              setActiveTimeSlot("Live Feed");
            }
          }
        } catch {
          
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connectWS, 4000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.98;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("David") || v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Male")));
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  }, []);

  const prevIncidentIds = useRef<string[]>([]);
  const prevSlaBreached = useRef<boolean>(false);

  useEffect(() => {
    if (!stadiumState || !stadiumState.incidents) return;
    if (!voiceAssistEnabled) {
      prevIncidentIds.current = stadiumState.incidents.map(inc => inc.id);
      return;
    }
    const currentIds = stadiumState.incidents.map(inc => inc.id);
    const newIncidents = stadiumState.incidents.filter(inc => !prevIncidentIds.current.includes(inc.id));
    if (newIncidents.length > 0) {
      const firstNew = newIncidents[0];
      if (firstNew.status === "active") {
        speakText(`Operations Alert. New incident reported: ${firstNew.title}. ${firstNew.description}`);
      } else if (firstNew.status === "resolved") {
        speakText(`Operations Notice. Incident ${firstNew.title} has been resolved.`);
      }
    }
    prevIncidentIds.current = currentIds;
  }, [stadiumState, voiceAssistEnabled, speakText]);

  useEffect(() => {
    if (!stadiumState || stadiumState.sla_countdown === undefined || stadiumState.sla_countdown === null) return;
    const isSlaBreached = stadiumState.sla_countdown === 0;
    if (voiceAssistEnabled && isSlaBreached && !prevSlaBreached.current) {
      speakText("Critical emergency warning. Safety SLA breached. AI Autonomy lockout activated. Operator override required.");
    }
    prevSlaBreached.current = isSlaBreached;
  }, [stadiumState, voiceAssistEnabled, speakText]);

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
      alert("Error executing AI orchestration: " + e);
    } finally {
      setOrchestrateLoading(false);
    }
  }, []);

  
  const filteredStadiumState = useMemo(() => {
    if (!stadiumState) return null;
    return {
      ...stadiumState,
      ai_summary: stadiumState.ai_summary ? {
        ...stadiumState.ai_summary,
        recommendations: stadiumState.ai_summary.recommendations.filter(
          (rec) => !dismissedRecIds.includes(rec.id)
        )
      } : undefined
    };
  }, [dismissedRecIds, stadiumState]);

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
        voiceAssistEnabled,
        setVoiceAssistEnabled,
      }}
    >
      {children}
    </CrowdPilotContext.Provider>
  );
};
