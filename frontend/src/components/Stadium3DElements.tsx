import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import * as THREE from "three";
import { gateCoords, pitchCoords } from "./Stadium3DConstants";

export const HolographicField: React.FC = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[9, 6]} />
        <meshBasicMaterial
          color="#0b1329"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
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

export const HolographicBowl: React.FC = () => {
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
        <meshBasicMaterial
          color="#0891b2"
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>

      <mesh ref={t2Ref} position={[0, 0.75, 0]}>
        <cylinderGeometry args={[6.2, 5.8, 0.6, 32, 2, true]} />
        <meshBasicMaterial
          color="#0e7490"
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      <mesh ref={t3Ref} position={[0, 1.3, 0]}>
        <cylinderGeometry args={[7.2, 6.8, 0.8, 32, 2, true]} />
        <meshBasicMaterial
          color="#0369a1"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[7.5, 7.5, 1.8, 32, 1, true]} />
        <meshBasicMaterial
          color="#0f172a"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[7.51, 7.51, 1.805, 32, 4, true]} />
        <meshBasicMaterial
          color="#0284c7"
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>

      <mesh position={[0, 1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.45, 7.55, 64]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
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

export const AIScanningWave: React.FC = () => {
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
      <meshBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.25}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface GateNodeProps {
  name: string;
  occupancy: number;
  showPredictions?: boolean;
  selected: boolean;
  onClick: () => void;
}

export const GateNode: React.FC<GateNodeProps> = ({
  name,
  occupancy,
  showPredictions = false,
  selected,
  onClick,
}) => {
  const coord = gateCoords[name] || [0, 0, 0];
  const ringRef = useRef<THREE.Mesh>(null);
  const ghostRef = useRef<THREE.Mesh>(null);
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

    if (ghostRef.current) {
      ghostRef.current.scale.setScalar(1 + Math.sin(t * 3.5) * 0.12);
    }
  });

  const color =
    currentOccupancy.current >= 90
      ? "#ef4444"
      : currentOccupancy.current >= 75
        ? "#f59e0b"
        : "#10b981";

  return (
    <group position={coord}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>

      <mesh
        position={[0, 1.2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {showPredictions && (
        <mesh ref={ghostRef} position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshBasicMaterial
            color="#f97316"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}

      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <ringGeometry args={[0.45, 0.55, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
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

      <Html position={[0, 1.7, 0]} center distanceFactor={15}>
        <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 select-none shadow-[0_0_10px_rgba(0,0,0,0.8)] text-center pointer-events-none flex flex-col items-center whitespace-nowrap min-w-20">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-black text-gray-100 uppercase tracking-wider block">
              {name}
            </span>
            <span className="text-[8.5px] text-blue-400 font-bold" title="Accessibility assisted gate active">♿</span>
          </div>
          <span
            className={`text-[7.5px] font-bold mt-0.5 block ${
              occupancy >= 90
                ? "text-red-400 font-extrabold animate-pulse"
                : occupancy >= 75
                  ? "text-amber-400 font-bold"
                  : "text-emerald-400 font-medium"
            }`}
          >
            {Math.round(occupancy)}%
          </span>
        </div>
      </Html>
    </group>
  );
};

const crowdGeometry = new THREE.SphereGeometry(0.08, 8, 8);
const detourGeometry = new THREE.SphereGeometry(0.11, 8, 8);
const rainGeometry = new THREE.BoxGeometry(0.04, 0.3, 0.04);

const crowdNormalMaterial = new THREE.MeshBasicMaterial({
  color: "#10b981",
  transparent: true,
  opacity: 0.9,
});
const crowdEgressMaterial = new THREE.MeshBasicMaterial({
  color: "#60a5fa",
  transparent: true,
  opacity: 0.9,
});
const detourMaterial = new THREE.MeshBasicMaterial({
  color: "#f59e0b",
  transparent: true,
  opacity: 0.9,
});
const rainMaterial = new THREE.MeshBasicMaterial({
  color: "#60a5fa",
  transparent: true,
  opacity: 0.5,
});

const assetBoxGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
const assetSphereGeometry = new THREE.SphereGeometry(0.13, 8, 8);
const assetWhiteMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff" });

const medicMaterial = new THREE.MeshBasicMaterial({
  color: "#ef4444",
  transparent: true,
  opacity: 0.85,
});
const shuttleMaterial = new THREE.MeshBasicMaterial({
  color: "#a855f7",
  transparent: true,
  opacity: 0.85,
});
const staffMaterial = new THREE.MeshBasicMaterial({
  color: "#3b82f6",
  transparent: true,
  opacity: 0.85,
});

interface ParticleProps {
  path: [number, number, number][];
  color: string;
  speed: number;
  delay: number;
  size: number;
}

export const MovingParticle: React.FC<ParticleProps> = ({
  path,
  color,
  speed,
  delay,
  size,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);

  const curve = useMemo(() => {
    const points = path.map((p) => new THREE.Vector3(...p));
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
      curve.getPointAt(progress.current, pos);
      meshRef.current.position.copy(pos);
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  const geom = size > 0.09 ? detourGeometry : crowdGeometry;
  const mat =
    color === "#f59e0b"
      ? detourMaterial
      : color === "#60a5fa"
        ? crowdEgressMaterial
        : crowdNormalMaterial;

  return <mesh ref={meshRef} visible={false} geometry={geom} material={mat} />;
};

export const Asset3D: React.FC<{ asset: any; dest: [number, number, number] }> = ({
  asset,
  dest,
}) => {
  const ref = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0.4, 0));
  const target = useMemo(() => new THREE.Vector3(...dest), [dest]);

  useFrame(() => {
    if (!ref.current) return;
    target.y = 0.35;
    currentPos.current.lerp(target, 0.08);
    ref.current.position.copy(currentPos.current);
  });

  const matBox =
    asset.type === "medic"
      ? medicMaterial
      : asset.type === "shuttle"
        ? shuttleMaterial
        : staffMaterial;

  return (
    <group ref={ref}>
      <mesh geometry={assetBoxGeometry} material={matBox} />
      <mesh
        position={[0, 0.28, 0]}
        geometry={assetSphereGeometry}
        material={assetWhiteMaterial}
      />
    </group>
  );
};

export const RainDrop: React.FC<{
  start: [number, number, number];
  speed: number;
}> = ({ start, speed }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y -= speed;
    if (ref.current.position.y <= 0) {
      ref.current.position.y = start[1];
    }
  });

  return (
    <mesh
      ref={ref}
      position={start}
      geometry={rainGeometry}
      material={rainMaterial}
    />
  );
};

export const CameraRig: React.FC<{
  activePreset: string;
  controlsRef: React.RefObject<any>;
}> = ({ activePreset, controlsRef }) => {
  const targetPos = useRef(new THREE.Vector3(9, 8, 9));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    if (activePreset === "Gate A") {
      targetPos.current.set(3.5, 7.0, -1.0);
      targetLookAt.current.set(0, 0, -4.5);
    } else if (activePreset === "Gate B") {
      targetPos.current.set(3.0, 7.0, 4.0);
      targetLookAt.current.set(6.5, 0, 0);
    } else if (activePreset === "Gate C") {
      targetPos.current.set(-3.5, 7.0, 1.0);
      targetLookAt.current.set(0, 0, 4.5);
    } else if (activePreset === "Gate D") {
      targetPos.current.set(-3.0, 7.0, -4.0);
      targetLookAt.current.set(-6.5, 0, 0);
    } else {
      targetPos.current.set(9, 8, 9);
      targetLookAt.current.set(0, 0, 0);
    }

    state.camera.position.lerp(targetPos.current, 0.05);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.05);
      controlsRef.current.update();
    }
  });
  return null;
};
