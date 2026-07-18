import React from "react";
import { gateCoords2D } from "./stadiumConstants";
import type { StadiumState } from "../../context/CrowdPilotContextInstance";

interface IncidentLayerProps {
  isFire: boolean;
  isStorm: boolean;
  isMedical: boolean;
  criticalGates: string[];
  selectedGate: string | null;
  stadiumState: StadiumState;
}

export const IncidentLayer: React.FC<IncidentLayerProps> = ({
  isFire,
  isStorm,
  isMedical,
  criticalGates,
  selectedGate,
  stadiumState,
}) => {
  return (
    <>
      {isFire && (
        <g>
          <circle
            cx="580"
            cy="130"
            r="22"
            fill="#ef4444"
            fillOpacity="0.15"
            stroke="#ef4444"
            strokeWidth="1"
            className="animate-ping"
            style={{ transformOrigin: "580px 130px" }}
          />
          <text x="580" y="138" textAnchor="middle" className="text-xl">
            🔥
          </text>
          <text
            x="580"
            y="100"
            textAnchor="middle"
            className="fill-red-400 font-black text-[9px] uppercase tracking-wider animate-pulse"
          >
            EVAC ZONE
          </text>
        </g>
      )}

      {isStorm && (
        <g>
          <text x="200" y="50" className="text-xl opacity-75 animate-bounce">
            ⚡
          </text>
          <text x="600" y="50" className="text-xl opacity-75 animate-bounce">
            ☔
          </text>
        </g>
      )}

      {isMedical && (
        <g>
          <circle
            cx="700"
            cy="210"
            r="25"
            fill="#ef4444"
            fillOpacity="0.1"
            stroke="#ef4444"
            strokeWidth="1.5"
            className="animate-ping"
            style={{ transformOrigin: "700px 210px" }}
          />
          <text
            x="700"
            y="175"
            textAnchor="middle"
            className="fill-red-400 font-extrabold text-[9px] animate-pulse"
          >
            ⚠️ MEDICAL ALARM
          </text>
        </g>
      )}

      {criticalGates.map((gateName) => {
        const pt = gateCoords2D[gateName];
        if (!pt) return null;
        return (
          <g key={`radar-${gateName}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="28"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="3,3"
              className="animate-spin"
              style={{
                transformOrigin: `${pt.x}px ${pt.y}px`,
                animationDuration: "12s",
              }}
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r="35"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              className="animate-ping"
              style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
            />
          </g>
        );
      })}

      {selectedGate === "Gate B" &&
        stadiumState?.sla_countdown !== undefined &&
        stadiumState?.sla_countdown !== null && (
          <g transform="translate(700, 160)">
            <rect
              x="-35"
              y="-10"
              width="70"
              height="15"
              rx="3"
              className="fill-red-950/90 stroke stroke-red-500/50"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              className="fill-red-400 font-black font-mono text-[8px] animate-pulse"
            >
              SLA: {stadiumState.sla_countdown}s
            </text>
          </g>
        )}
    </>
  );
};
