import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { useCrowdPilot } from "../context/CrowdPilotContext";

const gateCoords: Record<string, [number, number, number]> = {
  "Gate A": [0, 0, -4.5],
  "Gate B": [6.5, 0, 0],
  "Gate C": [0, 0, 4.5],
  "Gate D": [-6.5, 0, 0],
};

const pitchCoords: Record<string, [number, number, number]> = {
  "Gate A": [0, 0, -2.2],
  "Gate B": [3.2, 0, 0],
  "Gate C": [0, 0, 2.2],
  "Gate D": [-3.2, 0, 0],
};

const HolographicField: React.FC = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[9, 6]} />
        <meshBasicMaterial color="#0b1329" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      
      <Line
        points={[
          [-4.5, 0, -3],
          [4.5, 0, -3],
          [4.5, 0, 3],
          [-4.5, 0, 3],
          [-4.5, 0, -3],
        ]}
        color="#38bdf8"
        lineWidth={1}
        transparent
        opacity={0.16}
      />
      
      <Line
        points={[
          [0, 0, -3],
          [0, 0, 3],
        ]}
        color="#38bdf8"
        lineWidth={0.8}
        transparent
        opacity={0.1}
      />
      
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.23, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} />
      </mesh>
    </group>
  );
};

const HolographicBowl: React.FC = () => {
  const t1Ref = useRef<THREE.Mesh>(null);
  const t2Ref = useRef<THREE.Mesh>(null);
  const t3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (t1Ref.current) t1Ref.current.rotation.y = t * 0.04;
    if (t2Ref.current) t2Ref.current.rotation.y = -t * 0.025;
    if (t3Ref.current) t3Ref.current.rotation.y = t * 0.015;
  });

  return (
    <group>
      <mesh ref={t1Ref} position={[0, 0.25, 0]}>
        <cylinderGeometry args={[5.2, 4.8, 0.5, 32, 2, true]} />
        <meshBasicMaterial color="#0891b2" wireframe transparent opacity={0.16} />
      </mesh>
      
      <mesh ref={t2Ref} position={[0, 0.75, 0]}>
        <cylinderGeometry args={[6.2, 5.8, 0.6, 32, 2, true]} />
        <meshBasicMaterial color="#0e7490" wireframe transparent opacity={0.11} />
      </mesh>
      
      <mesh ref={t3Ref} position={[0, 1.3, 0]}>
        <cylinderGeometry args={[7.2, 6.8, 0.8, 32, 2, true]} />
        <meshBasicMaterial color="#0369a1" wireframe transparent opacity={0.08} />
      </mesh>

      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[7.5, 7.5, 1.8, 32, 1, true]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[7.51, 7.51, 1.805, 32, 4, true]} />
        <meshBasicMaterial color="#0284c7" wireframe transparent opacity={0.15} />
      </mesh>

      <mesh position={[0, 1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.45, 7.55, 64]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      <Line
        points={[
          [-7.5, 0.01, -5.5],
          [7.5, 0.01, -5.5],
          [7.5, 0.01, 5.5],
          [-7.5, 0.01, 5.5],
          [-7.5, 0.01, -5.5],
        ]}
        color="#0284c7"
        lineWidth={1.5}
        transparent
        opacity={0.35}
      />
    </group>
  );
};

const AIScanningWave: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const radiusRef = useRef(0.1);

  useFrame(() => {
    if (!meshRef.current) return;
    radiusRef.current += 0.06;
    if (radiusRef.current > 9.2) {
      radiusRef.current = 0.1;
    }
    meshRef.current.scale.setScalar(radiusRef.current);
    
    if (meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.28 * (1 - radiusRef.current / 9.2));
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[0.96, 1.0, 32]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

interface GateNodeProps {
  name: string;
  occupancy: number;
  selected: boolean;
  onClick: () => void;
}

const GateNode: React.FC<GateNodeProps> = ({ name, occupancy, selected, onClick }) => {
  const coord = gateCoords[name] || [0, 0, 0];
  const ringRef = useRef<THREE.Mesh>(null);
  const currentOccupancy = useRef(occupancy);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    currentOccupancy.current += (occupancy - currentOccupancy.current) * 0.08;

    if (ringRef.current) {
      if (currentOccupancy.current >= 90) {
        ringRef.current.scale.setScalar(1 + Math.sin(t * 8) * 0.35);
      } else if (currentOccupancy.current >= 75) {
        ringRef.current.scale.setScalar(1 + Math.sin(t * 3.5) * 0.18);
      } else {
        ringRef.current.scale.setScalar(1);
      }
    }
  });

  const color = currentOccupancy.current >= 90 ? "#ef4444" : currentOccupancy.current >= 75 ? "#f59e0b" : "#10b981";

  return (
    <group position={coord}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>

      <mesh position={[0, 1.2, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.45, 0.55, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.7, 0.8, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} />
        </mesh>
      )}

      {currentOccupancy.current >= 90 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.95, 1.0, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

interface ParticleProps {
  path: [number, number, number][];
  color: string;
  speed: number;
  delay: number;
  size: number;
}

const MovingParticle: React.FC<ParticleProps> = ({ path, color, speed, delay, size }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  const curve = useMemo(() => {
    const points = path.map(p => new THREE.Vector3(...p));
    if (points.length === 2) {
      return new THREE.LineCurve3(points[0], points[1]);
    } else {
      return new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
    }
  }, [path]);

  useEffect(() => {
    progress.current = -delay;
  }, [delay]);

  useFrame(() => {
    if (!meshRef.current) return;
    progress.current += speed;
    if (progress.current >= 1) {
      progress.current = 0;
    }
    if (progress.current >= 0) {
      const pos = curve.getPointAt(progress.current);
      meshRef.current.position.copy(pos);
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

const Asset3D: React.FC<{ asset: any; dest: [number, number, number] }> = ({ asset, dest }) => {
  const ref = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0.4, 0));

  useFrame(() => {
    if (!ref.current) return;
    const target = new THREE.Vector3(...dest);
    target.y = 0.35;
    currentPos.current.lerp(target, 0.08);
    ref.current.position.copy(currentPos.current);
  });

  const color = asset.type === "medic" ? "#ef4444" : asset.type === "shuttle" ? "#a855f7" : "#3b82f6";
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

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
  getDetourPathPoints: (src: string, target: string) => [number, number, number][];
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
  const activeIncident = incidents.find(inc => inc.status === "active");
  const isFire = activeIncident?.title?.toLowerCase().includes("fire") || activeIncident?.title?.toLowerCase().includes("evac");
  const isStorm = activeIncident?.title?.toLowerCase().includes("storm") || activeIncident?.title?.toLowerCase().includes("rain") || activeIncident?.title?.toLowerCase().includes("lightning");
  const isEgress = activeIncident?.title?.toLowerCase().includes("whistle") || activeIncident?.title?.toLowerCase().includes("full-time") || activeIncident?.title?.toLowerCase().includes("full time");

  const overloadedGates = Object.keys(gates).filter(g => (gates[g]?.occupancy || 0) >= 75);

  const crowdParticles = useMemo(() => {
    const list: { key: string; path: [number, number, number][]; color: string; speed: number; delay: number }[] = [];
    if (!showCrowd) return list;

    const gateNames = ["Gate A", "Gate B", "Gate C", "Gate D"];
    
    gateNames.forEach(gate => {
      const occ = gates[gate]?.occupancy || 0;
      const speed = occ >= 75 ? 0.0015 : 0.0035;
      const count = occ >= 90 ? 24 : occ >= 75 ? 16 : 6;
      
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
    const list: { key: string; start: [number, number, number]; speed: number }[] = [];
    if (!isStorm) return list;

    for (let i = 0; i < 45; i++) {
      list.push({
        key: `rain-${i}`,
        start: [
          (Math.random() - 0.5) * 15,
          6 + Math.random() * 2,
          (Math.random() - 0.5) * 10
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
          selected={selectedGate === gate}
          onClick={() => setSelectedGate(gate)}
        />
      ))}

      {crowdParticles.map(p => (
        <MovingParticle
          key={p.key}
          path={p.path}
          color={p.color}
          speed={p.speed}
          delay={p.delay}
          size={0.06}
        />
      ))}

      {showAIPaths && overloadedGates.map((srcGate) => {
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
            <MovingParticle path={pts} color="#10b981" speed={0.008} delay={0} size={0.12} />
            <MovingParticle path={pts} color="#10b981" speed={0.008} delay={0.25} size={0.12} />
            <MovingParticle path={pts} color="#10b981" speed={0.008} delay={0.5} size={0.12} />
            <MovingParticle path={pts} color="#10b981" speed={0.008} delay={0.75} size={0.12} />
          </group>
        );
      })}

      {showPredictions && overloadedGates.map((srcGate) => {
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
              speed={0.003}
              delay={0}
              size={0.11}
            />
          </group>
        );
      })}

      {showResources && assets.map((asset) => {
        const destCoord = gateCoords[asset.gate] || [0, 0, 0];
        return (
          <Asset3D key={asset.id} asset={asset} dest={destCoord} />
        );
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

      {isStorm && rainParticles.map((r) => (
        <RainDrop key={r.key} start={r.start} speed={r.speed} />
      ))}
    </group>
  );
};

const RainDrop: React.FC<{ start: [number, number, number]; speed: number }> = ({ start, speed }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y -= speed;
    if (ref.current.position.y <= 0) {
      ref.current.position.y = start[1];
    }
  });

  return (
    <mesh ref={ref} position={start}>
      <boxGeometry args={[0.04, 0.3, 0.04]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.5} />
    </mesh>
  );
};

export const StadiumMap3D: React.FC = () => {
  const { stadiumState, selectedGate, setSelectedGate } = useCrowdPilot();
  
  const [showCrowd, setShowCrowd] = useState(true);
  const [showAIPaths, setShowAIPaths] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);

  if (!stadiumState) return null;

  const gates = stadiumState.gates;
  const incidents = stadiumState.incidents || [];
  const assets = (stadiumState as any).assets || [];

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

  const getDetourPathPoints = (src: string, target: string): [number, number, number][] => {
    const p1 = gateCoords[src];
    const p2 = gateCoords[target];
    if (!p1 || !p2) return [];

    let qx = (p1[0] + p2[0]) / 2;
    let qy = 1.2;
    let qz = (p1[2] + p2[2]) / 2;

    if (src === "Gate B" && target === "Gate D") {
      qx = 0; qz = -2.5;
    } else if (src === "Gate D" && target === "Gate B") {
      qx = 0; qz = 2.5;
    } else if (src === "Gate A" && target === "Gate C") {
      qx = 2.2; qz = 0;
    } else if (src === "Gate C" && target === "Gate A") {
      qx = -2.2; qz = 0;
    } else {
      if ((src === "Gate A" && target === "Gate B") || (src === "Gate B" && target === "Gate A")) {
        qx = 4.2; qz = -2.2;
      } else if ((src === "Gate B" && target === "Gate C") || (src === "Gate C" && target === "Gate B")) {
        qx = 4.2; qz = 2.2;
      } else if ((src === "Gate C" && target === "Gate D") || (src === "Gate D" && target === "Gate C")) {
        qx = -4.2; qz = 2.2;
      } else if ((src === "Gate D" && target === "Gate A") || (src === "Gate A" && target === "Gate D")) {
        qx = -4.2; qz = -2.2;
      }
    }
    return [p1, [qx, qy, qz], p2];
  };

  return (
    <div className="w-full relative h-[420px] bg-slate-950 rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex flex-col justify-between">
      <div className="absolute top-4 left-4 z-10 flex gap-1.5 flex-wrap">
        <button
          onClick={() => setShowCrowd(!showCrowd)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showCrowd ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/35" : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ● Crowd
        </button>
        <button
          onClick={() => setShowAIPaths(!showAIPaths)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showAIPaths ? "bg-fifa-gold/20 text-fifa-gold border-fifa-gold/35" : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ➔ AI Detour
        </button>
        <button
          onClick={() => setShowResources(!showResources)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showResources ? "bg-blue-500/20 text-blue-450 border-blue-500/35" : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ★ Staff
        </button>
        <button
          onClick={() => setShowPredictions(!showPredictions)}
          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
            showPredictions ? "bg-purple-500/20 text-purple-400 border-purple-500/35" : "bg-slate-900/60 text-gray-500 border-white/5"
          }`}
        >
          ✦ Predict
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-slate-950/80 px-2.5 py-1.5 rounded border border-white/5 select-none text-right">
        <span className="text-[9px] font-bold text-fifa-gold uppercase tracking-wider block">
          Presentation Mode
        </span>
        <span className="text-[8px] text-gray-400 font-medium block">
          Isometric AI Digital Twin
        </span>
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
          
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2.8}
            minPolarAngle={Math.PI / 4.2}
            maxAzimuthAngle={Math.PI / 3.5}
            minAzimuthAngle={-Math.PI / 3.5}
          />
        </Canvas>
      </div>
    </div>
  );
};
