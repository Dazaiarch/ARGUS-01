import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface GLBAsset {
  scene: THREE.Group;
  bounds: THREE.Box3;
  materials: Map<string, THREE.Material>;
  animations: THREE.AnimationClip[];
}

export async function loadComponentModel(url: string): Promise<GLBAsset> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  
  const scene = gltf.scene;
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).castShadow = true;
      (child as THREE.Mesh).receiveShadow = true;
    }
  });
  
  const bounds = new THREE.Box3().setFromObject(scene);
  
  // Normalize to ARGUS coordinate system
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 10) {
    const scale = 1 / maxDim;
    scene.scale.setScalar(scale);
    bounds.setFromObject(scene);
  }
  
  const materials = new Map<string, THREE.Material>();
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat, i) => materials.set(`${mesh.name}_${i}`, mat));
      } else {
        materials.set(mesh.name, mesh.material);
      }
    }
  });
  
  return { scene, bounds, materials, animations: gltf.animations };
}

export function applyARGUSMaterials(
  glbAsset: GLBAsset
): THREE.Group {
  const scene = glbAsset.scene.clone();
  
  const materialSpec = { color: 0x888888, metalness: 0.3, roughness: 0.7 };
  const emissive = new THREE.Color('#000000');
  const emissiveIntensity = 0;
  
  const mat = new THREE.MeshStandardMaterial({
    color: materialSpec.color,
    metalness: materialSpec.metalness,
    roughness: materialSpec.roughness,
    emissive,
    emissiveIntensity,
  });
  
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = mat;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  
  // Compute bounds for explode vector
  const bounds = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  bounds.getCenter(center);
  
  return scene;
}

export function createComponentScene(): THREE.Group {
  // Fallback procedural geometry when no GLB available
  return new THREE.Group();
}

export async function loadAssetLibrary(manifestUrl: string): Promise<Map<string, GLBAsset>> {
  const response = await fetch(manifestUrl);
  const manifest = await response.json();
  
  const assets = new Map<string, GLBAsset>();
  
  for (const [id, url] of Object.entries(manifest)) {
    try {
      const asset = await loadComponentModel(url as string);
      assets.set(id, asset);
    } catch (error) {
      console.warn(`Failed to load asset ${id}:`, error);
    }
  }
  
  return assets;
}