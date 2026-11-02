import { create } from 'zustand';
import type { MachineComponent, Vec3, VirtualSensor, SensorType } from '@/types';
import { createDefaultAssembly } from '@/machinery/defaultAssembly';
import * as THREE from 'three';
import { createSensorId } from '@/sensors/sensorDefinitions';

const HISTORY_LIMIT = 100;

interface WorldTransform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

function multiplyTransforms(parent: WorldTransform, child: WorldTransform): WorldTransform {
  const parentMat = new THREE.Matrix4();
  parentMat.compose(
    new THREE.Vector3(...parent.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...parent.rotation, 'XYZ')),
    new THREE.Vector3(...parent.scale)
  );

  const childMat = new THREE.Matrix4();
  childMat.compose(
    new THREE.Vector3(...child.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...child.rotation, 'XYZ')),
    new THREE.Vector3(...child.scale)
  );

  const resultMat = new THREE.Matrix4().multiplyMatrices(parentMat, childMat);
  const resultPos = new THREE.Vector3();
  const resultQuat = new THREE.Quaternion();
  const resultScale = new THREE.Vector3();
  resultMat.decompose(resultPos, resultQuat, resultScale);
  const resultEuler = new THREE.Euler().setFromQuaternion(resultQuat, 'XYZ');

  return {
    position: [resultPos.x, resultPos.y, resultPos.z],
    rotation: [resultEuler.x, resultEuler.y, resultEuler.z],
    scale: [resultScale.x, resultScale.y, resultScale.z],
  };
}

function computeWorldTransforms(components: MachineComponent[]): Map<string, WorldTransform> {
  const result = new Map<string, WorldTransform>();
  const childrenMap = new Map<string, string[]>();

  for (const c of components) {
    if (c.parentId) {
      const arr = childrenMap.get(c.parentId) || [];
      arr.push(c.id);
      childrenMap.set(c.parentId, arr);
    }
  }

  const roots = components.filter((c) => !c.parentId);

  const traverse = (comp: MachineComponent, parentTransform: WorldTransform | null) => {
    let local: WorldTransform;
    if (comp.moveWithParent && parentTransform) {
      local = {
        position: comp.localPosition,
        rotation: comp.localRotation,
        scale: comp.localScale,
      };
    } else {
      local = {
        position: comp.position,
        rotation: comp.rotation,
        scale: comp.scale,
      };
    }

    const world = parentTransform ? multiplyTransforms(parentTransform, local) : local;
    result.set(comp.id, world);

    const children = childrenMap.get(comp.id) || [];
    for (const childId of children) {
      const child = components.find((c) => c.id === childId);
      if (child) traverse(child, world);
    }
  };

  for (const root of roots) {
    traverse(root, null);
  }

  return result;
}

interface AssemblyState {
  components: MachineComponent[];
  sensors: VirtualSensor[];
  selectedId: string | null;
  explode: number;
  past: MachineComponent[][];
  future: MachineComponent[][];

  select: (id: string | null) => void;
  commit: (updater: (c: MachineComponent[]) => MachineComponent[]) => void;
  patchLive: (id: string, patch: Partial<MachineComponent>) => void;
  checkpoint: (snapshot: MachineComponent[]) => void;
  setTransform: (id: string, patch: { position?: Vec3; rotation?: Vec3; scale?: Vec3 }) => void;
  setLocalTransform: (id: string, patch: { localPosition?: Vec3; localRotation?: Vec3; localScale?: Vec3 }) => void;
  setMoveWithParent: (id: string, value: boolean) => void;
  getWorldTransform: (id: string) => WorldTransform | null;
  computeWorldTransforms: () => Map<string, WorldTransform>;
  setDimensions: (id: string, dims: Partial<MachineComponent['dimensions']>) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  resetTransform: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  setExplode: (value: number) => void;
  resetAssembly: () => void;
  undo: () => void;
  redo: () => void;
  replaceAll: (components: MachineComponent[]) => void;

  // Sensor management
  addSensor: (sensorType: SensorType, componentId: string, localPosition?: Vec3, localRotation?: Vec3) => string;
  updateSensor: (id: string, patch: Partial<VirtualSensor>) => void;
  removeSensor: (id: string) => void;
  getSensorsForComponent: (componentId: string) => VirtualSensor[];
  setSensorCalibration: (sensorId: string, calibration: VirtualSensor['calibration']) => void;
}

export const useAssemblyStore = create<AssemblyState>((set, get) => ({
  components: createDefaultAssembly(),
  sensors: [],
  selectedId: null,
  explode: 0,
  past: [],
  future: [],

  select: (id) => set({ selectedId: id }),

  commit: (updater) => {
    const { components, past } = get();
    set({
      components: updater(components),
      past: [...past, components].slice(-HISTORY_LIMIT),
      future: [],
    });
  },

  patchLive: (id, patch) =>
    set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  checkpoint: (snapshot) =>
    set((s) => ({ past: [...s.past, snapshot].slice(-HISTORY_LIMIT), future: [] })),

  setTransform: (id, patch) =>
    get().commit((cs) =>
      cs.map((c) =>
        c.id === id && !c.locked
          ? {
              ...c,
              ...patch,
              // If moveWithParent, also update local transform to match
              ...(c.moveWithParent && c.parentId
                ? {
                    localPosition: patch.position ?? c.localPosition,
                    localRotation: patch.rotation ?? c.localRotation,
                    localScale: patch.scale ?? c.localScale,
                  }
                : {}),
            }
          : c
      )
    ),

  setLocalTransform: (id, patch) =>
    get().commit((cs) =>
      cs.map((c) =>
        c.id === id && !c.locked ? { ...c, ...patch } : c
      )
    ),

  setMoveWithParent: (id, value) =>
    get().commit((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        if (!value) {
          // Switching to world-space: compute current world transform and store as position/rotation/scale
          const world = get().getWorldTransform(id);
          return {
            ...c,
            moveWithParent: false,
            position: world ? world.position : c.position,
            rotation: world ? world.rotation : c.rotation,
            scale: world ? world.scale : c.scale,
          };
        }
        return { ...c, moveWithParent: value };
      })
    ),

  getWorldTransform: (id) => {
    const { components } = get();
    const transforms = computeWorldTransforms(components);
    return transforms.get(id) ?? null;
  },

  computeWorldTransforms: () => {
    const { components } = get();
    return computeWorldTransforms(components);
  },

  setDimensions: (id, dims) =>
    get().commit((cs) =>
      cs.map((c) =>
        c.id === id && !c.locked ? { ...c, dimensions: { ...c.dimensions, ...dims }, provisional: true } : c,
      ),
    ),

  toggleVisible: (id) =>
    get().commit((cs) => cs.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))),

  toggleLocked: (id) =>
    get().commit((cs) => cs.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c))),

  resetTransform: (id) => {
    const original = createDefaultAssembly().find((c) => c.id === id);
    get().commit((cs) =>
      cs.map((c) =>
        c.id === id && !c.locked
          ? {
              ...c,
              position: original ? original.position : c.position,
              rotation: original ? original.rotation : [0, 0, 0],
              scale: [1, 1, 1],
              localPosition: original ? original.localPosition : c.localPosition,
              localRotation: original ? original.localRotation : c.localRotation,
              localScale: original ? original.localScale : c.localScale,
              moveWithParent: original ? original.moveWithParent : c.moveWithParent,
            }
          : c,
      ),
    );
  },

  duplicate: (id) => {
    const src = get().components.find((c) => c.id === id);
    if (!src) return;
    const prefix = src.id.replace(/-\d+$/, '');
    const used = get()
      .components.filter((c) => c.id.startsWith(prefix + '-'))
      .map((c) => parseInt(c.id.slice(prefix.length + 1), 10))
      .filter((n) => !Number.isNaN(n));
    const next = (used.length ? Math.max(...used) : 0) + 1;
    const newId = `${prefix}-${String(next).padStart(3, '0')}`;
    const copy: MachineComponent = {
      ...src,
      id: newId,
      name: `${src.name} (copy)`,
      position: [src.position[0], src.position[1], src.position[2] + 0.25],
      localPosition: [src.localPosition[0], src.localPosition[1], src.localPosition[2] + 0.25],
      sensorIds: [],
      locked: false,
    };
    get().commit((cs) => [...cs, copy]);
    set({ selectedId: newId });
  },

  remove: (id) => {
    const target = get().components.find((c) => c.id === id);
    if (!target || target.locked) return;
    get().commit((cs) =>
      cs.filter((c) => c.id !== id).map((c) => (c.parentId === id ? { ...c, parentId: target.parentId } : c)),
    );
    if (get().selectedId === id) set({ selectedId: null });
  },

  setExplode: (value) => set({ explode: Math.min(1, Math.max(0, value)) }),

  resetAssembly: () => {
    const { components, past } = get();
    set({
      components: createDefaultAssembly(),
      selectedId: null,
      explode: 0,
      past: [...past, components].slice(-HISTORY_LIMIT),
      future: [],
    });
  },

  undo: () => {
    const { past, future, components } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({ components: prev, past: past.slice(0, -1), future: [components, ...future] });
  },

  redo: () => {
    const { past, future, components } = get();
    if (!future.length) return;
    const [next, ...rest] = future;
    set({ components: next, past: [...past, components], future: rest });
  },

  replaceAll: (components) => set({ components, selectedId: null, past: [], future: [], explode: 0 }),

  // Sensor management
  addSensor: (sensorType, componentId, localPosition = [0, 0, 0], localRotation = [0, 0, 0]) => {
    const { components, sensors } = get();
    const component = components.find((c) => c.id === componentId);
    if (!component) throw new Error(`Component ${componentId} not found`);

    const { SENSOR_DEFINITIONS } = require('@/sensors/sensorDefinitions');
    const definition = SENSOR_DEFINITIONS[sensorType];
    if (!definition) throw new Error(`Unknown sensor type: ${sensorType}`);

    const newId = createSensorId(sensors.map((s) => s.id));
    const sensor: VirtualSensor = {
      id: newId,
      definition,
      componentId,
      localPosition,
      localRotation,
      visible: true,
      locked: false,
      calibration: { offset: 0, scale: 1, lastCalibrated: new Date().toISOString() },
    };

    set((s) => ({
      sensors: [...s.sensors, sensor],
      components: s.components.map((c) =>
        c.id === componentId ? { ...c, sensorIds: [...c.sensorIds, newId] } : c,
      ),
    }));
    return newId;
  },

  updateSensor: (id, patch) =>
    set((s) => ({
      sensors: s.sensors.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  removeSensor: (id) =>
    set((s) => {
      const sensor = s.sensors.find((sn) => sn.id === id);
      return {
        sensors: s.sensors.filter((sn) => sn.id !== id),
        components: sensor
          ? s.components.map((c) =>
              c.id === sensor.componentId ? { ...c, sensorIds: c.sensorIds.filter((sid) => sid !== id) } : c,
            )
          : s.components,
      };
    }),

  getSensorsForComponent: (componentId) =>
    get().sensors.filter((s) => s.componentId === componentId),

  setSensorCalibration: (sensorId, calibration) =>
    set((s) => ({
      sensors: s.sensors.map((sn) =>
        sn.id === sensorId ? { ...sn, calibration } : sn,
      ),
    })),
}));