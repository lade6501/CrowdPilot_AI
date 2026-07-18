import React from "react";
import { getGateColorClass } from "./stadiumHelpers";
import type { Gate } from "../../context/CrowdPilotContextInstance";

interface GateMarkersProps {
  gates: Record<string, Gate>;
  setSelectedGate: (g: string | null) => void;
  hoveredGate: string | null;
  setHoveredGate: (g: string | null) => void;
}

export const GateMarkers: React.FC<GateMarkersProps> = ({
  gates,
  setSelectedGate,
  hoveredGate,
  setHoveredGate,
}) => {
  const gateList = [
    { name: "Gate A", x: 400, y: 70, labelX: 400, labelY: 74, textY: 47, lineX1: 400, lineY1: 70, lineX2: 400, lineY2: 130, letter: "A" },
    { name: "Gate B", x: 700, y: 210, labelX: 700, labelY: 214, textY: 187, lineX1: 700, lineY1: 210, lineX2: 640, lineY2: 210, letter: "B" },
    { name: "Gate C", x: 400, y: 350, labelX: 400, labelY: 354, textY: 327, lineX1: 400, lineY1: 350, lineX2: 400, lineY2: 290, letter: "C" },
    { name: "Gate D", x: 100, y: 210, labelX: 100, labelY: 214, textY: 187, lineX1: 100, lineY1: 210, lineX2: 160, lineY2: 210, letter: "D" },
  ];

  return (
    <>
      {gateList.map((g) => {
        const occ = gates[g.name]?.occupancy || 0;
        const isHovered = hoveredGate === g.name;
        return (
          <g
            key={g.name}
            className="cursor-pointer group"
            onClick={() => setSelectedGate(g.name)}
            onMouseEnter={() => setHoveredGate(g.name)}
            onMouseLeave={() => setHoveredGate(null)}
          >
            <line
              x1={g.lineX1}
              y1={g.lineY1}
              x2={g.lineX2}
              y2={g.lineY2}
              className="stroke-slate-700 stroke-[2] group-hover:stroke-fifa-gold transition-colors"
            />
            <circle
              cx={g.x}
              cy={g.y}
              r={isHovered ? 19 : 15}
              className={`${getGateColorClass(occ)} stroke-2 transition-all duration-300`}
            />
            <text
              x={g.labelX}
              y={g.labelY}
              textAnchor="middle"
              className="fill-slate-950 font-bold text-xs"
            >
              {g.letter}
            </text>
            <text
              x={g.x}
              y={g.textY}
              textAnchor="middle"
              className="fill-gray-300 font-semibold text-xs opacity-80 group-hover:opacity-100 transition-opacity"
            >
              {g.name} ({occ}%)
            </text>
            {occ >= 90 && (
              <circle
                cx={g.x}
                cy={g.y}
                r="25"
                className="stroke-red-500 fill-none stroke-[1.5] animate-ping"
                style={{ transformOrigin: `${g.x}px ${g.y}px` }}
              />
            )}
          </g>
        );
      })}
    </>
  );
};
