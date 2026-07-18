import React from "react";
import { Sparkles } from "lucide-react";
import { translations } from "../../utils/translations";
import type { StadiumState } from "../../context/CrowdPilotContextInstance";

interface StadiumHeaderProps {
  t: typeof translations.en;
  stadiumState: StadiumState;
  activeTimeSlot: string;
  viewMode: "2D" | "3D";
  setViewMode: (mode: "2D" | "3D") => void;
}

export const StadiumHeader: React.FC<StadiumHeaderProps> = ({
  t,
  stadiumState,
  activeTimeSlot,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="w-full flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fifa-gold" />
          {t.twin_title}
        </h2>
        <p className="text-xs text-gray-400">
          {stadiumState.mode === "replay"
            ? `${t.twin_replay_mode}: ${activeTimeSlot}`
            : t.twin_live_feed}
        </p>
      </div>

      <div className="flex items-center gap-3.5 flex-wrap md:flex-nowrap">
        <div className="flex items-center bg-slate-950/80 border border-white/10 p-0.5 rounded-lg text-[9px] font-bold shadow-inner">
          <button
            onClick={() => setViewMode("2D")}
            className={`px-2 py-1 rounded transition-all cursor-pointer ${
              viewMode === "2D"
                ? "bg-slate-800 text-fifa-gold shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            2D Operational
          </button>
          <button
            onClick={() => setViewMode("3D")}
            className={`px-2 py-1 rounded transition-all cursor-pointer ${
              viewMode === "3D"
                ? "bg-slate-800 text-purple-400 shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            3D Command (Beta)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">
            {t.twin_mode}:
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded ${
              stadiumState.mode === "replay"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
            }`}
          >
            {stadiumState.mode === "replay" ? t.twin_replay_mode : "Live"}
          </span>
        </div>
      </div>
    </div>
  );
};
