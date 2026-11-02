import { create } from 'zustand';
import type { Vec3 } from '@/types';
import type { SensorType } from '@/sensors/sensorDefinitions';

interface SensorPlacementState {
  active: boolean;
  sensorType: SensorType | null;
  ghostPosition: Vec3 | null;
  ghostRotation: Vec3 | null;
  targetComponentId: string | null;
  previewVisible: boolean;

  setSensorType: (type: SensorType | null) => void;
  startPlacement: () => void;
  cancelPlacement: () => void;
  confirmPlacement: () => void;
  updateGhost: (position: Vec3, rotation: Vec3, componentId: string, visible: boolean) => void;
}

export const useSensorPlacement = create<SensorPlacementState>((set, get) => ({
  active: false,
  sensorType: null,
  ghostPosition: null,
  ghostRotation: null,
  targetComponentId: null,
  previewVisible: false,

  setSensorType: (type) => set({ sensorType: type }),

  startPlacement: () => {
    const { sensorType } = get();
    if (!sensorType) return;
    import('@/store/assemblyStore').then(({ useAssemblyStore }) => {
      const selectedId = useAssemblyStore.getState().selectedId;
      if (!selectedId) return;

      set({
        active: true,
        targetComponentId: selectedId,
        ghostPosition: [0, 0, 0],
        ghostRotation: [0, 0, 0],
        previewVisible: false,
      });
    });
  },

  cancelPlacement: () => {
    set({
      active: false,
      ghostPosition: null,
      ghostRotation: null,
      targetComponentId: null,
      previewVisible: false,
    });
  },

  confirmPlacement: async () => {
    const { active, sensorType, ghostPosition, ghostRotation, targetComponentId } = get();
    if (!active || !sensorType || !ghostPosition || !targetComponentId) return;

    const { useAssemblyStore } = await import('@/store/assemblyStore');
    const addSensor = useAssemblyStore.getState().addSensor;
    addSensor(sensorType, targetComponentId, ghostPosition, ghostRotation || [0, 0, 0]);

    set({
      active: false,
      ghostPosition: null,
      ghostRotation: null,
      targetComponentId: null,
      previewVisible: false,
    });
  },

  updateGhost: (position, rotation, componentId, visible) => {
    set({
      ghostPosition: position,
      ghostRotation: rotation,
      targetComponentId: componentId,
      previewVisible: visible,
    });
  },
}));

export function useSensorPlacementSelector<T>(selector: (state: any) => T): T {
  return useSensorPlacement(selector);
}