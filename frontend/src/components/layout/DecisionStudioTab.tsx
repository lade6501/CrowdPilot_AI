import React from "react";
import { ShieldAlert, HeartPulse, Flame, AlertOctagon, CloudLightning, Award, Brain } from "lucide-react";
import { ScenarioPanel } from "../ScenarioPanel";
import { AnnouncePanel } from "../AnnouncePanel";
import { UploadPanel } from "../UploadPanel";
import { translations } from "../../utils/translations";

interface DecisionStudioTabProps {
  t: typeof translations.en;
  injectorLoading: boolean;
  handleInject: (type: string) => void;
}

export const DecisionStudioTab: React.FC<DecisionStudioTabProps> = ({
  t,
  injectorLoading,
  handleInject,
}) => {
  return (
    <>
      <section className="glass-panel rounded-2xl p-5 border border-fifa-gold/40 shadow-[0_0_25px_rgba(234,179,8,0.08)] bg-slate-950/40">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-5 w-5 text-fifa-gold animate-pulse" />
          <div>
            <h3 className="text-sm font-extrabold text-gray-200 tracking-wide uppercase">
              Mission Simulation
            </h3>
            <p className="text-[10px] text-gray-400">
              Choose an operational scenario to calibrate AI models and stress-test routing algorithms
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
            className="py-2.5 px-3 rounded-xl bg-slate-900 border border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-500 text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]"
          >
            <AlertOctagon className="h-4 w-4" />
            Metro Shutdown
          </button>

          <button
            onClick={() => handleInject("storm_warning")}
            disabled={injectorLoading}
            className="py-2.5 px-3 rounded-xl bg-slate-900 border border-blue-500/40 hover:bg-blue-500/20 hover:border-blue-500 text-xs font-bold text-blue-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]"
          >
            <CloudLightning className="h-4 w-4" />
            Lightning Strike
          </button>

          <button
            onClick={() => handleInject("vip_arrival")}
            disabled={injectorLoading}
            className="py-2.5 px-3 rounded-xl bg-slate-900 border border-purple-500/40 hover:bg-purple-500/20 hover:border-purple-500 text-xs font-bold text-purple-400 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]"
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
    </>
  );
};
