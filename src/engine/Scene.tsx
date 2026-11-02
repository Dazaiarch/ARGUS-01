import { useCallback, useEffect, useRef, useState } from 'react';
import { Environment, Grid, Lightformer, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import { ComponentNode } from './ComponentNode';
import { CameraRig } from './CameraRig';
import { SelectionBox } from './SelectionBox';
import { MeasurementOverlay } from './MeasurementOverlay';
import { ClippingPlaneGizmo } from './ClippingPlaneGizmo';

const DEG15 = THREE.MathUtils.degToRad(15);

export function Scene() {
  const components = useAssemblyStore((s) => s.components);
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const explode = useAssemblyStore((s) => s.explode);
  const setExplode = useAssemblyStore((s) => s.setExplode);
  const select = useAssemblyStore((s) => s.select);
  const computeWorldTransforms = useAssemblyStore((s) => s.computeWorldTransforms);

  const mode = useViewStore((s) => s.transformMode);
  const snap = useViewStore((s) => s.snap);
  const showGrid = useViewStore((s) => s.showGrid);
  const showAxes = useViewStore((s) => s.showAxes);
  const showLabels = useViewStore((s) => s.showLabels);
  const light = useViewStore((s) => s.lightIntensity);
  const setScaleWarning = useViewStore((s) => s.setScaleWarning);

  // Phase B: Isolation
  const isolatedId = useViewStore((s) => s.isolatedId);
  const isolatedAncestors = useViewStore((s) => s.isolatedAncestors);

  // Phase B: Animated Explode
  const explodeTarget = useViewStore((s) => s.explodeTarget);
  const explodeAnimating = useViewStore((s) => s.explodeAnimating);

  // Phase B: Measurement
  const measurementMode = useViewStore((s) => s.measurementMode);
  const measurementPoints = useViewStore((s) => s.measurementPoints);

  // Phase B: Clipping Planes
  const clippingPlanes = useViewStore((s) => s.clippingPlanes);

  // Phase B: Wireframe/X-ray
  const wireframeMode = useViewStore.getState().wireframeMode;
  const xrayMode = useViewStore.getState().xrayMode;

  const refs = useRef<Record<string, THREE.Group | null>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const snapshot = useRef<ReturnType<typeof useAssemblyStore.getState>['components'] | null>(null);

  const worldTransforms = computeWorldTransforms();

  const registerRef = useCallback((id: string, g: THREE.Group | null) => {
    refs.current[id] = g;
  }, []);

  const selected = components.find((c) => c.id === selectedId) ?? null;
  const selectedObj = selected && selected.visible ? (refs.current[selected.id] ?? null) : null;

  const scaleBlocked = !!selected && mode === 'scale' && selected.scaleConstrained;
  const gizmoEnabled = !!selectedObj && !selected!.locked && explode < 0.001 && !scaleBlocked;

  useEffect(() => {
    if (scaleBlocked) {
      setScaleWarning(
        `${selected!.name} is mechanically constrained (${selected!.type}). Scaling is disabled — change its dimensions in the properties panel instead.`,
      );
    } else {
      setScaleWarning(null);
    }
  }, [scaleBlocked, selected, setScaleWarning]);

  // Phase B: Animate explode
  useEffect(() => {
    if (explodeAnimating) return;
    if (Math.abs(explode - explodeTarget) > 0.001) {
      setExplode(explodeTarget);
    }
  }, [explodeTarget, explodeAnimating, explode, setExplode]);

  const onGizmoDown = () => {
    snapshot.current = useAssemblyStore.getState().components;
  };

  const onGizmoUp = () => {
    if (!selected) return;
    const g = refs.current[selected.id];
    if (!g) return;
    const store = useAssemblyStore.getState();
    const world = store.getWorldTransform(selected.id);
    if (world) {
      store.patchLive(selected.id, {
        position: world.position,
        rotation: world.rotation,
        scale: world.scale,
      });
    }
    if (snapshot.current) store.checkpoint(snapshot.current);
    snapshot.current = null;
  };

  // Phase B: Filter components for isolation
  const visibleComponents = isolatedId
    ? components.filter((c) => c.id === isolatedId || isolatedAncestors.includes(c.id) || c.parentId === isolatedId)
    : components;

  // Phase B: Convert clipping planes to THREE.Plane[]
  const threeClippingPlanes = clippingPlanes
    .filter((p) => p.enabled)
    .map((p) => new THREE.Plane(new THREE.Vector3(...p.normal), p.constant));

  return (
    <>
      <CameraRig />

      <hemisphereLight args={['#c9d6ea', '#15181d', 0.5 * light]} />
      <directionalLight position={[4, 6, 3]} intensity={1.6 * light} castShadow />
      <directionalLight position={[-4, 3, -3]} intensity={0.5 * light} color="#8fb4ff" />
      <Environment resolution={128} environmentIntensity={0.35 * light}>
        <Lightformer form="rect" intensity={2} position={[0, 5, 0]} scale={[8, 8, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 2, 3]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[5, 1, -3]} scale={[6, 2, 1]} />
      </Environment>

      {showGrid && (
        <Grid
          position={[0, -0.095, 0]}
          args={[20, 20]}
          cellSize={0.1}
          cellThickness={0.5}
          cellColor="#1f2630"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#2f4c57"
          fadeDistance={12}
          fadeStrength={1.5}
          infiniteGrid
        />
      )}
      {showAxes && <axesHelper args={[0.6]} position={[-1.35, -0.09, 0.45]} />}

      {visibleComponents.map((c) =>
        c.visible ? (
          <ComponentNode
            key={c.id}
            component={c}
            worldTransform={worldTransforms.get(c.id) ?? { position: c.position, rotation: c.rotation, scale: c.scale }}
            selected={c.id === selectedId}
            hovered={c.id === hovered}
            explode={explode}
            showLabel={showLabels}
            registerRef={registerRef}
            onSelect={select}
            onHover={setHovered}
            wireframe={wireframeMode}
            xray={xrayMode}
            clippingPlanes={threeClippingPlanes}
            dimmed={Boolean(isolatedId && c.id !== isolatedId && !isolatedAncestors.includes(c.id) && c.parentId !== isolatedId)}
          />
        ) : null,
      )}

      <SelectionBox target={selectedObj} color="#38d1e8" />

      {gizmoEnabled && selectedObj && (
        <TransformControls
          object={selectedObj}
          mode={mode}
          size={0.8}
          translationSnap={snap ? 0.05 : null}
          rotationSnap={snap ? DEG15 : null}
          scaleSnap={snap ? 0.1 : null}
          onMouseDown={onGizmoDown}
          onMouseUp={onGizmoUp}
        />
      )}

      {/* Phase B: Measurement Overlay */}
      {measurementMode !== 'none' && (
        <MeasurementOverlay
          mode={measurementMode}
          points={measurementPoints}
        />
      )}

      {/* Phase B: Clipping Plane Gizmos */}
      {clippingPlanes.map((plane, index) =>
        plane.enabled ? (
          <ClippingPlaneGizmo
            key={index}
            plane={plane}
            index={index}
            onRemove={() => useViewStore.getState().removeClippingPlane(index)}
          />
        ) : null
      )}
    </>
  );
}
