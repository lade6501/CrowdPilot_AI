import React from "react";
import { getDetourTarget } from "./stadiumHelpers";
import { gateCoords2D } from "./stadiumConstants";
import type { Gate } from "../../context/CrowdPilotContextInstance";

interface PredictionLayerProps {
  overloadedGates: string[];
  gates: Record<string, Gate>;
}

export const PredictionLayer: React.FC<PredictionLayerProps> = ({
  overloadedGates,
  gates,
}) => {
  return (
    <>
      {overloadedGates.map((srcGate) => {
        const targetGate = getDetourTarget(srcGate, gates);
        if (!targetGate) return null;
        const p1 = gateCoords2D[srcGate];
        const p2 = gateCoords2D[targetGate];
        if (!p1 || !p2) return null;
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

            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              className="fill-amber-500 font-black text-[7.5px] uppercase tracking-wider bg-slate-950/80 px-1 rounded"
            >
              ⇢ Predict Spill: {srcGate.replace("Gate ", "")} ➔{" "}
              {targetGate.replace("Gate ", "")}
            </text>
          </g>
        );
      })}
    </>
  );
};
