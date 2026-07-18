import React from "react";
import { Brain, Wifi, Key, Volume2, VolumeX } from "lucide-react";

interface AppHeaderProps {
  t: any;
  stadiumState: any;
  tick: number;
  appLanguage: string;
  setAppLanguage: (lang: any) => void;
  voiceAssistEnabled: boolean;
  setVoiceAssistEnabled: (enabled: boolean) => void;
  updateAutonomyLevel: (level: string) => void;
  apiConfigured: boolean | null;
  hasActiveIncidents: boolean;
  activeActions: any[];
  isReasoning: boolean;
  hasReasoned: boolean;
  isActing: boolean;
  hasActed: boolean;
  isVerifying: boolean;
  hasVerified: boolean;
  connected: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  t,
  stadiumState,
  tick,
  appLanguage,
  setAppLanguage,
  voiceAssistEnabled,
  setVoiceAssistEnabled,
  updateAutonomyLevel,
  apiConfigured,
  hasActiveIncidents,
  activeActions,
  isReasoning,
  hasReasoned,
  isActing,
  hasActed,
  isVerifying,
  hasVerified,
  connected,
}) => {
  return (
    <>
      {apiConfigured === false && (
        <div className="bg-red-950/80 border-b border-red-500/30 text-red-350 text-xs px-4 py-2 text-center flex items-center justify-center gap-2">
          <Key className="h-4 w-4 animate-pulse text-red-400" />
          <span>
            <strong>Attention:</strong> {t.api_missing}
          </span>
        </div>
      )}

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
                className={`px-2 py-0.5 rounded transition-all duration-350 font-bold ${
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
                className={`px-2 py-0.5 rounded transition-all duration-350 font-bold ${
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
                className={`px-2 py-0.5 rounded transition-all duration-350 font-bold ${
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
                className={`px-2 py-0.5 rounded transition-all duration-350 font-bold ${
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
    </>
  );
};
