import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Vec3 } from '@/types';
import type { ReactElement } from 'react';

interface Props {
  mode: 'distance' | 'angle' | 'diameter';
  points: Vec3[];
}

export function MeasurementOverlay({ mode, points }: Props) {
  const lines = useMemo(() => {
    if (points.length < 2) return [];

    const segments: ReactElement[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new THREE.Vector3(...points[i]);
      const p2 = new THREE.Vector3(...points[i + 1]);
      const direction = p2.clone().sub(p1);
      const length = direction.length();
      const center = p1.clone().add(p2).multiplyScalar(0.5);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );

      segments.push(
        <group key={`line-${i}`} position={center.toArray()} rotation={new THREE.Euler().setFromQuaternion(quaternion)}>
          <mesh>
            <cylinderGeometry args={[0.008, 0.008, length, 8, 1, true]} />
            <meshBasicMaterial color="#38d1e8" transparent opacity={0.9} />
          </mesh>
        </group>
      );
    }
    return segments;
  }, [points]);

  const pointMarkers = useMemo(() => {
    return points.map((p, i) => (
      <group key={`marker-${i}`} position={p}>
        <mesh>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshBasicMaterial color="#38d1e8" />
        </mesh>
        <Html
          center
          distanceFactor={5}
          position={[0, 0.04, 0]}
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
        >
          <div className="mono text-[9px] text-cyan bg-obsidian/80 px-1 py-0.5 rounded-sm border border-cyan/30">
            P{i + 1}
          </div>
        </Html>
      </group>
    ));
  }, [points]);

  const measurementLabel = useMemo(() => {
    if (mode === 'distance' && points.length >= 2) {
      const p1 = new THREE.Vector3(...points[0]);
      const p2 = new THREE.Vector3(...points[1]);
      const dist = p1.distanceTo(p2);
      const mid = p1.clone().lerp(p2, 0.5);
      return (
        <Html
          center
          distanceFactor={5}
          position={[mid.x, mid.y + 0.06, mid.z]}
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
        >
          <div className="mono text-[10px] text-cyan bg-obsidian/90 px-1.5 py-0.5 rounded-sm border border-cyan/30 shadow">
            {dist.toFixed(4)} m
          </div>
        </Html>
      );
    }
    if (mode === 'angle' && points.length >= 3) {
      const p1 = new THREE.Vector3(...points[0]);
      const p2 = new THREE.Vector3(...points[1]);
      const p3 = new THREE.Vector3(...points[2]);
      const v1 = p1.clone().sub(p2).normalize();
      const v2 = p3.clone().sub(p2).normalize();
      const angle = Math.acos(Math.max(-1, Math.min(1, v1.dot(v2)))) * (180 / Math.PI);
      return (
        <Html
          center
          distanceFactor={5}
          position={[p2.x, p2.y + 0.06, p2.z]}
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
        >
          <div className="mono text-[10px] text-cyan bg-obsidian/90 px-1.5 py-0.5 rounded-sm border border-cyan/30 shadow">
            {angle.toFixed(1)}°
          </div>
        </Html>
      );
    }
    if (mode === 'diameter' && points.length >= 2) {
      const p1 = new THREE.Vector3(...points[0]);
      const p2 = new THREE.Vector3(...points[1]);
      const diameter = p1.distanceTo(p2) * 2;
      const mid = p1.clone().lerp(p2, 0.5);
      return (
        <Html
          center
          distanceFactor={5}
          position={[mid.x, mid.y + 0.06, mid.z]}
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
        >
          <div className="mono text-[10px] text-cyan bg-obsidian/90 px-1.5 py-0.5 rounded-sm border border-cyan/30 shadow">
            Ø {diameter.toFixed(4)} m
          </div>
        </Html>
      );
    }
    return null;
  }, [mode, points]);

  return (
    <group>
      {lines}
      {pointMarkers}
      {measurementLabel}
    </group>
  );
}