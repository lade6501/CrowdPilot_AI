import React, { useEffect, useState } from "react";
import { useCrowdPilot } from "../hooks/useCrowdPilot";
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

  const [pipelineIndex, setPipelineIndex] = useState<number>(0);
  const [dialogIndex, setDialogIndex] = useState<number>(-1);
  const [isThinking, setIsThinking] = useState<boolean>(true);

  const t = translations[appLanguage] || translations.en;

  const getPipelineSteps = () => {
    switch (appLanguage) {
      case "es":
        return [
          { label: "Observación", text: "Analizando cuadrículas de sensores de puertas y velocidades de colas..." },
          { label: "Detección", text: "Alertas registradas de aviso meteorológico y cierre de metro." },
          { label: "Análisis", text: "Correlacionando curvas de llegada históricas con desbordamientos de estacionamiento." },
          { label: "Predicción", text: "Riesgo de cuello de botella crítico previsto en la Puerta B en 3 minutos." },
          { label: "Verificación", text: "Ejecutando verificaciones contra las políticas del Escudo de Gobernanza." },
          { label: "Decisión", text: "Sintetizando despacho de auxiliares y rutas de desvío de flujo óptimas." }
        ];
      case "fr":
        return [
          { label: "Observation", text: "Analyse des grilles de capteurs des portes et des vitesses de file..." },
          { label: "Détection", text: "Alertes météo et fermeture du métro enregistrées." },
          { label: "Analyse", text: "Corrélation des courbes d'arrivée historiques avec les débordements de parking." },
          { label: "Prédiction", text: "Risque de goulot d'étranglement critique prévu à la Porte B dans 3 minutes." },
          { label: "Vérification", text: "Vérification des politiques de sécurité du Bouclier de Gouvernance." },
          { label: "Décision", text: "Synthèse de déploiement des stewards et des itinéraires de redirection." }
        ];
      case "hi":
        return [
          { label: "अवलोकन", text: "गेट सेंसर ग्रिड और कतार वेग का विश्लेषण किया जा रहा है..." },
          { label: "संकेत पहचान", text: "मौसम अलर्ट और मेट्रो बंद होने की चेतावनियां दर्ज की गईं।" },
          { label: "पैटर्न विश्लेषण", text: "पार्किंग स्थल रिसाव के साथ ऐतिहासिक आगमन वक्रों का सहसंबंध..." },
          { label: "अनुमान", text: "3 मिनट के भीतर गेट B पर गंभीर भीड़ होने का अनुमान है।" },
          { label: "नीति सत्यापन", text: "गवर्नेंस शील्ड स्वायत्तता नीतियों के खिलाफ जांच चलाई जा रही है।" },
          { label: "निर्णय", text: "इष्टतम सहायक तैनाती और प्रवाह पुनरुत्पादन पथ तैयार किया जा रहा है।" }
        ];
      default:
        return [
          { label: "Observation", text: "Analyzing gate sensor grids and queue velocities..." },
          { label: "Signal Detection", text: "Weather alert and Metro shutdown alerts registered." },
          { label: "Pattern Analysis", text: "Correlating historical arrival curves with parking lot spillovers." },
          { label: "Prediction", text: "Critical bottleneck risk expected at Gate B within 3 minutes." },
          { label: "Policy Verification", text: "Running checks against Governance Shield Autonomy policies." },
          { label: "Decision", text: "Synthesizing optimal Steward dispatch and flow rerouting paths." }
        ];
    }
  };

  const getAgentDialogs = () => {
    switch (appLanguage) {
      case "es":
        return [
          { agent: "📡 CrowdFlow AI", text: "Se prevé que la Puerta B supere la ocupación segura." },
          { agent: "🛡️ Dispatch AI", text: "Desplegando cuatro auxiliares para gestionar oleadas." },
          { agent: "🚚 Logistics AI", text: "Redirigiendo llegadas de transbordadores del Estacionamiento B." },
          { agent: "⚖️ Governance AI", text: "Validación de políticas aprobada. Autonomía autorizada." },
          { agent: "📣 Comms AI", text: "Generando anuncios en español e hindi." },
          { agent: "🔍 Verification AI", text: "Bucles de sensores bloqueados. Iniciando verificación de estabilización." }
        ];
      case "fr":
        return [
          { agent: "📡 CrowdFlow AI", text: "La Porte B devrait dépasser la capacité de sécurité." },
          { agent: "🛡️ Dispatch AI", text: "Déploiement de quatre stewards pour gérer les arrivées." },
          { agent: "🚚 Logistics AI", text: "Redirection des arrivées de navettes depuis le Parking B." },
          { agent: "⚖️ Governance AI", text: "Validation des politiques réussie. Autonomie approuvée." },
          { agent: "📣 Comms AI", text: "Génération des annonces en espagnol et en hindi." },
          { agent: "🔍 Verification AI", text: "Capteurs verrouillés. Lancement de la vérification de stabilisation." }
        ];
      case "hi":
        return [
          { agent: "📡 CrowdFlow AI", text: "गेट B पर सुरक्षित व्यस्तता सीमा पार होने की संभावना है।" },
          { agent: "🛡️ Dispatch AI", text: "भीड़ प्रबंधन के लिए चार गेट सहायकों को तैनात किया जा रहा है।" },
          { agent: "🚚 Logistics AI", text: "पार्किंग स्थल B से शटल आगमन को पुनर्निर्देशित किया जा रहा है।" },
          { agent: "⚖️ Governance AI", text: "नीति सत्यापन सफल। स्वायत्तता स्वीकृत।" },
          { agent: "📣 Comms AI", text: "स्पेनिश और हिंदी में सार्वजनिक घोषणाएं तैयार की जा रही हैं।" },
          { agent: "🔍 Verification AI", text: "सेंसर चक्र बंद। गेट लोड स्थिरीकरण सत्यापन शुरू।" }
        ];
      default:
        return [
          { agent: "📡 CrowdFlow AI", text: "Gate B expected to exceed safe occupancy." },
          { agent: "🛡️ Dispatch AI", text: "Deploying four stewards to handle arrival surges." },
          { agent: "🚚 Logistics AI", text: "Redirecting shuttle arrivals from Lot B." },
          { agent: "⚖️ Governance AI", text: "Policy validation passed. Autonomy approved." },
          { agent: "📣 Comms AI", text: "Generating multilingual announcements in Spanish & Hindi." },
          { agent: "🔍 Verification AI", text: "Sensor loops locked. Initiating gate load stabilization check." }
        ];
    }
  };

  const pipelineSteps = getPipelineSteps();
  const agentDialogs = getAgentDialogs();

  useEffect(() => {
    if (!isThinking) return;
    setPipelineIndex(0);
    setDialogIndex(-1);

    let pipelineTimer = setInterval(() => {
      setPipelineIndex((prev) => {
        if (prev >= pipelineSteps.length - 1) {
          clearInterval(pipelineTimer);
          let dialogTimer = setInterval(() => {
            setDialogIndex((prevD) => {
              if (prevD >= agentDialogs.length - 1) {
                clearInterval(dialogTimer);
                setIsThinking(false);
                return prevD;
              }
              return prevD + 1;
            });
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => {
      clearInterval(pipelineTimer);
    };
  }, [isThinking, pipelineSteps.length, agentDialogs.length]);

  useEffect(() => {
    setPipelineIndex(0);
    setDialogIndex(-1);
    setIsThinking(true);
  }, [activeTimeSlot]);

  useEffect(() => {
    if (orchestrateLoading) {
      setPipelineIndex(0);
      setDialogIndex(-1);
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

        <div className="flex gap-6">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">{t.rec_safety}</span>
            <span className="text-xl font-extrabold text-gray-100 flex items-center gap-1.5 justify-end">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              {safetyIndex.toFixed(1)}<span className="text-xs text-gray-500 font-normal font-sans">/10</span>
            </span>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold">{t.rec_efficiency}</span>
            <span className="text-xl font-extrabold text-gray-100 flex items-center gap-1.5 justify-end">
              <Activity className="h-5 w-5 text-fifa-gold" />
              {efficiencyScore}<span className="text-xs text-gray-500 font-normal font-sans">%</span>
            </span>
          </div>
        </div>
      </div>

      {isThinking ? (
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-slate-950/80 font-mono text-xs leading-relaxed space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <Terminal className="h-3 w-3 text-emerald-400 shrink-0" /> Orchestrator Reasoning Console
            </span>
            <span className="text-[9px] text-slate-500">v2.0</span>
          </div>

          <div className="space-y-2">
            {pipelineSteps.slice(0, pipelineIndex + 1).map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 mt-0.5 ${
                  idx === pipelineIndex ? "bg-amber-500/20 text-amber-400 animate-pulse border border-amber-500/30" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {step.label}
                </span>
                <span>{step.text}</span>
              </div>
            ))}
          </div>

          {dialogIndex >= 0 && (
            <div className="border-t border-white/5 pt-3 mt-3 space-y-2">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Agent Collaboration Feed</span>
              {agentDialogs.slice(0, dialogIndex + 1).map((dialog, idx) => (
                <div key={idx} className="p-2 bg-slate-900/60 border border-white/5 rounded-lg flex items-start gap-2">
                  <span className="font-extrabold text-fifa-gold shrink-0">{dialog.agent}:</span>
                  <span className="text-gray-300 italic">"{dialog.text}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <h2 className="text-sm font-semibold tracking-wide text-gray-100 flex items-center gap-2 uppercase">
              <Brain className="h-4.5 w-4.5 text-fifa-gold" />
              {t.rec_title}
            </h2>
            <button
              type="button"
              onClick={triggerAI}
              disabled={orchestrateLoading}
              className="py-1.5 px-3 rounded-lg bg-fifa-gold hover:bg-yellow-600 disabled:bg-slate-800 text-slate-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
            >
              {orchestrateLoading ? (
                <span className="h-3.5 w-3.5 animate-spin border-2 border-slate-950 border-t-transparent rounded-full"></span>
              ) : (
                <Brain className="h-3.5 w-3.5" />
              )}
              {orchestrateLoading ? "Analyzing..." : "Consult AI Orchestrator"}
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
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 text-xs">
              <Brain className="h-10 w-10 mb-3 opacity-30 text-fifa-gold" />
              <p className="font-bold text-gray-400">All Stadium Operations Stable</p>
              <p className="opacity-75 mt-1 max-w-[280px]">AI agents are continuously auditing the stadium telemetry loops. Run analysis or inject telemetry to start reasoning.</p>
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
                        <div className="p-5 space-y-4 text-xs leading-relaxed">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <span className="text-[9px] text-fifa-gold font-bold uppercase tracking-widest block mb-0.5">Observation</span>
                                <p className="text-gray-300 bg-slate-900/60 p-2 rounded border border-white/5 font-semibold">
                                  <AITranslate text={rec.problem} />
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest block mb-1">Signals Considered</span>
                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                  <div className="flex items-center gap-1.5 text-gray-300 bg-slate-900/40 px-2 py-1 rounded">
                                    <span className="text-emerald-400 font-bold">✓</span> Weather Radar
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-300 bg-slate-900/40 px-2 py-1 rounded">
                                    <span className="text-emerald-400 font-bold">✓</span> Queue Growth
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-300 bg-slate-900/40 px-2 py-1 rounded">
                                    <span className="text-emerald-400 font-bold">✓</span> Metro Delays
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-300 bg-slate-900/40 px-2 py-1 rounded">
                                    <span className="text-emerald-400 font-bold">✓</span> Historic Trends
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest block mb-0.5">Alternative Plans Evaluated</span>
                                <div className="space-y-1.5 text-[10px]">
                                  <div className="p-1.5 bg-slate-900/40 border border-white/5 rounded text-gray-400">
                                    <span className="text-red-400 font-extrabold mr-1">❌ Close Gate Entirely:</span>
                                    Rejected — would overload adjacent stadium corridors.
                                  </div>
                                  <div className="p-1.5 bg-slate-900/40 border border-white/5 rounded text-gray-400">
                                    <span className="text-red-400 font-extrabold mr-1">❌ Deploy Police:</span>
                                    Rejected — incident parameters below local escalation tier.
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block mb-0.5">Selected Plan</span>
                                <p className="text-gray-300 bg-slate-900/60 p-2 rounded border border-white/5 font-semibold">
                                  <AITranslate text={rec.suggested_action} />
                                </p>
                              </div>

                              <div>
                                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest block mb-0.5">Expected Outcome</span>
                                <p className="text-gray-300 bg-slate-900/60 p-2 rounded border border-white/5 font-medium">
                                  <AITranslate text={rec.expected_outcome.includes("31%") ? "31% reduction in congestion" : rec.expected_outcome} />
                                </p>
                              </div>

                              <div>
                                <span className="text-[9px] text-fifa-gold font-bold uppercase tracking-widest block mb-0.5">AI Justification</span>
                                <p className="text-gray-400 italic">
                                  "<AITranslate text={rec.reason} />"
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                            <div className="text-xs space-y-1 max-w-[280px]">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-500 uppercase font-bold">{t.rec_confidence}</span>
                                <code className="text-fifa-gold font-black tracking-widest font-mono">
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
      )}
    </div>
  );
};
