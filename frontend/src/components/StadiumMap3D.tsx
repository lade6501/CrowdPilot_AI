import React, { useRef, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { useCrowdPilot } from "../hooks/useCrowdPilot";
import { gateCoords, pitchCoords } from "./Stadium3DConstants";
import {
  HolographicField,
  HolographicBowl,
  AIScanningWave,
  GateNode,
  MovingParticle,
  Asset3D,
  RainDrop,
  CameraRig
} from "./Stadium3DElements";

interface SceneProps {
  gates: any;
  incidents: any[];
  assets: any[];
  showCrowd: boolean;
  showAIPaths: boolean;
  showPredictions: boolean;
  showResources: boolean;
  selectedGate: string | null;
  setSelectedGate: (g: string | null) => void;
  getDetourTarget: (g: string) => string;
  getDetourPathPoints: (
    src: string,
    target: string,
  ) => [number, number, number][];
}

const MainScene: React.FC<SceneProps> = ({
  gates,
  incidents,
  assets,
  showCrowd,
  showAIPaths,
  showPredictions,
  showResources,
  selectedGate,
  setSelectedGate,
  getDetourTarget,
  getDetourPathPoints,
}) => {
  const activeIncident = incidents.find((inc) => inc.status === "active");
  const isFire =
    activeIncident?.title?.toLowerCase().includes("fire") ||
    activeIncident?.title?.toLowerCase().includes("evac");
  const isStorm =
    activeIncident?.title?.toLowerCase().includes("storm") ||
    activeIncident?.title?.toLowerCase().includes("rain") ||
    activeIncident?.title?.toLowerCase().includes("lightning");
  const isEgress =
    activeIncident?.title?.toLowerCase().includes("whistle") ||
    activeIncident?.title?.toLowerCase().includes("full-time") ||
    activeIncident?.title?.toLowerCase().includes("full time");

  const overloadedGates = Object.keys(gates).filter(
    (g) => (gates[g]?.occupancy || 0) >= 75,
  );

  const crowdParticles = useMemo(() => {
    const list: {
      key: string;
      path: [number, number, number][];
      color: string;
      speed: number;
      delay: number;
    }[] = [];
    if (!showCrowd) return list;

    const gateNames = ["Gate A", "Gate B", "Gate C", "Gate D"];

    gateNames.forEach((gate) => {
      const occ = gates[gate]?.occupancy || 0;
      const speed = occ >= 75 ? 0.0015 : 0.0035;
      let count = 8;
      if (occ >= 90) count = 60;
      else if (occ >= 80) count = 35;
      else if (occ >= 70) count = 20;

      const start = gateCoords[gate];
      const end = pitchCoords[gate];
      const path = isEgress ? [end, start] : [start, end];

      for (let i = 0; i < count; i++) {
        list.push({
          key: `crowd-${gate}-${i}`,
          path,
          color: isEgress ? "#60a5fa" : "#10b981",
          speed,
          delay: i * (1 / count),
        });
      }
    });

    return list;
  }, [showCrowd, gates, isEgress]);

  const rainParticles = useMemo(() => {
    const list: {
      key: string;
      start: [number, number, number];
      speed: number;
    }[] = [];
    if (!isStorm) return list;

    for (let i = 0; i < 45; i++) {
      list.push({
        key: `rain-${i}`,
        start: [
          (Math.random() - 0.5) * 15,
          6 + Math.random() * 2,
          (Math.random() - 0.5) * 10,
        ],
        speed: 0.15 + Math.random() * 0.1,
      });
    }
    return list;
  }, [isStorm]);

  return (
    <group>
      <HolographicField />
      <HolographicBowl />
      <AIScanningWave />

      {["Gate A", "Gate B", "Gate C", "Gate D"].map((gate) => (
        <GateNode
          key={gate}
          name={gate}
          occupancy={gates[gate]?.occupancy || 0}
          showPredictions={showPredictions}
          selected={selectedGate === gate}
          onClick={() => setSelectedGate(gate)}
        />
      ))}

      {crowdParticles.map((p) => (
        <MovingParticle
          key={p.key}
          path={p.path}
          color={p.color}
          speed={p.speed}
          delay={p.delay}
          size={0.06}
        />
      ))}

      {showAIPaths &&
        overloadedGates.map((srcGate) => {
          const targetGate = getDetourTarget(srcGate);
          if (!targetGate) return null;
          const pts = getDetourPathPoints(srcGate, targetGate);
          return (
            <group key={`detour3d-${srcGate}`}>
              <Line
                points={pts}
                color="#10b981"
                lineWidth={2}
                transparent
                opacity={0.5}
              />
              <MovingParticle
                path={pts}
                color="#10b981"
                speed={0.015}
                delay={0}
                size={0.12}
              />
              <MovingParticle
                path={pts}
                color="#10b981"
                speed={0.015}
                delay={0.25}
                size={0.12}
              />
              <MovingParticle
                path={pts}
                color="#10b981"
                speed={0.015}
                delay={0.5}
                size={0.12}
              />
              <MovingParticle
                path={pts}
                color="#10b981"
                speed={0.015}
                delay={0.75}
                size={0.12}
              />
            </group>
          );
        })}

      {showPredictions &&
        overloadedGates.map((srcGate) => {
          const targetGate = getDetourTarget(srcGate);
          if (!targetGate) return null;
          const pts = getDetourPathPoints(srcGate, targetGate);
          return (
            <group key={`pred3d-${srcGate}`}>
              <Line
                points={pts}
                color="#f59e0b"
                lineWidth={1}
                dashed
                dashScale={2}
                transparent
                opacity={0.4}
              />
              <MovingParticle
                path={pts}
                color="#f59e0b"
                speed={0.012}
                delay={0}
                size={0.11}
              />
              <MovingParticle
                path={pts}
                color="#f59e0b"
                speed={0.012}
                delay={0.25}
                size={0.11}
              />
              <MovingParticle
                path={pts}
                color="#f59e0b"
                speed={0.012}
                delay={0.5}
                size={0.11}
              />
              <MovingParticle
                path={pts}
                color="#f59e0b"
                speed={0.012}
                delay={0.75}
                size={0.11}
              />
            </group>
          );
        })}

      {showResources &&
        assets.map((asset) => {
          const destCoord = gateCoords[asset.gate] || [0, 0, 0];
          return <Asset3D key={asset.id} asset={asset} dest={destCoord} />;
        })}

      {isFire && (
        <group position={[3.5, 0.1, -1.8]}>
          <mesh>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.2} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.0, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {isStorm &&
        rainParticles.map((r) => (
          <RainDrop key={r.key} start={r.start} speed={r.speed} />
        ))}
    </group>
  );
};

export const StadiumMap3D: React.FC = () => {
  const { stadiumState, selectedGate, setSelectedGate } = useCrowdPilot();

  const [showCrowd, setShowCrowd] = useState(true);
  const [showAIPaths, setShowAIPaths] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<string>("Overview");
  const controlsRef = useRef<any>(null);

  if (!stadiumState) return null;

  const gates = stadiumState.gates;
  const incidents = stadiumState.incidents || [];
  const assets = (stadiumState as any).assets || [];

  const getDetourTarget = (srcGate: string) => {
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

  const getDetourPathPoints = (
    src: string,
    target: string,
  ): [number, number, number][] => {
    const p1 = gateCoords[src];
    const p2 = gateCoords[target];
    if (!p1 || !p2) return [];

    let qx = (p1[0] + p2[0]) / 2;
    let qy = 1.2;
    let qz = (p1[2] + p2[2]) / 2;

    if (src === "Gate B" && target === "Gate D") {
      qx = 0;
      qz = -2.5;
    } else if (src === "Gate D" && target === "Gate B") {
      qx = 0;
      qz = 2.5;
    } else if (src === "Gate A" && target === "Gate C") {
      qx = 2.2;
      qz = 0;
    } else if (src === "Gate C" && target === "Gate A") {
      qx = -2.2;
      qz = 0;
    } else {
      if (
        (src === "Gate A" && target === "Gate B") ||
        (src === "Gate B" && target === "Gate A")
      ) {
        qx = 4.2;
        qz = -2.2;
      } else if (
        (src === "Gate B" && target === "Gate C") ||
        (src === "Gate C" && target === "Gate B")
      ) {
        qx = 4.2;
        qz = 2.2;
      } else if (
        (src === "Gate C" && target === "Gate D") ||
        (src === "Gate D" && target === "Gate C")
      ) {
        qx = -4.2;
        qz = 2.2;
      } else if (
        (src === "Gate D" && target === "Gate A") ||
        (src === "Gate A" && target === "Gate D")
      ) {
        qx = -4.2;
        qz = -2.2;
      }
    }

    return [p1, [qx, qy, qz], p2];
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex gap-1 bg-slate-950/80 p-1 rounded-lg border border-white/5 shadow-md">
        <button
          onClick={() => setShowCrowd(!showCrowd)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showCrowd
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/35"
              : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ● Crowd
        </button>
        <button
          onClick={() => setShowAIPaths(!showAIPaths)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showAIPaths
              ? "bg-fifa-gold/20 text-fifa-gold border-fifa-gold/35"
              : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ➔ AI Detour
        </button>
        <button
          onClick={() => setShowResources(!showResources)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showResources
              ? "bg-blue-500/20 text-blue-450 border-blue-500/35"
              : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ★ Staff
        </button>
        <button
          onClick={() => setShowPredictions(!showPredictions)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showPredictions
              ? "bg-purple-500/20 text-purple-400 border-purple-500/35"
              : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ✦ Predict
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 select-none text-left space-y-1.5 shadow-xl max-w-48">
        <div className="flex items-center justify-between border-b border-white/5 pb-1 gap-4">
          <span className="text-[9px] font-black text-fifa-gold uppercase tracking-wider">
            AI STATUS
          </span>
          <span className="flex items-center gap-1 text-[8.5px] text-emerald-455 font-bold">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
            Monitoring
          </span>
        </div>
        <div className="space-y-1 text-[8.5px] text-gray-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span>📊</span>
            <span>147 Telemetry Events/min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🤖</span>
            <span>6 Agents Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🎯</span>
            <span>Confidence 94%</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex gap-1 items-center bg-slate-950/85 backdrop-blur-md border border-white/5 p-1 rounded-xl shadow-lg">
        <span className="text-[7.5px] text-gray-500 uppercase tracking-widest font-black px-1.5 select-none">
          Presets:
        </span>
        {["Overview", "Gate A", "Gate B", "Gate C", "Gate D"].map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setCameraPreset(preset);
              if (preset === "Overview") {
                setSelectedGate(null);
              } else {
                setSelectedGate(preset);
              }
            }}
            className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer ${
              cameraPreset === preset
                ? "bg-fifa-gold/20 text-fifa-gold border-fifa-gold/30 shadow"
                : "bg-slate-900/60 text-gray-400 border-transparent hover:text-gray-200"
            }`}
          >
            {preset.replace("Gate ", "")}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full h-full">
        <Canvas
          camera={{ position: [9, 8, 9], fov: 42 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.55} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />

          <MainScene
            gates={gates}
            incidents={incidents}
            assets={assets}
            showCrowd={showCrowd}
            showAIPaths={showAIPaths}
            showPredictions={showPredictions}
            showResources={showResources}
            selectedGate={selectedGate}
            setSelectedGate={setSelectedGate}
            getDetourTarget={getDetourTarget}
            getDetourPathPoints={getDetourPathPoints}
          />

          <CameraRig activePreset={cameraPreset} controlsRef={controlsRef} />

          <OrbitControls
            ref={controlsRef}
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2.8}
            minPolarAngle={Math.PI / 4.2}
          />
        </Canvas>
      </div>
    </div>
  );
};
