import type { RecognizedGesture } from '@/types';
import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import * as THREE from 'three';

export class CommandMapper {
  private assemblyStore = useAssemblyStore;
  private viewStore = useViewStore;
  private raycaster: THREE.Raycaster;
  private camera: THREE.Camera | null = null;
  private scene: THREE.Scene | null = null;
  private viewportRect: DOMRect | null = null;

  constructor() {
    this.raycaster = new THREE.Raycaster();
  }

  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  setViewportRect(rect: DOMRect): void {
    this.viewportRect = rect;
  }

  mapGesture(gesture: RecognizedGesture): void {
    if (this.isInCooldown(gesture.type)) return;
    this.setCooldown(gesture.type);

    switch (gesture.type) {
      case 'open-palm':
        this.viewStore.getState().setGestureInteraction(true);
        break;

      case 'pinch':
        if (gesture.data.pinchDistance !== undefined) {
          const component = this.raycastFromHand(gesture);
          if (component) {
            this.assemblyStore.getState().select(component.id);
          }
        }
        break;

      case 'two-hand-zoom':
        if (gesture.data.twoHandDistanceDelta !== undefined) {
          const factor = gesture.data.twoHandDistanceDelta > 0 ? 1.1 : 0.9;
          this.viewStore.getState().adjustCameraDistance(factor);
        }
        break;

      case 'two-hand-rotate':
        if (gesture.data.twoHandAngleDelta !== undefined) {
          this.viewStore.getState().orbitCamera(gesture.data.twoHandAngleDelta);
        }
        break;

      case 'swipe-left':
        this.viewStore.getState().orbitCamera(0.3);
        break;

      case 'swipe-right':
        this.viewStore.getState().orbitCamera(-0.3);
        break;

      case 'fist':
        this.viewStore.getState().setGestureInteraction(false);
        break;

      case 'three-fingers':
        this.viewStore.getState().setInspectionMode(true);
        break;

      case 'open-palm-held':
        this.assemblyStore.getState().select(null);
        break;
    }
  }

  private raycastFromHand(gesture: RecognizedGesture): { id: string } | null {
    if (!this.camera || !this.scene || !this.viewportRect) return null;

    // Convert hand landmark to normalized device coordinates
    const ndc = this.handToNDC(gesture);
    this.raycaster.setFromCamera(ndc, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    // Find the first object with a componentId
    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj && !obj.userData.componentId) {
        obj = obj.parent;
      }
      if (obj?.userData?.componentId) {
        return { id: obj.userData.componentId };
      }
    }
    return null;
  }

  private handToNDC(_gesture: RecognizedGesture): THREE.Vector2 {
    // This requires calibration mapping from webcam space to viewport space
    // For now, use a simple heuristic
    // const landmarks = gesture.data.pinchDistance !== undefined ? [] : [];
    // This would need proper calibration
    return new THREE.Vector2(0, 0);
  }

  private cooldowns = new Map<string, number>();

  private isInCooldown(type: string): boolean {
    const lastTime = this.cooldowns.get(type) || 0;
    if (Date.now() - lastTime < 200) return true;
    this.cooldowns.set(type, Date.now());
    return false;
  }

  private setCooldown(type: string): void {
    this.cooldowns.set(type, Date.now());
  }
}