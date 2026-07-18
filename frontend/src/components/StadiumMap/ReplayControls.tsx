import React from "react";
import { Clock, RefreshCw } from "lucide-react";
import { translations } from "../../utils/translations";
import type { StadiumState } from "../../context/CrowdPilotContextInstance";

interface ReplayControlsProps {
  t: typeof translations.en;
  stadiumState: StadiumState;
  currentSliderIndex: number;
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetToLive: () => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  t,
  stadiumState,
  currentSliderIndex,
  handleSliderChange,
  resetToLive,
}) => {
  return (
    <div
      className={`w-full border rounded-2xl p-4 mt-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner transition-all duration-300 ${
        stadiumState.mode === "replay"
          ? "bg-purple-950/45 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          : "bg-slate-950/80 border-white/5"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
        {stadiumState.mode === "replay" ? (
          <>
            <Clock
              className="h-4 w-4 text-purple-400 animate-spin"
              style={{ animationDuration: "6s" }}
            />
            <span className="text-purple-400 font-black tracking-wider uppercase animate-pulse">
              🔮 TIME TRAVEL HUD ACTIVE
            </span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4 text-fifa-gold" />
            <span>{t.twin_timeline}</span>
          </>
        )}
      </div>

      <div className="flex-1 px-4 flex flex-col justify-center relative w-full">
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={currentSliderIndex !== -1 ? currentSliderIndex : 0}
          onChange={handleSliderChange}
          className="w-full accent-fifa-gold h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-500 uppercase px-1">
          <span>7:00 PM</span>
          <span>7:30 PM</span>
          <span>8:00 PM</span>
          <span>9:00 PM</span>
        </div>
      </div>

      <div className="flex gap-2">
        {stadiumState.mode === "replay" ? (
          <button
            onClick={resetToLive}
            className="py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            {t.twin_resume_live}
          </button>
        ) : (
          <div className="py-1.5 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {t.twin_streaming_live}
          </div>
        )}
      </div>
    </div>
  );
};
