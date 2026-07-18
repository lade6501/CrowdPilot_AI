import React from "react";

export const StadiumLegend: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-4 sm:grid-cols-7 gap-2 bg-slate-950/40 border border-white/5 p-3 rounded-xl text-[9px] font-semibold text-gray-400 mt-4 select-none">
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-emerald-500 block"></span>{" "}
        Crowd Flow
      </div>
      <div className="flex items-center gap-1">
        <span className="text-blue-400">👮</span> Police/Staff
      </div>
      <div className="flex items-center gap-1">
        <span className="text-red-400">🚑</span> Medic Team
      </div>
      <div className="flex items-center gap-1">
        <span className="text-emerald-400 font-bold">➔</span> AI Detour
      </div>
      <div className="flex items-center gap-1">
        <span className="text-amber-500 font-bold">⇢</span> Predict Spill
      </div>
      <div className="flex items-center gap-1">
        <span>⚠</span> Alarm Gate
      </div>
      <div className="flex items-center gap-1">
        <span>🔥</span> Evac Hazard
      </div>
    </div>
  );
};
