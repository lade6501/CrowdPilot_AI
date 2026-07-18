import { gateCoords2D } from "./stadiumConstants";

export const getGateColorClass = (occupancy: number) => {
  if (occupancy >= 90) return "fill-red-500 stroke-red-600 gate-critical-pulse";
  if (occupancy >= 75) return "fill-amber-500 stroke-amber-600 gate-warning-pulse";
  return "fill-emerald-500 stroke-emerald-600";
};

export const getDetourTarget = (srcGate: string, gates: any) => {
  const gateOptions = ["Gate A", "Gate B", "Gate C", "Gate D"].filter(
    (g) => g !== srcGate,
  );
  const neighbors: Record<string, string[]> = {
    "Gate A": ["Gate B", "Gate D", "Gate C"],
    "Gate B": ["Gate A", "Gate C", "Gate D"],
    "Gate C": ["Gate B", "Gate D", "Gate A"],
    "Gate D": ["Gate A", "Gate C", "Gate B"],
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

export const getDetourPathD = (src: string, target: string) => {
  const p1 = gateCoords2D[src];
  const p2 = gateCoords2D[target];
  if (!p1 || !p2) return "";
  let qx = (p1.x + p2.x) / 2;
  let qy = (p1.y + p2.y) / 2;
  if (src === "Gate B" && target === "Gate D") {
    qx = 400;
    qy = 130;
  } else if (src === "Gate D" && target === "Gate B") {
    qx = 400;
    qy = 290;
  } else if (src === "Gate A" && target === "Gate C") {
    qx = 480;
    qy = 210;
  } else if (src === "Gate C" && target === "Gate A") {
    qx = 320;
    qy = 210;
  } else {
    if (
      (src === "Gate A" && target === "Gate B") ||
      (src === "Gate B" && target === "Gate A")
    ) {
      qx = 580;
      qy = 100;
    } else if (
      (src === "Gate B" && target === "Gate C") ||
      (src === "Gate C" && target === "Gate B")
    ) {
      qx = 580;
      qy = 310;
    } else if (
      (src === "Gate C" && target === "Gate D") ||
      (src === "Gate D" && target === "Gate C")
    ) {
      qx = 220;
      qy = 310;
    } else if (
      (src === "Gate D" && target === "Gate A") ||
      (src === "Gate A" && target === "Gate D")
    ) {
      qx = 220;
      qy = 100;
    }
  }
  return `M ${p1.x} ${p1.y} Q ${qx} ${qy} ${p2.x} ${p2.y}`;
};
