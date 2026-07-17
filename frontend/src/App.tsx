import React, { useEffect, useState } from "react";
import { CrowdPilotProvider, useCrowdPilot } from "./context/CrowdPilotContext";
import { StadiumMap } from "./components/StadiumMap";
import { LiveTimeline } from "./components/LiveTimeline";
import { Recommendation } from "./components/Recommendation";
import { ActionQueue } from "./components/ActionQueue";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { AnnouncePanel } from "./components/AnnouncePanel";
import { UploadPanel } from "./components/UploadPanel";
import { TelemetryFeed } from "./components/TelemetryFeed";
import { translations } from "./utils/translations";
import { Brain, Wifi, Key, ShieldAlert, HeartPulse, Flame, AlertOctagon, CloudLightning, Award } from "lucide-react";

const DashboardContent: React.FC = () => {
  const { 
    connected, 
    tick, 
    stadiumState, 
    injectIncident, 
    injectorLoading,
    appLanguage,
    setAppLanguage,
    updateAutonomyLevel
  } = useCrowdPilot();
  
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  
  const t = translations[appLanguage] || translations.en;

  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/status");
        if (res.ok) {
          const data = await res.json();
          setApiConfigured(data.gemini_api_configured);
        }
      } catch (e) {
        console.error("Failed to fetch API status:", e);
      }
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
      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {}
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
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{t.subtitle}</p>
          </div>
        </div>

        {}
        {stadiumState?.match && (
          <div className="flex items-center gap-4 bg-slate-900/80 border border-white/10 px-4 py-2 rounded-2xl shadow-lg max-w-sm">
            <div className="text-center bg-slate-950 px-2 py-1 rounded-lg border border-white/5 shrink-0">
              <span className="text-[8px] text-gray-500 uppercase tracking-widest block font-bold">{t.match_clock}</span>
              <span className="text-xs font-black text-fifa-gold animate-pulse">
                {stadiumState.match.time_label}
              </span>
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-200">{stadiumState.match.teams}</span>
                <span className="text-xs font-black text-gray-100 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">
                  {stadiumState.match.score}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 italic leading-tight truncate max-w-[200px]">
                {stadiumState.match.detail}
              </p>
            </div>
          </div>
        )}

        {}
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-300">
          
          {}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1 rounded-xl shadow-inner">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Lang:</span>
            <select
              value={appLanguage}
              onChange={(e) => setAppLanguage(e.target.value as any)}
              className="bg-transparent text-xs text-fifa-gold font-bold focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-950 text-gray-200">EN (English)</option>
              <option value="es" className="bg-slate-950 text-gray-200">ES (Español)</option>
              <option value="fr" className="bg-slate-950 text-gray-200">FR (Français)</option>
              <option value="hi" className="bg-slate-950 text-gray-200">HI (हिन्दी)</option>
            </select>
          </div>

          {}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1 rounded-xl shadow-inner">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Autonomy:</span>
            <select
              value={stadiumState?.autonomy_level || "suggest_only"}
              onChange={(e) => updateAutonomyLevel(e.target.value)}
              className="bg-transparent text-xs text-fifa-gold font-bold focus:outline-none cursor-pointer"
            >
              <option value="suggest_only" className="bg-slate-950 text-gray-200">Suggest Only</option>
              <option value="auto_execute_low" className="bg-slate-950 text-gray-200">Auto Low-Risk</option>
              <option value="full_autonomous" className="bg-slate-950 text-gray-200">Autonomous</option>
            </select>
          </div>

          {}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 px-3 py-1 rounded-full font-mono">
            <span className="text-[10px] text-slate-500 font-bold uppercase">{t.tick}:</span>
            <span className="font-extrabold text-fifa-gold">{tick}</span>
          </div>

          {}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
            connected 
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/25 text-amber-400"
          }`}>
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
      </header>

      {}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {}
        <section className="glass-panel rounded-2xl p-5 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-extrabold text-gray-200 tracking-wide uppercase">{t.injector_title}</h3>
              <p className="text-[10px] text-gray-400">{t.injector_desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <button
              onClick={() => handleInject("medical")}
              disabled={injectorLoading}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-red-500/20 hover:border-red-500 hover:bg-red-950/20 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <HeartPulse className="h-4 w-4" />
              {t.medical_alert}
            </button>
            
            <button
              onClick={() => handleInject("fire_alarm")}
              disabled={injectorLoading}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-orange-500/20 hover:border-orange-500 hover:bg-orange-950/20 text-xs font-bold text-orange-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Flame className="h-4 w-4" />
              {t.fire_evac}
            </button>
            
            <button
              onClick={() => handleInject("metro_failure")}
              disabled={injectorLoading}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-amber-500/20 hover:border-amber-500 hover:bg-amber-950/20 text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <AlertOctagon className="h-4 w-4" />
              {t.metro_shutdown}
            </button>
            
            <button
              onClick={() => handleInject("storm_warning")}
              disabled={injectorLoading}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-blue-500/20 hover:border-blue-500 hover:bg-blue-950/20 text-xs font-bold text-blue-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <CloudLightning className="h-4 w-4" />
              {t.lightning_strike}
            </button>
            
            <button
              onClick={() => handleInject("vip_arrival")}
              disabled={injectorLoading}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-purple-500/20 hover:border-purple-500 hover:bg-purple-950/20 text-xs font-bold text-purple-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Award className="h-4 w-4" />
              {t.vip_lockdown}
            </button>

            <button
              onClick={() => handleInject("full_time")}
              disabled={injectorLoading}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-fifa-gold/20 hover:border-fifa-gold hover:bg-yellow-950/20 text-xs font-bold text-fifa-gold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Brain className="h-4 w-4" />
              Full-Time Whistle
            </button>
          </div>
        </section>

        {}
        <section className="space-y-2">
          <StadiumMap />
        </section>

        <section className="space-y-2">
          <TelemetryFeed />
        </section>

        {}
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

        {}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t.tactical_modules}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScenarioPanel />
            <AnnouncePanel />
            <UploadPanel />
          </div>
        </section>
      </main>

      {}
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
        <span>© 2026 FIFA World Cup Organizers. Managed by CrowdPilot Intelligence.</span>
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
