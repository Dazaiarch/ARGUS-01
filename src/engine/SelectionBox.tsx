import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** World-space bounding box that follows the selected component. */
export function SelectionBox({ target, color }: { target: THREE.Object3D | null; color: string }) {
  const helper = useMemo(() => {
    const h = new THREE.BoxHelper(new THREE.Object3D(), color);
    (h.material as THREE.LineBasicMaterial).depthTest = false;
    h.renderOrder = 999;
    return h;
  }, [color]);

  useEffect(() => () => helper.dispose(), [helper]);

  useFrame(() => {
    if (target) {
      helper.setFromObject(target);
      helper.visible = true;
    } else {
      helper.visible = false;
    }
  });

  return <primitive object={helper} />;
}
