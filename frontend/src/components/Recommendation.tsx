import React, { useEffect, useState } from "react";
import { useCrowdPilot } from "../context/CrowdPilotContext";
import { translations } from "../utils/translations";
import { Brain, ShieldCheck, Activity, CheckCircle, XCircle, Megaphone, Terminal, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AITranslate } from "./AITranslate";

export const Recommendation: React.FC = () => {
  const { 
    stadiumState, 
    approvedRecIds, 
    approveRecommendation, 
    dismissRecommendation,
    generateAnnouncement,
    orchestrateLoading,
    triggerAI,
    activeTimeSlot,
    appLanguage
  } = useCrowdPilot();

  const [thinkingIndex, setThinkingIndex] = useState<number>(0);
  const [isThinking, setIsThinking] = useState<boolean>(true);

  const t = translations[appLanguage] || translations.en;

  
  const getLocalizedThoughts = () => {
    const hasCalib = stadiumState?.calibration_diff && stadiumState.calibration_diff.includes("adjusted");

    switch (appLanguage) {
      case "es":
        return [
          hasCalib 
            ? "[Agente de Flujo] Umbrales recalibrados del dataset subido. Umbral de Gate B establecido en 18 p/m."
            : "[Especialista de Operaciones] Analizando sensores de telemetría de puertas...",
          "[Inteligencia de Multitudes] Pronosticando velocidades de flujo y colas...",
          "[Evaluación de Riesgos] Evaluando incidentes y alertas meteorológicas...",
          "[Orquestador] Coordinando hallazgos de especialistas...",
          "[Estado] Resumen de operaciones estabilizado."
        ];
      case "fr":
        return [
          hasCalib 
            ? "[Agent de Flux] Seuils recalibrés à partir du dataset téléchargé. Seuil de Gate B réglé à 18 p/m."
            : "[Spécialiste Opérations] Analyse des capteurs de télémétrie des portes...",
          "[Intelligence Foule] Prévision des débits et des arrivées aux files...",
          "[Évaluation Risques] Évaluation des incidents et alertes météo...",
          "[Orchestrateur] Coordination des conclusions des spécialistes...",
          "[Statut] Résumé des opérations stabilisé."
        ];
      case "hi":
        return [
          hasCalib 
            ? "[प्रवाह एजेंट] अपलोड किए गए डेटासेट से सीमाएं पुनः अंशांकित की गईं। गेट बी सीमा 18 लो/मिनट सेट।"
            : "[परिचालन विशेषज्ञ] गेट टेलीमेट्री सेंसर का विश्लेषण किया जा रहा है...",
          "[भीड़ खुफिया] प्रवाह वेग और कतार आगमन के रुझान का अनुमान...",
          "[जोखिम मूल्यांकन] घटनाओं और मौसम अलर्ट का मूल्यांकन...",
          "[आर्केस्ट्रेटर] विशेषज्ञ के निष्कर्षों का समन्वय...",
          "[स्थिति] परिचालन सारांश स्थिर।"
        ];
      default:
        return [
          hasCalib 
            ? "[Crowd Flow Agent] Recalibrated thresholds from uploaded dataset. Gate B threshold set to 18 p/m."
            : "[Operations Specialist] Analyzing gate telemetry sensors...",
          "[Crowd Intelligence] Forecasting flow velocities and queue arrival trends...",
          "[Risk Assessment] Evaluating incidents and weather alerts...",
          "[Orchestrator] Coordinating specialist findings...",
          "[Status] Operations summary stabilized."
        ];
    }
  };

  const thinkingThoughts = getLocalizedThoughts();

  
  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => {
        if (prev === thinkingThoughts.length - 1) {
          setIsThinking(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isThinking, thinkingThoughts]);

  
  useEffect(() => {
    setThinkingIndex(0);
    setIsThinking(true);
  }, [activeTimeSlot]);

  
  useEffect(() => {
    if (orchestrateLoading) {
      setThinkingIndex(0);
      setIsThinking(true);
    }
  }, [orchestrateLoading]);

  if (!stadiumState) return null;

  const { ai_summary } = stadiumState;

  const safetyIndex = stadiumState.safety_index !== undefined ? stadiumState.safety_index : (ai_summary?.safety_index ?? 9.8);
  const efficiencyScore = stadiumState.efficiency_score !== undefined ? stadiumState.efficiency_score : (ai_summary?.efficiency_score ?? 92);
  const overallStatus = stadiumState.overall_status || ai_summary?.overall_status || "normal";

  const getOverallStatusStyles = (status?: string) => {
    switch (status) {
      case "critical":
        return {
          bg: "bg-red-500/10 border-red-500/30",
          text: "text-red-400",
          glow: "neon-border-red",
          label: t.status_critical
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 border-amber-500/30",
          text: "text-amber-400",
          glow: "neon-border-yellow",
          label: t.status_warning
        };
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30",
          text: "text-emerald-400",
          glow: "neon-border-green",
          label: t.status_normal
        };
    }
  };

  const statusStyle = getOverallStatusStyles(overallStatus);

  
  const renderConfidenceBar = (score: number) => {
    const totalSegments = 10;
    const activeSegments = Math.round((score / 100) * totalSegments);
    let bar = "";
    for (let i = 0; i < totalSegments; i++) {
      bar += i < activeSegments ? "█" : "░";
    }
    return bar;
  };

  return (
    <div className="space-y-6">
      {}
      <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${statusStyle.bg} ${statusStyle.glow}`}>
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-current animate-ping relative">
            <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Stadium Operations State</span>
            <span className={`text-sm font-bold uppercase tracking-wider ${statusStyle.text}`}>{statusStyle.label}</span>
          </div>
        </div>

        {}
        <div className="flex gap-6">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">{t.rec_safety}</span>
            <span className="text-xl font-extrabold text-gray-100 flex items-center gap-1.5 justify-end">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              {safetyIndex.toFixed(1)}<span className="text-xs text-gray-500 font-normal">/10</span>
            </span>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">{t.rec_efficiency}</span>
            <span className="text-xl font-extrabold text-gray-100 flex items-center gap-1.5 justify-end">
              <Activity className="h-5 w-5 text-fifa-gold" />
              {efficiencyScore}<span className="text-xs text-gray-500 font-normal">%</span>
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-emerald-400 flex items-center gap-2.5 shadow-inner">
        <Terminal className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
        <div className="flex-1 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            {isThinking && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>}
            <span className="text-gray-300">{thinkingThoughts[thinkingIndex]}</span>
          </div>
          <span className="text-[9px] text-slate-500">Orchestrator v2.0</span>
        </div>
      </div>

      {}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
          <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2">
            <Brain className="h-5 w-5 text-fifa-gold" />
            {t.rec_title}
          </h2>
          <button
            type="button"
            onClick={triggerAI}
            disabled={orchestrateLoading}
            className="py-1.5 px-3 rounded-lg bg-fifa-gold hover:bg-yellow-600 disabled:bg-slate-800 text-slate-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
            title="Manually trigger multi-agent analysis on current telemetry"
          >
            {orchestrateLoading ? (
              <span className="h-3.5 w-3.5 animate-spin border-2 border-slate-950 border-t-transparent rounded-full"></span>
            ) : (
              <Brain className="h-3.5 w-3.5" />
            )}
            {orchestrateLoading ? "Analyzing..." : t.rec_run_analysis}
          </button>
        </div>

        {stadiumState.ai_error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400 flex items-center gap-2 mb-4">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>
              <strong>AI reasoning temporarily unavailable</strong> — operating on last verified state.
            </span>
          </div>
        )}

        {stadiumState.quota_limited && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300 flex items-center gap-2 mb-4 animate-pulse">
            <AlertCircle className="h-4.5 w-4.5 text-amber-400 shrink-0" />
            <span>
              <strong>AI Command Recommendations paused</strong> (quota limit reached). Resuming in{" "}
              <strong className="text-fifa-gold font-mono">{stadiumState.quota_countdown ?? 30}s</strong>. Operating on fallback local models.
            </span>
          </div>
        )}

        {!ai_summary || !ai_summary.recommendations || ai_summary.recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center space-y-4">
            <div className="animate-pulse rounded-full p-4 bg-slate-900 border border-white/5">
              <Brain className="h-8 w-8 text-gray-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">{t.rec_no_active}</p>
              <p className="text-xs opacity-75 mt-1 max-w-sm mx-auto leading-relaxed">
                {t.rec_no_active_desc}
              </p>
            </div>
            
            <button
              type="button"
              onClick={triggerAI}
              disabled={orchestrateLoading}
              className="py-2.5 px-4 bg-fifa-gold hover:bg-yellow-600 disabled:bg-slate-800 text-slate-950 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg"
            >
              {orchestrateLoading ? (
                <span className="h-4 w-4 animate-spin border-2 border-slate-950 border-t-transparent rounded-full"></span>
              ) : (
                <Brain className="h-4.5 w-4.5" />
              )}
              {orchestrateLoading ? "Running Multi-Agent Synthesis..." : t.rec_trigger}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {ai_summary.recommendations.map((rec) => {
                const isApproved = approvedRecIds.includes(rec.id);
                
                return (
                  <motion.div 
                    key={rec.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`rounded-xl border relative overflow-hidden transition-all duration-300 ${
                      isApproved 
                        ? "border-emerald-500/30 bg-emerald-950/10" 
                        : "border-white/5 bg-slate-950/40"
                    }`}
                  >
                    {}
                    <div className="p-4 bg-slate-900/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          Critical
                        </span>
                        <span className="text-sm font-extrabold text-gray-100"><AITranslate text={rec.title} /></span>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="text-[9px] text-gray-500 block uppercase font-bold">Predicted peak</span>
                          <span className="font-extrabold text-red-400">95%</span>
                        </div>
                        <div className="text-right border-l border-white/10 pl-4">
                          <span className="text-[9px] text-gray-500 block uppercase font-bold">ETA</span>
                          <span className="font-extrabold text-gray-300">6 min</span>
                        </div>
                      </div>
                    </div>

                    {}
                    {isApproved ? (
                      <div className="p-5 flex items-start gap-3 text-xs">
                        <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-400 block mb-0.5">{t.rec_executed}</span>
                          <p className="text-gray-300">
                            {t.rec_executed_desc}
                            <strong className="text-emerald-400 ml-1">{t.rec_stabilized}</strong>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
                          {}
                          <div className="space-y-1">
                            <span className="text-[10px] text-fifa-gold font-bold uppercase tracking-widest block">
                              {t.rec_why}
                            </span>
                            <p className="text-gray-300 bg-slate-900/60 p-2.5 rounded-lg border border-white/5 italic font-medium">
                              "<AITranslate text={rec.reason} />"
                            </p>
                          </div>

                          {}
                          <div className="space-y-1">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                              {t.rec_action}
                            </span>
                            <p className="text-gray-300 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                              <AITranslate text={rec.suggested_action} />
                            </p>
                          </div>

                          {}
                          <div className="space-y-1">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block">
                              {t.rec_impact}
                            </span>
                            <p className="text-gray-300 bg-slate-900/60 p-2.5 rounded-lg border border-white/5 font-semibold text-center text-sm text-blue-400 flex items-center justify-center h-[68px]">
                              <AITranslate text={rec.expected_outcome.includes("31%") ? "31% reduction in congestion" : rec.expected_outcome} />
                            </p>
                          </div>
                        </div>

                        {}
                        <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                          <div className="text-xs space-y-1 max-w-[280px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-500 uppercase font-bold">{t.rec_confidence}</span>
                              <code className="text-fifa-gold font-black tracking-widest">
                                {renderConfidenceBar(rec.confidence)}
                              </code>
                              <span className="font-extrabold text-fifa-gold">{rec.confidence}%</span>
                            </div>
                            <span className="text-[9px] text-slate-500 block">{t.rec_factors}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => approveRecommendation(rec.id)}
                              className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> {t.rec_approve}
                            </button>
                            <button
                              onClick={() => dismissRecommendation(rec.id)}
                              className="py-1.5 px-3 rounded-lg bg-slate-900 border border-white/5 hover:border-white/20 text-gray-400 hover:text-gray-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                            >
                              <XCircle className="h-3.5 w-3.5" /> {t.rec_dismiss}
                            </button>
                            <button
                              onClick={() => generateAnnouncement(rec.problem, "Calm", "International Visitors")}
                              className="py-1.5 px-3 rounded-lg bg-slate-900 border border-fifa-gold/20 hover:border-fifa-gold text-fifa-gold hover:bg-fifa-gold/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Megaphone className="h-3.5 w-3.5" /> {t.rec_broadcast}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
