import { useEffect, useRef } from 'react';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { ViewPreset } from '@/types';
import { useViewStore } from '@/store/viewStore';

export const TARGET = new THREE.Vector3(0, 0.25, 0);

const VIEW_POSITIONS: Record<ViewPreset, [number, number, number]> = {
  perspective: [2.2, 1.4, 2.6],
  orthographic: [2.2, 1.6, 2.6],
  front: [0, TARGET.y, 6],
  side: [6, TARGET.y, 0],
  top: [0, 6, 0.001],
  isometric: [3.4, 2.6, 3.4],
};

const USES_ORTHO: ViewPreset[] = ['orthographic', 'front', 'side', 'top'];

export function CameraRig() {
  const preset = useViewStore((s) => s.viewPreset);
  const nonce = useViewStore((s) => s.viewNonce);
  const camera = useThree((s) => s.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const ortho = USES_ORTHO.includes(preset);

  useEffect(() => {
    const [x, y, z] = VIEW_POSITIONS[preset];
    camera.position.set(x, y, z);
    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const oc = camera as THREE.OrthographicCamera;
      oc.zoom = 230;
      oc.near = -50;
      oc.far = 100;
      oc.updateProjectionMatrix();
    }
    const ctl = controls.current;
    if (ctl) {
      ctl.target.copy(TARGET);
      ctl.update();
    } else {
      camera.lookAt(TARGET);
    }
  }, [preset, nonce, camera]);

  return (
    <>
      {ortho ? (
        <OrthographicCamera makeDefault position={VIEW_POSITIONS[preset]} zoom={230} near={-50} far={100} />
      ) : (
        <PerspectiveCamera makeDefault position={VIEW_POSITIONS[preset]} fov={40} near={0.05} far={100} />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.12}
        minDistance={0.4}
        maxDistance={20}
        target={TARGET}
      />
    </>
  );
}
