import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ClippingPlane } from '@/types';

interface Props {
  plane: ClippingPlane;
  index: number;
  onRemove: () => void;
}

const PLANE_SIZE = 10;
const PLANE_THICKNESS = 0.02;
const HANDLE_SIZE = 0.3;

export function ClippingPlaneGizmo({ plane, index, onRemove }: Props) {
  const ref = useRef<THREE.Group>(null);
  const normal = new THREE.Vector3(...plane.normal);
  const constant = plane.constant;

  // Position the plane at the correct location
  const position = normal.clone().multiplyScalar(-constant);

  // Create rotation to align plane with normal
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.clone().normalize());

  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(position);
      ref.current.quaternion.copy(quaternion);
    }
  });

  const planeColor = plane.color || '#38d1e8';

  return (
    <group ref={ref} position={position} rotation={new THREE.Euler().setFromQuaternion(quaternion)}>
      {/* Semi-transparent plane grid */}
      <Box
        args={[PLANE_SIZE, PLANE_THICKNESS, PLANE_SIZE]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={planeColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        <meshBasicMaterial
          color={planeColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          wireframe
        />
      </Box>

      {/* Center handle - move plane along normal */}
      <group position={[0, PLANE_THICKNESS / 2 + HANDLE_SIZE / 2, 0]}>
        <mesh
          onPointerDown={(e) => {
            e.stopPropagation();
            // Drag to move plane
          }}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <sphereGeometry args={[HANDLE_SIZE, 16, 16]} />
          <meshBasicMaterial color={planeColor} />
        </mesh>
        <Html
          center
          distanceFactor={8}
          position={[0, HANDLE_SIZE + 0.1, 0]}
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
        >
          <div className="mono text-[9px] text-cyan bg-obsidian/90 px-1 py-0.5 rounded-sm border border-cyan/30">
            Plane {index + 1}
          </div>
        </Html>
      </group>

      {/* Corner handles for rotation */}
      {[
        [-PLANE_SIZE / 2, -PLANE_SIZE / 2],
        [PLANE_SIZE / 2, -PLANE_SIZE / 2],
        [-PLANE_SIZE / 2, PLANE_SIZE / 2],
        [PLANE_SIZE / 2, PLANE_SIZE / 2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, PLANE_THICKNESS / 2 + HANDLE_SIZE / 2, z]}>
          <mesh>
            <boxGeometry args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]} />
            <meshBasicMaterial color={planeColor} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Remove button */}
      <Html
        center
        distanceFactor={8}
        position={[PLANE_SIZE / 2 + 0.5, PLANE_THICKNESS / 2 + 0.5, PLANE_SIZE / 2 + 0.5]}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          className="mono text-[9px] text-fault bg-obsidian/90 px-1.5 py-0.5 rounded-sm border border-fault/30 hover:bg-fault/20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ✕ Remove
        </button>
      </Html>
    </group>
  );
}