import React from "react";
import { getDetourTarget, getDetourPathD } from "./stadiumHelpers";
import { gateCoords2D } from "./stadiumConstants";

interface AIDetourLayerProps {
  overloadedGates: string[];
  gates: any;
  showCrowd: boolean;
}

export const AIDetourLayer: React.FC<AIDetourLayerProps> = ({
  overloadedGates,
  gates,
  showCrowd,
}) => {
  return (
    <>
      {overloadedGates.map((srcGate) => {
        const targetGate = getDetourTarget(srcGate, gates);
        if (!targetGate) return null;
        const pathD = getDetourPathD(srcGate, targetGate);
        const p1 = gateCoords2D[srcGate];
        const p2 = gateCoords2D[targetGate];
        if (!p1 || !p2) return null;
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
                <circle r="1.2" fill="#10b981">
                  <animateMotion dur="5s" repeatCount="indefinite" path={pathD} />
                </circle>
                <circle r="1.2" fill="#10b981">
                  <animateMotion dur="5s" begin="1.66s" repeatCount="indefinite" path={pathD} />
                </circle>
                <circle r="1.2" fill="#10b981">
                  <animateMotion dur="5s" begin="3.33s" repeatCount="indefinite" path={pathD} />
                </circle>
              </g>
            )}

            <g transform={`translate(${midX - 55}, ${midY - 14})`}>
              <rect
                width="110"
                height="26"
                rx="4"
                className="fill-slate-950/90 stroke stroke-emerald-500/20"
              />
              <text
                x="55"
                y="10"
                textAnchor="middle"
                className="fill-emerald-400 font-extrabold text-[6.5px] uppercase tracking-wider"
              >
                AI DETOUR ACTIVE
              </text>
              <text
                x="55"
                y="18"
                textAnchor="middle"
                className="fill-gray-300 font-bold text-[6px]"
              >
                Redirecting: 35% | Bottleneck: -24%
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
};
