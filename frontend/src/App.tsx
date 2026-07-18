import React, { useEffect, useState } from "react";
import { CrowdPilotProvider } from "./context/CrowdPilotContext";
import { useCrowdPilot } from "./hooks/useCrowdPilot";
import { getBaseUrl } from "./utils/api";
import { StadiumMap } from "./components/StadiumMap";
import { LiveTimeline } from "./components/LiveTimeline";
import { Recommendation } from "./components/Recommendation";
import { ActionQueue } from "./components/ActionQueue";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { AnnouncePanel } from "./components/AnnouncePanel";
import { UploadPanel } from "./components/UploadPanel";
import { TelemetryFeed } from "./components/TelemetryFeed";
import { OperationalReport } from "./components/OperationalReport";
import { translations } from "./utils/translations";
import {
  Brain,
  Wifi,
  Key,
  ShieldAlert,
  HeartPulse,
  Flame,
  AlertOctagon,
  CloudLightning,
  Award,
  Volume2,
  VolumeX,
} from "lucide-react";

const DashboardContent: React.FC = () => {
  const {
    connected,
    tick,
    stadiumState,
    injectIncident,
    injectorLoading,
    appLanguage,
    setAppLanguage,
    updateAutonomyLevel,
    voiceAssistEnabled,
    setVoiceAssistEnabled,
  } = useCrowdPilot();

  const activeIncidents = (stadiumState?.incidents || []).filter(
    (inc) => inc.status === "active",
  );
  const hasActiveIncidents = activeIncidents.length > 0;

  const activeActions = stadiumState?.actions_queue || [];
  const isReasoning =
    activeActions.some(
      (act) => act.status === "pending" || act.status === "review",
    ) || injectorLoading;
  const isActing = activeActions.some(
    (act) =>
      act.status === "approved" ||
      act.status === "auto_executed" ||
      act.status === "resolved_by_governance",
  );
  const isVerifying = activeActions.some(
    (act) =>
      act.verification_status === "success" ||
      act.verification_status === "failed",
  );

  const hasReasoned = activeActions.length > 0 && !isReasoning;
  const hasActed = activeActions.length > 0 && !isActing && !isReasoning;
  const hasVerified =
    activeActions.length > 0 && !isVerifying && !isActing && !isReasoning;

  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "studio" | "retro">(
    "live",
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "live" || tabParam === "studio" || tabParam === "retro") {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (tab: "live" | "studio" | "retro") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);
  };

  const t = translations[appLanguage] || translations.en;

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/api/status`);
        if (res.ok) {
          const data = await res.json();
          setApiConfigured(data.gemini_api_configured);
        }
      } catch {}
    };
    checkStatus();
  }, []);

  const handleInject = (type: string) => {
    if (injectorLoading) return;
    injectIncident(type);
  };

  return (
    <div className="min-h-screen pb-12">
      {}
      {apiConfigured === false && (
        <div className="bg-red-950/80 border-b border-red-500/30 text-red-300 text-xs px-4 py-2 text-center flex items-center justify-center gap-2">
          <Key className="h-4 w-4 animate-pulse text-red-400" />
          <span>
            <strong>Attention:</strong> {t.api_missing}
          </span>
        </div>
      )}

      {}
      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-3">
        <div className="max-w-7xl mx-auto w-full flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fifa-gold/15 rounded-xl border border-fifa-gold/25">
              <Brain className="h-6 w-6 text-fifa-gold" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wider text-gray-100 flex items-center gap-1.5">
                {t.title}
                <span className="text-[10px] font-semibold bg-fifa-gold/20 text-fifa-gold border border-fifa-gold/30 px-1.5 py-0.5 rounded">
                  {t.fifa_tag}
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                {t.subtitle}
              </p>
            </div>
          </div>

          {stadiumState?.match && (
            <div className="flex items-center gap-4 bg-slate-900/80 border border-white/10 px-4 py-2 rounded-2xl shadow-lg w-full max-w-sm md:w-auto shrink-0">
              <div className="text-center bg-slate-950 px-2 py-1 rounded-lg border border-white/5 shrink-0">
                <span className="text-[8px] text-gray-500 uppercase tracking-widest block font-bold">
                  {t.match_clock}
                </span>
                <span className="text-xs font-black text-fifa-gold animate-pulse">
                  {stadiumState.match.time_label}
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-200">
                    {stadiumState.match.teams}
                  </span>
                  <span className="text-xs font-black text-gray-100 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">
                    {stadiumState.match.score}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 italic leading-tight max-w-50">
                  {stadiumState.match.detail}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2 text-xs font-semibold text-gray-300">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1 rounded-xl shadow-inner">
              <span className="text-[9px] text-slate-500 font-bold uppercase">
                Lang:
              </span>
              <select
                value={appLanguage}
                onChange={(e) => setAppLanguage(e.target.value as any)}
                className="bg-transparent text-xs text-fifa-gold font-bold focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-950 text-gray-200">
                  EN (English)
                </option>
                <option value="es" className="bg-slate-950 text-gray-200">
                  ES (Español)
                </option>
                <option value="fr" className="bg-slate-950 text-gray-200">
                  FR (Français)
                </option>
                <option value="hi" className="bg-slate-950 text-gray-200">
                  HI (हिन्दी)
                </option>
              </select>
            </div>

            <button
              onClick={() => setVoiceAssistEnabled(!voiceAssistEnabled)}
              title="Toggle Voice Dispatcher Alerts"
              className={`flex items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                voiceAssistEnabled
                  ? "bg-fifa-gold/15 text-fifa-gold border-fifa-gold/25"
                  : "bg-slate-900/60 text-slate-500 border-white/5 hover:text-slate-400"
              }`}
            >
              {voiceAssistEnabled ? (
                <Volume2 className="h-4.5 w-4.5" />
              ) : (
                <VolumeX className="h-4.5 w-4.5" />
              )}
            </button>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1 rounded-xl shadow-inner">
              <span className="text-[9px] text-slate-500 font-bold uppercase">
                Autonomy:
              </span>
              <select
                value={stadiumState?.autonomy_level || "suggest_only"}
                onChange={(e) => updateAutonomyLevel(e.target.value)}
                className="bg-transparent text-xs text-fifa-gold font-bold focus:outline-none cursor-pointer"
              >
                <option
                  value="suggest_only"
                  className="bg-slate-950 text-gray-200"
                >
                  Suggest Only
                </option>
                <option
                  value="auto_execute_low"
                  className="bg-slate-950 text-gray-200"
                >
                  Auto Low-Risk
                </option>
                <option
                  value="full_autonomous"
                  className="bg-slate-950 text-gray-200"
                >
                  Autonomous
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1 rounded-full font-mono">
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                {t.tick}:
              </span>
              <span className="font-extrabold text-fifa-gold">{tick}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1 rounded-full font-mono text-[9px] select-none">
              <span className="text-slate-500 font-bold uppercase mr-1">
                AI Cycle:
              </span>

              <span
                className={`px-2 py-0.5 rounded transition-all duration-300 font-bold ${
                  hasActiveIncidents
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                    : activeActions.length > 0
                      ? "text-emerald-400"
                      : "text-slate-600"
                }`}
              >
                Perceive
                {hasActiveIncidents
                  ? " (active)"
                  : activeActions.length > 0
                    ? " ✓"
                    : ""}
              </span>

              <span className="text-slate-700">➔</span>

              <span
                className={`px-2 py-0.5 rounded transition-all duration-300 font-bold ${
                  isReasoning
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                    : hasReasoned
                      ? "text-amber-400"
                      : "text-slate-600"
                }`}
              >
                Reason{isReasoning ? " (active)" : hasReasoned ? " ✓" : ""}
              </span>

              <span className="text-slate-700">➔</span>

              <span
                className={`px-2 py-0.5 rounded transition-all duration-300 font-bold ${
                  isActing
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse"
                    : hasActed
                      ? "text-blue-400"
                      : "text-slate-600"
                }`}
              >
                Act{isActing ? " (active)" : hasActed ? " ✓" : ""}
              </span>

              <span className="text-slate-700">➔</span>

              <span
                className={`px-2 py-0.5 rounded transition-all duration-300 font-bold ${
                  isVerifying
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                    : hasVerified
                      ? "text-emerald-400"
                      : "text-slate-600"
                }`}
              >
                Verify{isVerifying ? " (active)" : hasVerified ? " ✓" : ""}
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                connected
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/25 text-amber-400"
              }`}
            >
              {connected ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span>{t.sim_online}</span>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full border border-amber-400 border-t-transparent animate-spin"></span>
                  <span>Connecting (auto-retry)...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-px">
          <button
            onClick={() => handleTabChange("live")}
            className={`px-4 py-2 text-xs transition-all flex items-center gap-1.5 relative border-b-2 ${
              activeTab === "live"
                ? "border-emerald-500 text-emerald-400 font-black shadow-[0_4px_12px_-2px_rgba(16,185,129,0.35)]"
                : "border-transparent text-gray-400 hover:text-gray-200 font-bold"
            }`}
          >
            🟢 Live Operations
            {(stadiumState?.actions_queue || []).filter(
              (act) => act.status === "pending",
            ).length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 rounded-full font-bold animate-bounce">
                {
                  (stadiumState?.actions_queue || []).filter(
                    (act) => act.status === "pending",
                  ).length
                }
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("studio")}
            className={`px-4 py-2 text-xs transition-all flex items-center gap-1.5 relative border-b-2 ${
              activeTab === "studio"
                ? "border-amber-500 text-amber-400 font-black shadow-[0_4px_12px_-2px_rgba(245,158,11,0.35)]"
                : "border-transparent text-gray-400 hover:text-gray-200 font-bold"
            }`}
          >
            ⚡ Decision Studio
          </button>

          <button
            onClick={() => handleTabChange("retro")}
            className={`px-4 py-2 text-xs transition-all flex items-center gap-1.5 relative border-b-2 ${
              activeTab === "retro"
                ? "border-fifa-gold text-fifa-gold font-black shadow-[0_4px_12px_-2px_rgba(234,179,8,0.35)]"
                : "border-transparent text-gray-400 hover:text-gray-200 font-bold"
            }`}
          >
            📊 Operations Intelligence
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        <div className={activeTab === "live" ? "space-y-8 block" : "hidden"}>
          <section className="space-y-2">
            <StadiumMap />
          </section>

          <section className="space-y-2">
            <TelemetryFeed />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Recommendation />
            </div>
            <div>
              <ActionQueue />
            </div>
            <div>
              <LiveTimeline />
            </div>
          </section>
        </div>

        <div className={activeTab === "studio" ? "space-y-8 block" : "hidden"}>
          <section className="glass-panel rounded-2xl p-5 border border-fifa-gold/40 shadow-[0_0_25px_rgba(234,179,8,0.08)] bg-slate-950/40">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-5 w-5 text-fifa-gold animate-pulse" />
              <div>
                <h3 className="text-sm font-extrabold text-gray-200 tracking-wide uppercase">
                  Mission Simulation
                </h3>
                <p className="text-[10px] text-gray-400">
                  Choose an operational scenario to calibrate AI models and
                  stress-test routing algorithms
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <button
                onClick={() => handleInject("medical")}
                disabled={injectorLoading}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-red-500/40 hover:bg-red-500/20 hover:border-red-500 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              >
                <HeartPulse className="h-4 w-4" />
                Medical Emergency
              </button>

              <button
                onClick={() => handleInject("fire_alarm")}
                disabled={injectorLoading}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-orange-500/40 hover:bg-orange-500/20 hover:border-orange-500 text-xs font-bold text-orange-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(249,115,22,0.3)]"
              >
                <Flame className="h-4 w-4" />
                Fire Evacuation
              </button>

              <button
                onClick={() => handleInject("metro_failure")}
                disabled={injectorLoading}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-amber-500/40  hover:bg-amber-500/20 hover:border-amber-500 text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <AlertOctagon className="h-4 w-4" />
                Metro Shutdown
              </button>

              <button
                onClick={() => handleInject("storm_warning")}
                disabled={injectorLoading}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-blue-500/40  hover:bg-blue-500/20 hover:border-blue-500 text-xs font-bold text-blue-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]"
              >
                <CloudLightning className="h-4 w-4" />
                Lightning Strike
              </button>

              <button
                onClick={() => handleInject("vip_arrival")}
                disabled={injectorLoading}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-purple-500/40  hover:bg-purple-500/20 hover:border-purple-500 text-xs font-bold text-purple-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              >
                <Award className="h-4 w-4" />
                VIP Lockdown
              </button>

              <button
                onClick={() => handleInject("full_time")}
                disabled={injectorLoading}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-fifa-gold/40 hover:bg-yellow-500/20 hover:border-fifa-gold text-xs font-bold text-fifa-gold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(234,179,8,0.3)]"
              >
                <Brain className="h-4 w-4" />
                Full-Time Whistle
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              {t.tactical_modules}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ScenarioPanel />
              <AnnouncePanel />
              <UploadPanel />
            </div>
          </section>
        </div>

        <div className={activeTab === "retro" ? "space-y-8 block" : "hidden"}>
          <section className="space-y-2">
            <OperationalReport />
          </section>
        </div>
      </main>

      {}
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
        <span>
          © 2026 FIFA World Cup Organizers. Managed by CrowdPilot Intelligence.
        </span>
        <div className="flex gap-4 items-center">
          <span>Security Protocol: AES-256</span>
          <span>Access Level: Stadium Commander</span>
          {stadiumState?.ai_ops_calls !== undefined && (
            <span className="bg-fifa-gold/15 text-fifa-gold border border-fifa-gold/25 px-2 py-0.5 rounded font-mono font-bold">
              AI Calls: {stadiumState.ai_ops_calls}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <CrowdPilotProvider>
      <DashboardContent />
    </CrowdPilotProvider>
  );
}

export default App;
