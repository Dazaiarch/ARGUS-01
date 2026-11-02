import { useMemo } from 'react';
import * as THREE from 'three';
import type { MachineComponent } from '@/types';

/**
 * Procedural, PROVISIONAL geometry for the ARGUS rig. Shapes are recognisable
 * stand-ins, not engineering-accurate CAD. All shaft-axis parts are built along +X.
 */

type MatProps = { mat: React.ReactNode };

const X_AXIS_ROT: [number, number, number] = [0, 0, Math.PI / 2];

function Cyl({
  radius,
  length,
  position = [0, 0, 0],
  mat,
  segments = 40,
}: {
  radius: number;
  length: number;
  position?: [number, number, number];
} & MatProps & { segments?: number }) {
  return (
    <mesh position={position} rotation={X_AXIS_ROT} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, segments]} />
      {mat}
    </mesh>
  );
}

function Box({
  size,
  position = [0, 0, 0],
  mat,
}: {
  size: [number, number, number];
  position?: [number, number, number];
} & MatProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      {mat}
    </mesh>
  );
}

function BearingGeometry({ radius, length, mat }: { radius: number; length: number } & MatProps) {
  const ri = 0.025;
  const t = (radius - ri) * 0.28;
  const half = length / 2;

  const ringGeo = (inner: number, outer: number) => {
    const pts = [
      new THREE.Vector2(inner, -half),
      new THREE.Vector2(outer, -half),
      new THREE.Vector2(outer, half),
      new THREE.Vector2(inner, half),
      new THREE.Vector2(inner, -half),
    ];
    return new THREE.LatheGeometry(pts, 48);
  };

  const outer = useMemo(() => ringGeo(radius - t, radius), [radius, t, half]); // eslint-disable-line react-hooks/exhaustive-deps
  const inner = useMemo(() => ringGeo(ri, ri + t), [t, half]); // eslint-disable-line react-hooks/exhaustive-deps
  const balls = useMemo(() => {
    const n = 10;
    const pr = (radius - t + ri + t) / 2;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [0, Math.cos(a) * pr, Math.sin(a) * pr] as [number, number, number];
    });
  }, [radius, t]);
  const ballR = Math.max(0.004, (radius - t - (ri + t)) / 2);

  return (
    <group>
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh geometry={outer} castShadow>
          {mat}
        </mesh>
        <mesh geometry={inner} castShadow>
          {mat}
        </mesh>
      </group>
      {balls.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[ballR, 12, 12]} />
          {mat}
        </mesh>
      ))}
    </group>
  );
}

export function ComponentGeometry({
  c,
  mat,
  darkMat,
}: {
  c: MachineComponent;
  mat: React.ReactNode;
  darkMat: React.ReactNode;
}) {
  const d = c.dimensions;
  switch (c.type) {
    case 'base-frame': {
      const w = d.width ?? 2.4;
      const h = d.height ?? 0.08;
      const dp = d.depth ?? 0.7;
      return (
        <group>
          <Box size={[w, h, dp]} position={[0, 0, 0]} mat={mat} />
          {[-1, 1].map((sz) =>
            [-1, 1].map((sx) => (
              <Box
                key={`${sx}${sz}`}
                size={[0.08, 0.06, 0.08]}
                position={[sx * (w / 2 - 0.08), -h / 2 - 0.03, sz * (dp / 2 - 0.08)]}
                mat={darkMat}
              />
            )),
          )}
        </group>
      );
    }
    case 'mounting-plate':
      return <Box size={[d.width ?? 0.6, d.height ?? 0.03, d.depth ?? 0.5]} mat={mat} />;
    case 'motor': {
      const L = d.length ?? 0.5;
      const R = d.radius ?? 0.16;
      return (
        <group>
          <Cyl radius={R} length={L} mat={mat} />
          <Cyl radius={R * 0.92} length={0.04} position={[L / 2 + 0.02, 0, 0]} mat={darkMat} />
          <Cyl radius={R * 0.8} length={0.12} position={[-L / 2 - 0.06, 0, 0]} mat={darkMat} />
          <Box size={[L * 0.8, 0.05, R * 2 * 0.9]} position={[0, -R - 0.025, 0]} mat={mat} />
          <Box size={[0.1, 0.06, 0.1]} position={[0, R + 0.03, 0]} mat={darkMat} />
          {Array.from({ length: 8 }, (_, i) => (
            <Box
              key={i}
              size={[L * 0.7, 0.012, 0.012]}
              position={[0, Math.cos((i / 8) * Math.PI * 2) * (R + 0.004), Math.sin((i / 8) * Math.PI * 2) * (R + 0.004)]}
              mat={darkMat}
            />
          ))}
        </group>
      );
    }
    case 'shaft': {
      const L = d.length ?? 1.7;
      const R = d.radius ?? 0.025;
      return (
        <group>
          <Cyl radius={R} length={L} mat={mat} segments={32} />
          {/* Flat marker strip so rotation is visible in the digital twin */}
          <Box size={[L * 0.9, R * 0.25, R * 0.25]} position={[0, R, 0]} mat={darkMat} />
        </group>
      );
    }
    case 'coupling': {
      const L = d.length ?? 0.14;
      const R = d.radius ?? 0.055;
      return (
        <group>
          <Cyl radius={R} length={L * 0.38} position={[-L * 0.31, 0, 0]} mat={mat} />
          <Cyl radius={R} length={L * 0.38} position={[L * 0.31, 0, 0]} mat={mat} />
          <Cyl radius={R * 0.82} length={L * 0.24} mat={darkMat} />
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <Cyl
                key={i}
                radius={0.006}
                length={L * 0.9}
                position={[0, Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7]}
                mat={mat}
                segments={10}
              />
            );
          })}
        </group>
      );
    }
    case 'bearing-housing': {
      const w = d.width ?? 0.14;
      const h = d.height ?? 0.22;
      const dp = d.depth ?? 0.2;
      // Origin is the housing's centre; shaft axis sits 0.13 above it (provisional).
      return (
        <group>
          <Box size={[w, 0.1, dp]} position={[0, -h / 2 + 0.05, 0]} mat={mat} />
          <Box size={[w, h * 0.6, dp * 0.5]} position={[0, 0.035, 0]} mat={mat} />
          <Cyl radius={0.09} length={w} position={[0, h / 2 + 0.02, 0]} mat={mat} />
          <Cyl radius={0.058} length={w + 0.012} position={[0, h / 2 + 0.02, 0]} mat={darkMat} />
        </group>
      );
    }
    case 'bearing':
      return <BearingGeometry radius={d.radius ?? 0.052} length={d.length ?? 0.05} mat={mat} />;
    case 'load-disc': {
      const R = d.radius ?? 0.2;
      const L = d.length ?? 0.04;
      return (
        <group>
          <Cyl radius={R} length={L} mat={mat} segments={64} />
          <Cyl radius={R * 0.28} length={L * 2.2} mat={darkMat} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <Cyl
                key={i}
                radius={0.01}
                length={L * 1.4}
                position={[0, Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82]}
                mat={darkMat}
                segments={12}
              />
            );
          })}
        </group>
      );
    }
    case 'sensor-mount': {
      const w = d.width ?? 0.04;
      const h = d.height ?? 0.02;
      const dp = d.depth ?? 0.04;
      return (
        <group>
          <Box size={[w, h, dp]} mat={mat} />
          <mesh position={[0, h / 2 + 0.008, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.016, 12]} />
            {darkMat}
          </mesh>
        </group>
      );
    }
    default:
      return <Box size={[0.1, 0.1, 0.1]} mat={mat} />;
  }
}
