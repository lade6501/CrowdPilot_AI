import React from "react";
import { GateMarkers } from "./GateMarkers";
import { CrowdLayer } from "./CrowdLayer";
import { AIDetourLayer } from "./AIDetourLayer";
import { PredictionLayer } from "./PredictionLayer";
import { IncidentLayer } from "./IncidentLayer";
import { ResourceLayer } from "./ResourceLayer";
import { StadiumLegend } from "./StadiumLegend";

interface Stadium2DProps {
  gates: any;
  setSelectedGate: (g: string | null) => void;
  hoveredGate: string | null;
  setHoveredGate: (g: string | null) => void;
  showCrowd: boolean;
  showAIPaths: boolean;
  showResources: boolean;
  showPredictions: boolean;
  overloadedGates: string[];
  criticalGates: string[];
  isWhistle: boolean;
  isFire: boolean;
  isStorm: boolean;
  isMedical: boolean;
  selectedGate: string | null;
  stadiumState: any;
  setShowCrowd: (show: boolean) => void;
  setShowAIPaths: (show: boolean) => void;
  setShowResources: (show: boolean) => void;
  setShowPredictions: (show: boolean) => void;
}

export const Stadium2D: React.FC<Stadium2DProps> = ({
  gates,
  setSelectedGate,
  hoveredGate,
  setHoveredGate,
  showCrowd,
  showAIPaths,
  showResources,
  showPredictions,
  overloadedGates,
  criticalGates,
  isWhistle,
  isFire,
  isStorm,
  isMedical,
  selectedGate,
  stadiumState,
  setShowCrowd,
  setShowAIPaths,
  setShowResources,
  setShowPredictions,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-between">
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

      <svg
        viewBox="0 0 800 420"
        className="w-full max-w-[600px] drop-shadow-[0_0_30px_rgba(15,30,54,0.3)] mt-8"
      >
        <ellipse
          cx="400"
          cy="210"
          rx="360"
          ry="170"
          className="fill-none stroke-slate-800 stroke-[2] stroke-dasharray-4"
        />
        <ellipse
          cx="400"
          cy="210"
          rx="300"
          ry="140"
          className="fill-slate-900/60 stroke-slate-700/80 stroke-[3]"
        />
        <ellipse
          cx="400"
          cy="210"
          rx="240"
          ry="110"
          className="fill-slate-950/40 stroke-slate-800 stroke-[2]"
        />

        <path
          d="M 400 70 L 400 140 M 700 210 L 600 210 M 400 350 L 400 280 M 100 210 L 200 210"
          className="stroke-slate-800 stroke-[1.5]"
        />

        <rect
          x="290"
          y="145"
          width="220"
          height="130"
          rx="10"
          className="fill-slate-950/80 stroke-slate-800 stroke-[2]"
        />
        <circle
          cx="400"
          cy="210"
          r="38"
          className="fill-none stroke-slate-800 stroke-[1.5]"
        />
        <line
          x1="400"
          y1="145"
          x2="400"
          y2="275"
          className="stroke-slate-800 stroke-[1.5]"
        />

        <GateMarkers
          gates={gates}
          setSelectedGate={setSelectedGate}
          hoveredGate={hoveredGate}
          setHoveredGate={setHoveredGate}
        />

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

        {showCrowd && (
          <CrowdLayer
            isWhistle={isWhistle}
            isFire={isFire}
            isStorm={isStorm}
          />
        )}

        {showAIPaths && (
          <AIDetourLayer
            overloadedGates={overloadedGates}
            gates={gates}
            showCrowd={showCrowd}
          />
        )}

        {showPredictions && (
          <PredictionLayer
            overloadedGates={overloadedGates}
            gates={gates}
          />
        )}

        <IncidentLayer
          isFire={isFire}
          isStorm={isStorm}
          isMedical={isMedical}
          criticalGates={criticalGates}
          selectedGate={selectedGate}
          stadiumState={stadiumState}
        />

        {showResources && (
          <ResourceLayer
            stadiumState={stadiumState}
          />
        )}
      </svg>

      <StadiumLegend />
    </div>
  );
};
