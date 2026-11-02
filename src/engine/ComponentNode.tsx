import { memo, useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { MachineComponent, WorldTransform } from '@/types';
import { MATERIALS, STATUS_COLORS } from '@/machinery/materials';
import { ComponentGeometry } from '@/machinery/geometry';

interface Props {
  component: MachineComponent;
  worldTransform: WorldTransform;
  selected: boolean;
  hovered: boolean;
  explode: number;
  showLabel: boolean;
  registerRef: (id: string, g: THREE.Group | null) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  wireframe?: boolean;
  xray?: boolean;
  clippingPlanes?: THREE.Plane[];
  dimmed?: boolean;
}

function ComponentNodeImpl({
  component: c,
  worldTransform,
  selected,
  hovered,
  explode,
  showLabel,
  registerRef,
  onSelect,
  onHover,
  wireframe = false,
  xray = false,
  clippingPlanes = [],
  dimmed = false,
}: Props) {
  const spec = MATERIALS[c.material];
  const statusColor = STATUS_COLORS[c.status];
  const flagged = c.status === 'warning' || c.status === 'fault';

  const emissive = useMemo(() => {
    if (flagged) return new THREE.Color(statusColor);
    if (selected) return new THREE.Color('#38d1e8');
    if (hovered) return new THREE.Color('#4f7cc4');
    return new THREE.Color('#000000');
  }, [flagged, selected, hovered, statusColor]);
  const emissiveIntensity = flagged ? 0.45 : selected ? 0.22 : hovered ? 0.25 : 0;

  // Phase B: Wireframe material
  const wireframeMat = useMemo(() => (
    <meshStandardMaterial
      color={spec.color}
      metalness={spec.metalness}
      roughness={spec.roughness}
      wireframe={true}
      transparent={xray}
      opacity={xray ? 0.15 : 1}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      clippingPlanes={clippingPlanes}
    />
  ), [spec.color, spec.metalness, spec.roughness, emissive, emissiveIntensity, xray, clippingPlanes]);

  // Phase B: X-ray material (transparent)
  const xrayMat = useMemo(() => (
    <meshStandardMaterial
      color={spec.color}
      metalness={spec.metalness * 0.5}
      roughness={Math.min(spec.roughness + 0.3, 1)}
      transparent={true}
      opacity={0.12}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      clippingPlanes={clippingPlanes}
    />
  ), [spec.color, spec.metalness, spec.roughness, emissive, emissiveIntensity, clippingPlanes]);

  // Phase B: Solid material with clipping
  const solidMat = useMemo(() => (
    <meshStandardMaterial
      color={spec.color}
      metalness={spec.metalness}
      roughness={spec.roughness}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      clippingPlanes={clippingPlanes}
    />
  ), [spec.color, spec.metalness, spec.roughness, emissive, emissiveIntensity, clippingPlanes]);

  const darkMat = useMemo(() => (
    <meshStandardMaterial
      color="#1a1e24"
      metalness={0.5}
      roughness={0.6}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity * 0.6}
      clippingPlanes={clippingPlanes}
    />
  ), [emissive, emissiveIntensity, clippingPlanes]);

  // Phase B: Dimmed material for non-isolated components
  const dimmedMat = useMemo(() => (
    <meshStandardMaterial
      color={spec.color}
      metalness={spec.metalness * 0.3}
      roughness={Math.min(spec.roughness + 0.2, 1)}
      transparent={true}
      opacity={0.25}
      emissive={new THREE.Color('#000000')}
      emissiveIntensity={0}
      clippingPlanes={clippingPlanes}
    />
  ), [spec.color, spec.metalness, spec.roughness, clippingPlanes]);

  const pos: [number, number, number] = [
    worldTransform.position[0] + c.explodeVector[0] * explode,
    worldTransform.position[1] + c.explodeVector[1] * explode,
    worldTransform.position[2] + c.explodeVector[2] * explode,
  ];

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(c.id);
  };

  // Phase B: Choose material based on mode
  const material = dimmed
    ? dimmedMat
    : wireframe
    ? wireframeMat
    : xray
    ? xrayMat
    : solidMat;

  return (
    <group
      ref={(g) => registerRef(c.id, g)}
      position={pos}
      rotation={worldTransform.rotation}
      scale={worldTransform.scale}
      userData={{ componentId: c.id }}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(c.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <ComponentGeometry c={c} mat={material} darkMat={darkMat} />
      {showLabel && (
        <Html center distanceFactor={4} position={[0, 0.25, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={`mono whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] ${
              dimmed ? 'border-line bg-obsidian/50 text-ink-faint' : 'border-line bg-obsidian/80 text-ink-dim'
            }`}
          >
            {c.id}
          </div>
        </Html>
      )}
    </group>
  );
}

export const ComponentNode = memo(ComponentNodeImpl);