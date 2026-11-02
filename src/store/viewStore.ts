import { create } from 'zustand';
import type { SectionId, TransformMode, ViewPreset, Vec3, ClippingPlane } from '@/types';

interface ViewState {
  viewPreset: ViewPreset;
  viewNonce: number;
  transformMode: TransformMode;
  snap: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  lightIntensity: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  navCollapsed: boolean;
  scaleWarning: string | null;

  // Phase B: Isolation
  isolatedId: string | null;
  isolatedAncestors: string[];
  isolate: (id: string, components: { id: string; parentId: string | null }[]) => void;
  clearIsolation: () => void;

  // Phase B: Animated Explode
  explodeTarget: number;
  explodeAnimating: boolean;
  animateExplode: (target: number, durationMs?: number) => void;

  // Phase B: Measurement
  measurementMode: 'none' | 'distance' | 'angle' | 'diameter';
  setMeasurementMode: (mode: ViewState['measurementMode']) => void;
  measurementPoints: Vec3[];
  addMeasurementPoint: (point: Vec3) => void;
  clearMeasurementPoints: () => void;

  // Phase B: Clipping Planes
  clippingPlanes: ClippingPlane[];
  addClippingPlane: (plane: ClippingPlane) => void;
  updateClippingPlane: (index: number, patch: Partial<ClippingPlane>) => void;
  removeClippingPlane: (index: number) => void;

  // Phase B: Wireframe/X-ray
  wireframeMode: boolean;
  xrayMode: boolean;
  setWireframeMode: (enabled: boolean) => void;
  setXrayMode: (enabled: boolean) => void;

  // Phase B: Component Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Phase D: Gesture
  gestureInteraction: boolean;
  inspectionMode: boolean;
  setGestureInteraction: (enabled: boolean) => void;
  setInspectionMode: (enabled: boolean) => void;
  adjustCameraDistance: (factor: number) => void;
  orbitCamera: (delta: number) => void;

  // Existing actions
  setViewPreset: (v: ViewPreset) => void;
  resetCamera: () => void;
  setTransformMode: (m: TransformMode) => void;
  toggle: (
    key: 'snap' | 'showGrid' | 'showAxes' | 'showLabels' | 'leftCollapsed' | 'rightCollapsed' | 'navCollapsed',
  ) => void;
  setLightIntensity: (v: number) => void;
  setScaleWarning: (msg: string | null) => void;
}

function getAncestors(componentId: string, components: { id: string; parentId: string | null }[]): string[] {
  const ancestors: string[] = [];
  const comp = components.find((c) => c.id === componentId);
  if (!comp || !comp.parentId) return ancestors;
  let current: string | null = comp.parentId;
  while (current) {
    ancestors.push(current);
    const parent = components.find((c) => c.id === current);
    current = parent?.parentId ?? null;
  }
  return ancestors;
}

export const useViewStore = create<ViewState>((set, get) => ({
  viewPreset: 'isometric',
  viewNonce: 0,
  transformMode: 'translate',
  snap: false,
  showGrid: true,
  showAxes: true,
  showLabels: false,
  lightIntensity: 1,
  leftCollapsed: false,
  rightCollapsed: false,
  navCollapsed: false,
  scaleWarning: null,

  // Phase B: Isolation
  isolatedId: null,
  isolatedAncestors: [],
  isolate: (id, components) => {
    const ancestors = getAncestors(id, components);
    set({ isolatedId: id, isolatedAncestors: ancestors });
  },
  clearIsolation: () => set({ isolatedId: null, isolatedAncestors: [] }),

  // Phase B: Animated Explode
  explodeTarget: 0,
  explodeAnimating: false,
  animateExplode: (target, durationMs = 800) => {
    const start = get().explodeTarget;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = start + (target - start) * eased;

      set({ explodeTarget: current });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        set({ explodeAnimating: false });
      }
    };

    set({ explodeAnimating: true });
    animate();
  },

  // Phase B: Measurement
  measurementMode: 'none',
  setMeasurementMode: (mode) => set({ measurementMode: mode, measurementPoints: [] }),
  measurementPoints: [],
  addMeasurementPoint: (point) =>
    set((s) => ({ measurementPoints: [...s.measurementPoints, point] })),
  clearMeasurementPoints: () => set({ measurementPoints: [] }),

  // Phase B: Clipping Planes
  clippingPlanes: [],
  addClippingPlane: (plane) =>
    set((s) => ({ clippingPlanes: [...s.clippingPlanes, plane] })),
  updateClippingPlane: (index, patch) =>
    set((s) => ({
      clippingPlanes: s.clippingPlanes.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    })),
  removeClippingPlane: (index) =>
    set((s) => ({ clippingPlanes: s.clippingPlanes.filter((_, i) => i !== index) })),

  // Phase B: Wireframe/X-ray
  wireframeMode: false,
  xrayMode: false,
  setWireframeMode: (enabled) => set({ wireframeMode: enabled, xrayMode: enabled ? false : get().xrayMode }),
  setXrayMode: (enabled) => set({ xrayMode: enabled, wireframeMode: enabled ? false : get().wireframeMode }),

  // Phase D: Gesture
  gestureInteraction: false,
  inspectionMode: false,
  setGestureInteraction: (enabled) => set({ gestureInteraction: enabled }),
  setInspectionMode: (enabled) => set({ inspectionMode: enabled }),
  adjustCameraDistance: (factor) => {
    console.log('adjustCameraDistance', factor);
  },
  orbitCamera: (delta) => {
    console.log('orbitCamera', delta);
  },

  // Phase B: Component Search
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  // Existing actions
  setViewPreset: (viewPreset) => set((s) => ({ viewPreset, viewNonce: s.viewNonce + 1 })),
  resetCamera: () => set((s) => ({ viewPreset: 'isometric', viewNonce: s.viewNonce + 1 })),
  setTransformMode: (transformMode) => set({ transformMode }),
  toggle: (key) =>
    set((s) => ({ [key]: !s[key] }) as Partial<ViewState>),
  setLightIntensity: (lightIntensity) => set({ lightIntensity }),
  setScaleWarning: (scaleWarning) => set({ scaleWarning }),
}));

export type { SectionId };