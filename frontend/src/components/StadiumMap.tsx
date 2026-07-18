import React, { useState, lazy, Suspense } from "react";
import { useCrowdPilot } from "../hooks/useCrowdPilot";
import { translations } from "../utils/translations";
import { Sparkles, Clock, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GateInspector } from "./GateInspector";

const StadiumMap3D = lazy(() =>
  import("./StadiumMap3D").then((module) => ({ default: module.StadiumMap3D }))
);

export const StadiumMap: React.FC = () => {
  const { 
    stadiumState, 
    selectedGate, 
    setSelectedGate, 
    activeTimeSlot, 
    selectReplaySlot,
    resetToLive,
    appLanguage
  } = useCrowdPilot();

  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [hoveredGate, setHoveredGate] = useState<string | null>(null);
  const [showCrowd, setShowCrowd] = useState(true);
  const [showAIPaths, setShowAIPaths] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);

  if (!stadiumState) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl glass-panel text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fifa-gold mx-auto mb-3"></div>
          <p>Connecting to Live Stadium Feeds...</p>
        </div>
      </div>
    );
  }

  const { gates } = stadiumState;
  const t = (translations as any)[appLanguage] || translations.en;

  
  const timeSlots = ["7:00 PM", "7:30 PM", "8:00 PM", "9:00 PM"];

  
  const getGateColorClass = (occupancy: number) => {
    if (occupancy >= 90) return "fill-red-500 stroke-red-600 gate-critical-pulse";
    if (occupancy >= 75) return "fill-amber-500 stroke-amber-600 gate-warning-pulse";
    return "fill-emerald-500 stroke-emerald-600";
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    selectReplaySlot(timeSlots[index]);
  };

  const currentSliderIndex = timeSlots.indexOf(activeTimeSlot);

  
  

  const getDetourTarget = (srcGate: string) => {
    const gateOptions = ["Gate A", "Gate B", "Gate C", "Gate D"].filter(g => g !== srcGate);
    const neighbors: Record<string, string[]> = {
      "Gate A": ["Gate B", "Gate D", "Gate C"],
      "Gate B": ["Gate A", "Gate C", "Gate D"],
      "Gate C": ["Gate B", "Gate D", "Gate A"],
      "Gate D": ["Gate A", "Gate C", "Gate B"]
    };
    const srcNeighbors = neighbors[srcGate] || [];
    const sorted = [...gateOptions].sort((g1, g2) => {
      const occ1 = gates[g1]?.occupancy || 0;
      const occ2 = gates[g2]?.occupancy || 0;
      const isSafe1 = occ1 < 75;
      const isSafe2 = occ2 < 75;
      if (isSafe1 !== isSafe2) {
        return isSafe1 ? -1 : 1;
      }
      if (occ1 !== occ2) {
        return occ1 - occ2;
      }
      const distIndex1 = srcNeighbors.indexOf(g1);
      const distIndex2 = srcNeighbors.indexOf(g2);
      return distIndex1 - distIndex2;
    });
    return sorted[0];
  };

  const getDetourPathD = (src: string, target: string) => {
    const coords: Record<string, { x: number, y: number }> = {
      "Gate A": { x: 400, y: 70 },
      "Gate B": { x: 700, y: 210 },
      "Gate C": { x: 400, y: 350 },
      "Gate D": { x: 100, y: 210 }
    };
    const p1 = coords[src];
    const p2 = coords[target];
    if (!p1 || !p2) return "";
    let qx = (p1.x + p2.x) / 2;
    let qy = (p1.y + p2.y) / 2;
    if (src === "Gate B" && target === "Gate D") {
      qx = 400; qy = 130;
    } else if (src === "Gate D" && target === "Gate B") {
      qx = 400; qy = 290;
    } else if (src === "Gate A" && target === "Gate C") {
      qx = 480; qy = 210;
    } else if (src === "Gate C" && target === "Gate A") {
      qx = 320; qy = 210;
    } else {
      if ((src === "Gate A" && target === "Gate B") || (src === "Gate B" && target === "Gate A")) {
        qx = 580; qy = 100;
      } else if ((src === "Gate B" && target === "Gate C") || (src === "Gate C" && target === "Gate B")) {
        qx = 580; qy = 310;
      } else if ((src === "Gate C" && target === "Gate D") || (src === "Gate D" && target === "Gate C")) {
        qx = 220; qy = 310;
      } else if ((src === "Gate D" && target === "Gate A") || (src === "Gate A" && target === "Gate D")) {
        qx = 220; qy = 100;
      }
    }
    return `M ${p1.x} ${p1.y} Q ${qx} ${qy} ${p2.x} ${p2.y}`;
  };

  const overloadedGates = Object.keys(gates).filter(g => (gates[g]?.occupancy || 0) >= 75);
  const criticalGates = Object.keys(gates).filter(g => (gates[g]?.occupancy || 0) >= 90);

  const activeIncidents = (stadiumState?.incidents || []).filter((inc: any) => inc.status === "active");
  const activeIncident = activeIncidents[0];
  const incidentTitle = activeIncident?.title || "";
  const isFire = incidentTitle.toLowerCase().includes("fire") || incidentTitle.toLowerCase().includes("evac");
  const isMedical = incidentTitle.toLowerCase().includes("medical") || incidentTitle.toLowerCase().includes("health");
  const isStorm = incidentTitle.toLowerCase().includes("storm") || incidentTitle.toLowerCase().includes("rain") || incidentTitle.toLowerCase().includes("lightning");
  const isWhistle = incidentTitle.toLowerCase().includes("whistle") || incidentTitle.toLowerCase().includes("full-time") || incidentTitle.toLowerCase().includes("full time");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative flex flex-col items-center justify-between min-h-[460px]">
        <div className="w-full flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-gray-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fifa-gold" />
              {t.twin_title}
            </h2>
            <p className="text-xs text-gray-400">
              {stadiumState.mode === "replay" ? `${t.twin_replay_mode}: ${activeTimeSlot}` : t.twin_live_feed}
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
              <span className="text-[10px] text-gray-400 uppercase font-semibold">{t.twin_mode}:</span>
              <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded ${
                stadiumState.mode === "replay" 
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
              }`}>
                {stadiumState.mode === "replay" ? t.twin_replay_mode : "Live"}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 relative min-h-[420px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {viewMode === "2D" ? (
              <motion.div
                key="2d-view"
                initial={{ opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, rotateX: 15, y: -15, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full flex flex-col items-center justify-between"
                style={{ perspective: 1000 }}
              >
                <div className="absolute top-0 right-0 z-10 flex flex-wrap gap-1.5 bg-slate-950/90 border border-white/10 p-1.5 rounded-xl text-[9px] font-bold text-gray-300 shadow-xl">
                  <button 
                    onClick={() => setShowCrowd(!showCrowd)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${showCrowd ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-900 text-gray-500 border border-transparent"}`}
                  >
                    ● Crowd
                  </button>
                  <button 
                    onClick={() => setShowAIPaths(!showAIPaths)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${showAIPaths ? "bg-fifa-gold/20 text-fifa-gold border border-fifa-gold/30" : "bg-slate-900 text-gray-500 border border-transparent"}`}
                  >
                    ➔ AI Detour
                  </button>
                  <button 
                    onClick={() => setShowResources(!showResources)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${showResources ? "bg-blue-500/20 text-blue-450 border border-blue-500/30" : "bg-slate-900 text-gray-500 border border-transparent"}`}
                  >
                    👮 Staff
                  </button>
                  <button 
                    onClick={() => setShowPredictions(!showPredictions)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${showPredictions ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-slate-900 text-gray-500 border border-transparent"}`}
                  >
                    ⇢ Predict
                  </button>
                </div>

                <svg viewBox="0 0 800 420" className="w-full max-w-[600px] drop-shadow-[0_0_30px_rgba(15,30,54,0.3)] mt-8">
                  <ellipse cx="400" cy="210" rx="360" ry="170" className="fill-none stroke-slate-800 stroke-[2] stroke-dasharray-4" />
                  <ellipse cx="400" cy="210" rx="300" ry="140" className="fill-slate-900/60 stroke-slate-700/80 stroke-[3]" />
                  <ellipse cx="400" cy="210" rx="240" ry="110" className="fill-slate-950/40 stroke-slate-800 stroke-[2]" />
                  
                  <path d="M 400 70 L 400 140 M 700 210 L 600 210 M 400 350 L 400 280 M 100 210 L 200 210" className="stroke-slate-800 stroke-[1.5]" />
                  
                  <rect x="290" y="145" width="220" height="130" rx="10" className="fill-slate-950/80 stroke-slate-800 stroke-[2]" />
                  <circle cx="400" cy="210" r="38" className="fill-none stroke-slate-800 stroke-[1.5]" />
                  <line x1="400" y1="145" x2="400" y2="275" className="stroke-slate-800 stroke-[1.5]" />

                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedGate("Gate A")}
                    onMouseEnter={() => setHoveredGate("Gate A")}
                    onMouseLeave={() => setHoveredGate(null)}
                  >
                    <line x1="400" y1="70" x2="400" y2="130" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
                    <circle 
                      cx="400" 
                      cy="70" 
                      r={hoveredGate === "Gate A" ? 19 : 15} 
                      className={`${getGateColorClass(gates["Gate A"]?.occupancy)} stroke-2 transition-all duration-300`} 
                    />
                    <text x="400" y="74" textAnchor="middle" className="fill-slate-950 font-bold text-xs">A</text>
                    <text x="400" y="47" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                      Gate A ({gates["Gate A"]?.occupancy}%)
                    </text>
                    {gates["Gate A"]?.occupancy >= 90 && (
                      <circle 
                        cx="400" 
                        cy="70" 
                        r="25" 
                        className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                        style={{ transformOrigin: "400px 70px" }}
                      />
                    )}
                  </g>

                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedGate("Gate B")}
                    onMouseEnter={() => setHoveredGate("Gate B")}
                    onMouseLeave={() => setHoveredGate(null)}
                  >
                    <line x1="700" y1="210" x2="640" y2="210" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
                    <circle 
                      cx="700" 
                      cy="210" 
                      r={hoveredGate === "Gate B" ? 19 : 15} 
                      className={`${getGateColorClass(gates["Gate B"]?.occupancy)} stroke-2 transition-all duration-300`} 
                    />
                    <text x="700" y="214" textAnchor="middle" className="fill-slate-950 font-bold text-xs">B</text>
                    <text x="700" y="187" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                      Gate B ({gates["Gate B"]?.occupancy}%)
                    </text>
                    {gates["Gate B"]?.occupancy >= 90 && (
                      <circle 
                        cx="700" 
                        cy="210" 
                        r="25" 
                        className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                        style={{ transformOrigin: "700px 210px" }}
                      />
                    )}
                  </g>

                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedGate("Gate C")}
                    onMouseEnter={() => setHoveredGate("Gate C")}
                    onMouseLeave={() => setHoveredGate(null)}
                  >
                    <line x1="400" y1="350" x2="400" y2="290" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
                    <circle 
                      cx="400" 
                      cy="350" 
                      r={hoveredGate === "Gate C" ? 19 : 15} 
                      className={`${getGateColorClass(gates["Gate C"]?.occupancy)} stroke-2 transition-all duration-300`} 
                    />
                    <text x="400" y="354" textAnchor="middle" className="fill-slate-950 font-bold text-xs">C</text>
                    <text x="400" y="327" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                      Gate C ({gates["Gate C"]?.occupancy}%)
                    </text>
                    {gates["Gate C"]?.occupancy >= 90 && (
                      <circle 
                        cx="400" 
                        cy="350" 
                        r="25" 
                        className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                        style={{ transformOrigin: "400px 350px" }}
                      />
                    )}
                  </g>

                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedGate("Gate D")}
                    onMouseEnter={() => setHoveredGate("Gate D")}
                    onMouseLeave={() => setHoveredGate(null)}
                  >
                    <line x1="100" y1="210" x2="160" y2="210" className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors" />
                    <circle 
                      cx="100" 
                      cy="210" 
                      r={hoveredGate === "Gate D" ? 19 : 15} 
                      className={`${getGateColorClass(gates["Gate D"]?.occupancy)} stroke-2 transition-all duration-300`} 
                    />
                    <text x="100" y="214" textAnchor="middle" className="fill-slate-950 font-bold text-xs">D</text>
                    <text x="100" y="187" textAnchor="middle" className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                      Gate D ({gates["Gate D"]?.occupancy}%)
                    </text>
                    {gates["Gate D"]?.occupancy >= 90 && (
                      <circle 
                        cx="100" 
                        cy="210" 
                        r="25" 
                        className="stroke-red-500 fill-none stroke-[1.5] animate-ping" 
                        style={{ transformOrigin: "100px 210px" }}
                      />
                    )}
                  </g>

                  <style>{`
                    @keyframes dash {
                      to {
                        stroke-dashoffset: -20;
                      }
                    }
                    @keyframes criticalPulse {
                      0% { stroke-width: 2px; stroke-opacity: 0.9; }
                      50% { stroke-width: 7px; stroke-opacity: 1; filter: drop-shadow(0 0 5px #ef4444); }
                      100% { stroke-width: 2px; stroke-opacity: 0.9; }
                    }
                    @keyframes warningBreath {
                      0% { stroke-width: 2px; stroke-opacity: 0.7; }
                      50% { stroke-width: 5px; stroke-opacity: 0.9; filter: drop-shadow(0 0 3px #f59e0b); }
                      100% { stroke-width: 2px; stroke-opacity: 0.7; }
                    }
                    .gate-critical-pulse {
                      animation: criticalPulse 0.8s infinite ease-in-out;
                    }
                    .gate-warning-pulse {
                      animation: warningBreath 2.2s infinite ease-in-out;
                    }
                  `}</style>

                  {showCrowd && isWhistle && (
                    <g>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5s" repeatCount="indefinite" path="M 400 210 L 400 70" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5s" begin="1.25s" repeatCount="indefinite" path="M 400 210 L 400 70" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5s" begin="2.5s" repeatCount="indefinite" path="M 400 210 L 400 70" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5s" begin="3.75s" repeatCount="indefinite" path="M 400 210 L 400 70" /></circle>
                      
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.8s" repeatCount="indefinite" path="M 400 210 L 700 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.8s" begin="1.2s" repeatCount="indefinite" path="M 400 210 L 700 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.8s" begin="2.4s" repeatCount="indefinite" path="M 400 210 L 700 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.8s" begin="3.6s" repeatCount="indefinite" path="M 400 210 L 700 210" /></circle>
                      
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" repeatCount="indefinite" path="M 400 210 L 400 350" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" begin="1.3s" repeatCount="indefinite" path="M 400 210 L 400 350" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" begin="2.6s" repeatCount="indefinite" path="M 400 210 L 400 350" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" begin="3.9s" repeatCount="indefinite" path="M 400 210 L 400 350" /></circle>
                      
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.5s" repeatCount="indefinite" path="M 400 210 L 100 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.5s" begin="1.5s" repeatCount="indefinite" path="M 400 210 L 100 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.5s" begin="3s" repeatCount="indefinite" path="M 400 210 L 100 210" /></circle>
                    </g>
                  )}

                  {showCrowd && isFire && (
                    <g>
                      <circle r="1.2" fill="#ef4444"><animateMotion dur="5s" repeatCount="indefinite" path="M 700 210 Q 550 350 400 350" /></circle>
                      <circle r="1.2" fill="#ef4444"><animateMotion dur="5s" begin="1.66s" repeatCount="indefinite" path="M 700 210 Q 550 350 400 350" /></circle>
                      <circle r="1.2" fill="#ef4444"><animateMotion dur="5s" begin="3.33s" repeatCount="indefinite" path="M 700 210 Q 550 350 400 350" /></circle>
                      <circle r="1.2" fill="#ef4444"><animateMotion dur="5.8s" repeatCount="indefinite" path="M 700 210 Q 400 120 100 210" /></circle>
                      <circle r="1.2" fill="#ef4444"><animateMotion dur="5.8s" begin="2.9s" repeatCount="indefinite" path="M 700 210 Q 400 120 100 210" /></circle>
                    </g>
                  )}

                  {showCrowd && isStorm && (
                    <g>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="4s" repeatCount="indefinite" path="M 400 70 L 400 145" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="4s" begin="1.33s" repeatCount="indefinite" path="M 400 70 L 400 145" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="4s" begin="2.66s" repeatCount="indefinite" path="M 400 70 L 400 145" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="3.8s" repeatCount="indefinite" path="M 700 210 L 510 210" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="3.8s" begin="1.9s" repeatCount="indefinite" path="M 700 210 L 510 210" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="4.2s" repeatCount="indefinite" path="M 400 350 L 400 275" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="4.2s" begin="2.1s" repeatCount="indefinite" path="M 400 350 L 400 275" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="3.5s" repeatCount="indefinite" path="M 100 210 L 290 210" /></circle>
                      <circle r="1.2" fill="#3b82f6"><animateMotion dur="3.5s" begin="1.75s" repeatCount="indefinite" path="M 100 210 L 290 210" /></circle>
                    </g>
                  )}

                  {showCrowd && !isWhistle && !isFire && !isStorm && (
                    <g>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.5s" repeatCount="indefinite" path="M 400 70 L 400 145" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.5s" begin="1.37s" repeatCount="indefinite" path="M 400 70 L 400 145" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.5s" begin="2.75s" repeatCount="indefinite" path="M 400 70 L 400 145" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.5s" begin="4.12s" repeatCount="indefinite" path="M 400 70 L 400 145" /></circle>
                      
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" repeatCount="indefinite" path="M 700 210 L 510 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" begin="1.3s" repeatCount="indefinite" path="M 700 210 L 510 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" begin="2.6s" repeatCount="indefinite" path="M 700 210 L 510 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.2s" begin="3.9s" repeatCount="indefinite" path="M 700 210 L 510 210" /></circle>
                      
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.8s" repeatCount="indefinite" path="M 400 350 L 400 275" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.8s" begin="1.45s" repeatCount="indefinite" path="M 400 350 L 400 275" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.8s" begin="2.9s" repeatCount="indefinite" path="M 400 350 L 400 275" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="5.8s" begin="4.35s" repeatCount="indefinite" path="M 400 350 L 400 275" /></circle>
                      
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.9s" repeatCount="indefinite" path="M 100 210 L 290 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.9s" begin="1.22s" repeatCount="indefinite" path="M 100 210 L 290 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.9s" begin="2.44s" repeatCount="indefinite" path="M 100 210 L 290 210" /></circle>
                      <circle r="1.2" fill="#10b981"><animateMotion dur="4.9s" begin="3.66s" repeatCount="indefinite" path="M 100 210 L 290 210" /></circle>
                    </g>
                  )}

                  {showAIPaths && overloadedGates.map((srcGate) => {
                    const targetGate = getDetourTarget(srcGate);
                    if (!targetGate) return null;
                    const pathD = getDetourPathD(srcGate, targetGate);
                    const coords: Record<string, { x: number, y: number }> = {
                      "Gate A": { x: 400, y: 70 },
                      "Gate B": { x: 700, y: 210 },
                      "Gate C": { x: 400, y: 350 },
                      "Gate D": { x: 100, y: 210 }
                    };
                    const p1 = coords[srcGate];
                    const p2 = coords[targetGate];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2 - 14;
                    return (
                      <g key={`detour-${srcGate}`}>
                        <path
                          id={`ai-detour-${srcGate}`}
                          d={pathD}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeDasharray="4,4"
                          filter="drop-shadow(0 0 5px rgba(16,185,129,0.7))"
                          className="animate-[dash_1.5s_linear_infinite]"
                        />
                        
                        <circle r="5" fill="#10b981" filter="drop-shadow(0 0 4px #10b981)">
                          <animateMotion dur="2.2s" repeatCount="indefinite" path={pathD} />
                        </circle>

                        {showCrowd && (
                          <g>
                            <circle r="1.2" fill="#10b981"><animateMotion dur="5s" repeatCount="indefinite" path={pathD} /></circle>
                            <circle r="1.2" fill="#10b981"><animateMotion dur="5s" begin="1.66s" repeatCount="indefinite" path={pathD} /></circle>
                            <circle r="1.2" fill="#10b981"><animateMotion dur="5s" begin="3.33s" repeatCount="indefinite" path={pathD} /></circle>
                          </g>
                        )}

                        <g transform={`translate(${midX - 55}, ${midY - 14})`}>
                          <rect width="110" height="26" rx="4" className="fill-slate-950/90 stroke stroke-emerald-500/20" />
                          <text x="55" y="10" textAnchor="middle" className="fill-emerald-400 font-extrabold text-[6.5px] uppercase tracking-wider">
                            AI DETOUR ACTIVE
                          </text>
                          <text x="55" y="18" textAnchor="middle" className="fill-gray-300 font-bold text-[6px]">
                            Redirecting: 35% | Bottleneck: -24%
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {showPredictions && overloadedGates.map((srcGate) => {
                    const targetGate = getDetourTarget(srcGate);
                    if (!targetGate) return null;
                    const coords: Record<string, { x: number, y: number }> = {
                      "Gate A": { x: 400, y: 70 },
                      "Gate B": { x: 700, y: 210 },
                      "Gate C": { x: 400, y: 350 },
                      "Gate D": { x: 100, y: 210 }
                    };
                    const p1 = coords[srcGate];
                    const p2 = coords[targetGate];
                    const pathD = `M ${p1.x} ${p1.y} A 330 160 0 0 1 ${p2.x} ${p2.y}`;
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2 + 15;
                    return (
                      <g key={`spill-${srcGate}`}>
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="animate-[dash_2s_linear_infinite]"
                        />
                        
                        <circle r="3" fill="#f59e0b">
                          <animateMotion dur="9s" repeatCount="indefinite" path={pathD} />
                        </circle>
                        
                        <text x={midX} y={midY} textAnchor="middle" className="fill-amber-500 font-black text-[7.5px] uppercase tracking-wider bg-slate-950/80 px-1 rounded">
                          ⇢ Predict Spill: {srcGate.replace("Gate ", "")} ➔ {targetGate.replace("Gate ", "")}
                        </text>
                      </g>
                    );
                  })}

                  {isFire && (
                    <g>
                      <circle cx="580" cy="130" r="22" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" className="animate-ping" style={{ transformOrigin: "580px 130px" }} />
                      <text x="580" y="138" textAnchor="middle" className="text-xl">🔥</text>
                      <text x="580" y="100" textAnchor="middle" className="fill-red-400 font-black text-[9px] uppercase tracking-wider animate-pulse">EVAC ZONE</text>
                    </g>
                  )}

                  {isStorm && (
                    <g>
                      <text x="200" y="50" className="text-xl opacity-75 animate-bounce">⚡</text>
                      <text x="600" y="50" className="text-xl opacity-75 animate-bounce">☔</text>
                    </g>
                  )}

                  {isMedical && (
                    <g>
                      <circle cx="700" cy="210" r="25" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: "700px 210px" }} />
                      <text x="700" y="175" textAnchor="middle" className="fill-red-400 font-extrabold text-[9px] animate-pulse">⚠️ MEDICAL ALARM</text>
                    </g>
                  )}

                  {criticalGates.map((gateName) => {
                    const coords: Record<string, { x: number, y: number }> = {
                      "Gate A": { x: 400, y: 70 },
                      "Gate B": { x: 700, y: 210 },
                      "Gate C": { x: 400, y: 350 },
                      "Gate D": { x: 100, y: 210 }
                    };
                    const pt = coords[gateName];
                    if (!pt) return null;
                    return (
                      <g key={`radar-${gateName}`}>
                        <circle cx={pt.x} cy={pt.y} r="28" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" className="animate-spin" style={{ transformOrigin: `${pt.x}px ${pt.y}px`, animationDuration: "12s" }} />
                        <circle cx={pt.x} cy={pt.y} r="35" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4" className="animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} />
                      </g>
                    );
                  })}

                  {selectedGate === "Gate B" && stadiumState?.sla_countdown !== undefined && stadiumState?.sla_countdown !== null && (
                    <g transform="translate(700, 160)">
                      <rect x="-35" y="-10" width="70" height="15" rx="3" className="fill-red-950/90 stroke stroke-red-500/50" />
                      <text x="0" y="1" textAnchor="middle" className="fill-red-400 font-black font-mono text-[8px] animate-pulse">
                        SLA: {stadiumState.sla_countdown}s
                      </text>
                    </g>
                  )}

                  {showResources && (stadiumState as any)?.assets?.map((asset: any) => (
                    <g key={asset.id} className="transition-all duration-300">
                      <circle
                        cx={asset.x}
                        cy={asset.y}
                        r={14}
                        className={`fill-none stroke-2 ${
                          asset.type === "medic"
                            ? "stroke-red-500"
                            : asset.type === "shuttle"
                            ? "stroke-purple-500"
                            : "stroke-blue-500"
                        } animate-ping`}
                        style={{ transformOrigin: `${asset.x}px ${asset.y}px` }}
                      />
                      <circle
                        cx={asset.x}
                        cy={asset.y}
                        r={8}
                        className={
                          asset.type === "medic"
                            ? "fill-red-500"
                            : asset.type === "shuttle"
                            ? "fill-purple-500"
                            : "fill-blue-500"
                        }
                      >
                        <animate attributeName="cx" from="400" to={asset.x} dur="2s" fill="freeze" />
                        <animate attributeName="cy" from="210" to={asset.y} dur="2s" fill="freeze" />
                      </circle>
                      <text x={asset.x} y={asset.y + 3} textAnchor="middle" className="text-[7px] font-bold fill-white">
                        {asset.type === "medic" ? "🚑" : asset.type === "shuttle" ? "🚌" : "👮"}
                        <animate attributeName="x" from="400" to={asset.x} dur="2s" fill="freeze" />
                        <animate attributeName="y" from="213" to={asset.y + 3} dur="2s" fill="freeze" />
                      </text>
                      <g transform={`translate(${asset.x - 35}, ${asset.y - 28})`}>
                        <rect
                          rx={4}
                          width={70}
                          height={15}
                          className="fill-slate-950/95 stroke stroke-white/20"
                        />
                        <text
                          x={35}
                          y={10}
                          textAnchor="middle"
                          className="fill-gray-100 font-mono text-[7.5px] font-bold"
                        >
                          {asset.label} ({asset.status})
                        </text>
                      </g>
                    </g>
                  ))}
                </svg>

                <div className="w-full grid grid-cols-4 sm:grid-cols-7 gap-2 bg-slate-950/40 border border-white/5 p-3 rounded-xl text-[9px] font-semibold text-gray-400 mt-4 select-none">
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 block"></span> Crowd Flow</div>
                  <div className="flex items-center gap-1"><span className="text-blue-400">👮</span> Police/Staff</div>
                  <div className="flex items-center gap-1"><span className="text-red-400">🚑</span> Medic Team</div>
                  <div className="flex items-center gap-1"><span className="text-emerald-400 font-bold">➔</span> AI Detour</div>
                  <div className="flex items-center gap-1"><span className="text-amber-500 font-bold">⇢</span> Predict Spill</div>
                  <div className="flex items-center gap-1"><span>⚠</span> Alarm Gate</div>
                  <div className="flex items-center gap-1"><span>🔥</span> Evac Hazard</div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="3d-view"
                initial={{ opacity: 0, scale: 1.05, rotateX: -15, y: 15, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, rotateX: -15, y: 15, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full"
                style={{ perspective: 1000 }}
              >
                <Suspense fallback={
                  <div className="flex flex-col items-center justify-center h-[520px] bg-slate-950/40 rounded-2xl border border-white/5 text-gray-400 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fifa-gold"></div>
                    <p className="text-xs font-semibold text-gray-200">Booting 3D Holographic Twin...</p>
                  </div>
                }>
                  <StadiumMap3D />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`w-full border rounded-2xl p-4 mt-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner transition-all duration-300 ${
          stadiumState.mode === "replay" 
            ? "bg-purple-950/45 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
            : "bg-slate-950/80 border-white/5"
        }`}>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            {stadiumState.mode === "replay" ? (
              <>
                <Clock className="h-4 w-4 text-purple-400 animate-spin" style={{ animationDuration: "6s" }} />
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
      </div>

      <GateInspector
        gates={gates}
        selectedGate={selectedGate}
        setSelectedGate={setSelectedGate}
        stadiumState={stadiumState}
        appLanguage={appLanguage}
      />
    </div>
  );
};
