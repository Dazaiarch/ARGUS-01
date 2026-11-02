# ARGUS_TECHNICAL_ROADMAP.md

**Project**: ARGUS — Immersive 3D Engineering Environment
**Version**: 1.0
**Date**: 2026-10-31
**Audience**: Engineering team implementing Milestones 04–08

---

## 1. TYPE SYSTEM EXTENSIONS

### 1.1 New Types (`src/types/index.ts`)

```typescript
// ===== EXISTING (keep) =====
export type Vec3 = [number, number, number];
export type ComponentType = 'motor' | 'mounting-plate' | 'shaft' | 'coupling' | 'bearing-housing' | 'bearing' | 'base-frame' | 'load-disc' | 'sensor-mount';
export type ComponentStatus = 'healthy' | 'warning' | 'fault' | 'offline';
export type MaterialKey = 'steel' | 'aluminium' | 'cast-iron' | 'rubber-steel' | 'copper-steel';
export type ViewPreset = 'perspective' | 'orthographic' | 'front' | 'side' | 'top' | 'isometric';
export type TransformMode = 'translate' | 'rotate' | 'scale';
export type SectionId = 'command-centre' | 'engineering-studio' | 'gesture-lab' | 'assembly-lab' | 'digital-twin' | 'sensor-mapping' | 'analytics' | 'project-configuration';

// ===== NEW FOR M04 =====
export interface MachineComponent {
  // ... existing fields ...
  localPosition: Vec3;          // Relative to parent (NEW)
  localRotation: Vec3;          // Relative to parent (NEW)
  localScale: Vec3;             // Relative to parent (NEW)
  moveWithParent: boolean;      // If true, world transform follows parent (NEW)
  modelUrl?: string;            // Optional GLB asset (NEW)
}

export type SensorType = 'vibration' | 'temperature' | 'rpm' | 'current' | 'acoustic';

export interface SensorDefinition {
  type: SensorType;
  label: string;
  unit: string;
  icon: string;
  color: string;
  defaultRange: [number, number];
  frequencyRange?: [number, number]; // For vibration/acoustic
}

export interface VirtualSensor {
  id: string;                   // SNS-XXX
  definition: SensorDefinition;
  componentId: string;
  localPosition: Vec3;
  localRotation: Vec3;
  visible: boolean;
  locked: boolean;
  calibration?: SensorCalibration;
}

export interface SensorCalibration {
  offset: number;
  scale: number;
  lastCalibrated: string;
}

export interface SavedConfiguration {
  version: number;              // Config schema version
  name: string;
  description?: string;
  createdAt: string;            // ISO 8601
  updatedAt: string;
  components: MachineComponent[];
  sensors: VirtualSensor[];
  viewState: ViewStateSnapshot;
}

export interface ViewStateSnapshot {
  camera: { preset: ViewPreset; position: Vec3; target: Vec3 };
  explode: number;
  transformMode: TransformMode;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  lightIntensity: number;
}

// ===== NEW FOR M05 =====
export type GestureType = 'open-palm' | 'pinch' | 'two-hand-zoom' | 'two-hand-rotate' | 'swipe-left' | 'swipe-right' | 'fist' | 'three-fingers' | 'open-palm-held';

export interface HandLandmark {
  x: number;   // Normalized 0–1
  y: number;
  z: number;   // Relative depth
}

export interface HandData {
  handedness: 'Left' | 'Right';
  landmarks: HandLandmark[];
  confidence: number;
  timestamp: number;
}

export interface RecognizedGesture {
  type: GestureType;
  hand: 'Left' | 'Right' | 'Both';
  confidence: number;
  data: GestureData;
  timestamp: number;
}

export interface GestureData {
  pinchDistance?: number;       // 0–1 normalized
  palmNormal?: Vec3;
  handVelocity?: Vec3;
  fingerStates?: boolean[];     // [thumb, index, middle, ring, pinky] extended
  twoHandDistance?: number;     // For zoom
  twoHandAngle?: number;        // For rotation
}

// ===== NEW FOR M06 =====
export interface SimulationState {
  motor: MotorState;
  shaft: ShaftState;
  sensors: Record<string, SensorReading>;
  faults: Fault[];
  time: number;                 // Simulation time (seconds)
  speed: number;                // Time multiplier (1.0 = real-time)
}

export interface MotorState {
  running: boolean;
  targetRpm: number;
  currentRpm: number;
  acceleration: number;         // rpm/s^2
  inertia: number;              // kg·m²
  torque: number;               // N·m
}

export interface ShaftState {
  angle: number;                // Radians
  angularVelocity: number;      // rad/s
  angularAcceleration: number;  // rad/s²
}

export interface SensorReading {
  sensorId: string;
  value: number;
  timestamp: number;
  quality: 'good' | 'degraded' | 'bad';
}

export type FaultType = 'imbalance' | 'misalignment' | 'bearing-defect' | 'overheating';

export interface Fault {
  id: string;
  type: FaultType;
  componentId: string;
  severity: number;             // 0–1
  activatedAt: number;          // Simulation time
  parameters: FaultParameters;
}

export interface FaultParameters {
  // Imbalance
  mass?: number;                // kg
  radius?: number;              // m
  angle?: number;               // rad
  // Misalignment
  offset?: number;              // mm
  angle?: number;               // deg
  // Bearing defect
  defectFrequency?: number;     // Hz (BPFO/BPFI/BSF/FTF)
  // Overheating
  tempRiseRate?: number;        // °C/s
}

// ===== NEW FOR M07 =====
export interface ChartDataPoint {
  t: number;                    // Timestamp
  [key: string]: number;        // Sensor values
}

export interface ChartConfig {
  id: string;
  title: string;
  sensors: string[];            // Sensor IDs
  timeWindow: number;           // Seconds
  downsample: 'none' | 'minmax' | 'avg';
  yAxis: 'linear' | 'log';
}
```

### 1.2 Type Migration Strategy

```bash
# Phase 1: Add new optional fields to MachineComponent
# Phase 2: Write migration function in assemblyStore.replaceAll()
# Phase 3: Update defaultAssembly.ts with local transforms
# Phase 4: Remove old flat position/rotation/scale (after verification)
```

---

## 2. STORE ARCHITECTURE EXTENSIONS

### 2.1 Assembly Store Additions (`src/store/assemblyStore.ts`)

```typescript
// Add to AssemblyState interface
interface AssemblyState {
  // ... existing ...
  
  // Configuration persistence
  saveConfiguration: (name: string, description?: string) => Promise<string>; // returns ID
  loadConfiguration: (id: string) => Promise<void>;
  exportConfiguration: (id: string) => string; // JSON
  importConfiguration: (json: string) => Promise<void>;
  listConfigurations: () => SavedConfiguration[];
  deleteConfiguration: (id: string) => Promise<void>;
  
  // Component library
  addComponent: (templateId: string, position?: Vec3) => void;
  
  // Parent-child transforms
  setLocalTransform: (id: string, patch: { localPosition?: Vec3; localRotation?: Vec3; localScale?: Vec3 }) => void;
  setMoveWithParent: (id: string, value: boolean) => void;
  getWorldTransform: (id: string) => { position: Vec3; rotation: Vec3; scale: Vec3 };
  
  // Animation
  animateExplode: (target: number, durationMs?: number) => Promise<void>;
  
  // Sensors
  sensors: VirtualSensor[];
  addSensor: (sensor: Omit<VirtualSensor, 'id'>) => string;
  updateSensor: (id: string, patch: Partial<VirtualSensor>) => void;
  removeSensor: (id: string) => void;
}
```

### 2.2 View Store Additions (`src/store/viewStore.ts`)

```typescript
// Add to ViewState interface
interface ViewState {
  // ... existing ...
  
  // Isolation
  isolatedId: string | null;
  isolate: (id: string) => void;
  clearIsolation: () => void;
  
  // Measurement
  measurementMode: 'none' | 'distance' | 'angle' | 'diameter';
  setMeasurementMode: (mode: ViewState['measurementMode']) => void;
  measurementPoints: Vec3[];      // Clicked points
  addMeasurementPoint: (point: Vec3) => void;
  clearMeasurementPoints: () => void;
  
  // Section/clipping
  clippingPlanes: ClippingPlane[];
  addClippingPlane: (plane: ClippingPlane) => void;
  updateClippingPlane: (index: number, patch: Partial<ClippingPlane>) => void;
  removeClippingPlane: (index: number) => void;
  
  // Gesture
  gestureEnabled: boolean;
  setGestureEnabled: (enabled: boolean) => void;
  webcamStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface ClippingPlane {
  enabled: boolean;
  normal: Vec3;           // World space
  constant: number;       // Distance from origin
  color: string;          // Visual gizmo color
}
```

### 2.3 New Stores

#### `src/store/gestureStore.ts` (M05)
```typescript
interface GestureState {
  // Connection
  webcamStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  selectedCamera: MediaDeviceInfo | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Recognition
  hands: HandData[];
  recognizedGestures: RecognizedGesture[];
  gestureHistory: RecognizedGesture[]; // Last 50
  
  // Settings
  enabledGestures: Record<GestureType, boolean>;
  sensitivity: { pinch: number; swipe: number; zoom: number; rotate: number };
  cooldowns: Record<GestureType, number>;
  handedness: 'Left' | 'Right' | 'Both';
  
  // Calibration
  calibrationMode: boolean;
  calibrationData: CalibrationData;
  
  // Actions
  setEnabledGestures: (gestures: Record<GestureType, boolean>) => void;
  setSensitivity: (s: GestureState['sensitivity']) => void;
  startCalibration: () => void;
  finishCalibration: () => void;
}
```

#### `src/store/simulationStore.ts` (M06)
```typescript
interface SimulationState {
  // Engine
  running: boolean;
  time: number;
  speed: number;              // 0.1–10.0
  fixedTimestep: number;      // 1/60
  
  // State
  motor: MotorState;
  shaft: ShaftState;
  sensors: Record<string, SensorReading>;
  faults: Fault[];
  
  // Actions
  start: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setTargetRpm: (rpm: number) => void;
  activateFault: (fault: Omit<Fault, 'id' | 'activatedAt'>) => string;
  deactivateFault: (id: string) => void;
  clearFaults: () => void;
  
  // Sensor binding
  bindSensor: (sensorId: string, componentId: string) => void;
  unbindSensor: (sensorId: string) => void;
}
```

---

## 3. 3D ENGINE EXTENSIONS

### 3.1 ComponentNode Updates (`src/engine/ComponentNode.tsx`)

```typescript
// Changes:
// 1. Accept computed world transform from parent hierarchy
// 2. Support GLB model loading (lazy)
// 3. Support sensor mounting points visualization
// 4. Support isolation mode (dim non-isolated)

interface ComponentNodeProps {
  component: MachineComponent;
  worldTransform: { position: Vec3; rotation: Vec3; scale: Vec3 };
  isIsolated: boolean;
  isAncestorOfIsolated: boolean;
  // ... existing props
}

// GLB loading:
const Model = useMemo(() => {
  if (c.modelUrl) return <GLTFModel url={c.modelUrl} />;
  return <ComponentGeometry c={c} mat={mat} darkMat={darkMat} />;
}, [c.modelUrl, c.type]);
```

### 3.2 Scene Updates (`src/engine/Scene.tsx`)

```typescript
// Changes:
// 1. Compute world transforms for all components (topological sort)
// 2. Apply clipping planes to materials
// 3. Render measurement overlays
// 4. Render sensor nodes
// 5. Handle isolation filtering

// World transform computation:
const computeWorldTransforms = (components: MachineComponent[]): Map<string, WorldTransform> => {
  const map = new Map<string, WorldTransform>();
  const roots = components.filter(c => !c.parentId);
  
  const traverse = (comp: MachineComponent, parentTransform: WorldTransform | null) => {
    const local = {
      position: comp.localPosition,
      rotation: comp.localRotation,
      scale: comp.localScale,
    };
    const world = parentTransform 
      ? multiplyTransforms(parentTransform, local)
      : local;
    
    if (comp.moveWithParent && parentTransform) {
      map.set(comp.id, world);
    } else {
      // Use stored world position (legacy or explicitly positioned)
      map.set(comp.id, { position: comp.position, rotation: comp.rotation, scale: comp.scale });
    }
    
    // Children
    components.filter(c => c.parentId === comp.id).forEach(child => traverse(child, world));
  };
  
  roots.forEach(r => traverse(r, null));
  return map;
};
```

### 3.3 New Components

#### `src/engine/SensorNode.tsx`
```typescript
interface SensorNodeProps {
  sensor: VirtualSensor;
  componentWorldTransform: WorldTransform;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  registerRef: (id: string, g: THREE.Group | null) => void;
}

// Visual: Type-specific geometry + color + label
// Vibration: Accelerometer cube (cyan)
// Temperature: Thermocouple bead (amber)
// RPM: Optical encoder disc (blue)
// Current: Clamp probe (green)
// Acoustic: Microphone capsule (purple)
```

#### `src/engine/MeasurementOverlay.tsx`
```typescript
interface MeasurementOverlayProps {
  mode: 'none' | 'distance' | 'angle' | 'diameter';
  points: Vec3[];
  onComplete: (measurement: Measurement) => void;
}

// Renders: Lines between points, text labels with values
// Uses Three.js Line2 + TextGeometry for crisp rendering
```

#### `src/engine/ClippingPlaneGizmo.tsx`
```typescript
interface ClippingPlaneGizmoProps {
  plane: ClippingPlane;
  index: number;
  onUpdate: (index: number, patch: Partial<ClippingPlane>) => void;
  onRemove: (index: number) => void;
}

// Renders: Semi-transparent grid plane with handles
// Drag handles to move/rotate plane
```

---

## 4. MACHINERY SYSTEM EXTENSIONS

### 4.1 Component Library (`src/machinery/componentLibrary.ts`)

```typescript
export interface ComponentTemplate {
  id: string;                    // 'motor', 'bearing', etc.
  label: string;
  type: ComponentType;
  category: string;
  defaultDimensions: Dimensions;
  defaultMaterial: MaterialKey;
  defaultExplodeVector: Vec3;
  scaleConstrained: boolean;
  description: string;
  modelUrl?: string;             // Future GLB
  sensorMountPoints: Vec3[];     // Relative positions for sensor mounting
}

export const COMPONENT_LIBRARY: ComponentTemplate[] = [
  {
    id: 'motor',
    label: 'Electric Motor',
    type: 'motor',
    category: 'Drive',
    defaultDimensions: { length: 0.5, radius: 0.16 },
    defaultMaterial: 'cast-iron',
    defaultExplodeVector: [-0.5, 0.25, 0],
    scaleConstrained: false,
    description: 'Three-phase induction motor',
    sensorMountPoints: [[0, 0.2, 0], [-0.25, 0.1, 0.15]],
  },
  {
    id: 'bearing',
    label: 'Bearing Assembly',
    type: 'bearing',
    category: 'Support',
    defaultDimensions: { length: 0.05, radius: 0.052 },
    defaultMaterial: 'steel',
    defaultExplodeVector: [0, 0.55, -0.3],
    scaleConstrained: true,
    description: 'Deep groove ball bearing',
    sensorMountPoints: [[0, 0.06, 0.052], [0, 0.06, -0.052]],
  },
  // ... shaft, coupling, bearing-housing, load-disc, sensor-mount, base-frame, mounting-plate
];
```

### 4.2 Asset Loader (`src/machinery/assetLoader.ts`)

```typescript
export async function loadComponentModel(url: string): Promise<{
  scene: THREE.Group;
  bounds: THREE.Box3;
  materials: Map<string, THREE.Material>;
}> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  
  // Normalize to ARGUS coordinate system
  const scene = gltf.scene;
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // Apply ARGUS material if not overridden
    }
  });
  
  const bounds = new THREE.Box3().setFromObject(scene);
  
  // Scale to metres if needed (detect from bounds)
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 10) { // Likely in cm or mm
    const scale = 1 / maxDim; // Normalize to ~1m
    scene.scale.setScalar(scale);
  }
  
  return { scene, bounds: new THREE.Box3().setFromObject(scene), materials: new Map() };
}
```

---

## 5. GESTURE SYSTEM SPECIFICATION (M05)

### 5.1 MediaPipe Integration (`src/gestures/handTracker.ts`)

```typescript
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private running = false;
  private onHandsUpdate: (hands: HandData[]) => void;
  
  constructor(onUpdate: (hands: HandData[]) => void) {
    this.onHandsUpdate = onUpdate;
  }
  
  async initialize(cameraId?: string): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.7,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    this.video = document.createElement('video');
    this.video.setAttribute('playsinline', '');
    this.video.style.display = 'none';
    document.body.appendChild(this.video);
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'user' },
      audio: false,
    });
    
    this.video.srcObject = stream;
    await this.video.play();
    
    this.running = true;
    this.processFrame();
  }
  
  private async processFrame(): Promise<void> {
    if (!this.running || !this.landmarker || !this.video) return;
    
    const results = this.landmarker.detectForVideo(this.video, performance.now());
    
    const hands: HandData[] = results.landmarks.map((landmarks, i) => ({
      handedness: results.handedness[i][0].categoryName,
      landmarks: landmarks.map(l => ({ x: l.x, y: l.y, z: l.z })),
      confidence: results.handedness[i][0].score,
      timestamp: performance.now(),
    }));
    
    this.onHandsUpdate(hands);
    
    if (this.running) {
      requestAnimationFrame(() => this.processFrame());
    }
  }
  
  dispose(): void {
    this.running = false;
    this.landmarker?.destroy();
    this.video?.srcObject?.getTracks().forEach(t => t.stop());
    this.video?.remove();
  }
}
```

### 5.2 Gesture Recognizer (`src/gestures/gestureRecognizer.ts`)

```typescript
export class GestureRecognizer {
  private prevHands: HandData[] = [];
  private gestureCooldowns: Map<GestureType, number> = new Map();
  
  recognize(hands: HandData[]): RecognizedGesture[] {
    const gestures: RecognizedGesture[] = [];
    
    for (const hand of hands) {
      const fingerStates = this.classifyFingers(hand.landmarks);
      const pinchDistance = this.calculatePinchDistance(hand.landmarks);
      const palmNormal = this.calculatePalmNormal(hand.landmarks);
      const velocity = this.calculateVelocity(hand);
      
      // Single-hand gestures
      if (this.isOpenPalm(fingerStates)) {
        gestures.push(this.makeGesture('open-palm', hand, { fingerStates, palmNormal }));
      }
      if (this.isPinch(fingerStates, pinchDistance)) {
        gestures.push(this.makeGesture('pinch', hand, { fingerStates, pinchDistance, palmNormal }));
      }
      if (this.isFist(fingerStates)) {
        gestures.push(this.makeGesture('fist', hand, { fingerStates }));
      }
      if (this.isThreeFingers(fingerStates)) {
        gestures.push(this.makeGesture('three-fingers', hand, { fingerStates }));
      }
      if (this.isOpenPalmHeld(fingerStates, hand)) {
        gestures.push(this.makeGesture('open-palm-held', hand, { fingerStates }));
      }
      
      // Swipe detection (compare with previous frame)
      const prevHand = this.prevHands.find(h => h.handedness === hand.handedness);
      if (prevHand) {
        const swipe = this.detectSwipe(prevHand.landmarks, hand.landmarks);
        if (swipe) {
          gestures.push(this.makeGesture(swipe.direction === 'left' ? 'swipe-left' : 'swipe-right', hand, { fingerStates }));
        }
      }
    }
    
    // Two-hand gestures
    if (hands.length === 2) {
      const [left, right] = hands.sort((a, b) => a.handedness.localeCompare(b.handedness));
      const distance = this.calculateTwoHandDistance(left.landmarks, right.landmarks);
      const angle = this.calculateTwoHandAngle(left.landmarks, right.landmarks);
      const prevLeft = this.prevHands.find(h => h.handedness === 'Left');
      const prevRight = this.prevHands.find(h => h.handedness === 'Right');
      
      if (prevLeft && prevRight) {
        const prevDistance = this.calculateTwoHandDistance(prevLeft.landmarks, prevRight.landmarks);
        const prevAngle = this.calculateTwoHandAngle(prevLeft.landmarks, prevRight.landmarks);
        
        if (Math.abs(distance - prevDistance) > 0.02) {
          gestures.push(this.makeGesture('two-hand-zoom', left, { 
            twoHandDistance: distance, 
            twoHandDistanceDelta: distance - prevDistance 
          }));
        }
        if (Math.abs(angle - prevAngle) > 0.05) {
          gestures.push(this.makeGesture('two-hand-rotate', left, { 
            twoHandAngle: angle, 
            twoHandAngleDelta: angle - prevAngle 
          }));
        }
      }
    }
    
    this.prevHands = hands;
    return gestures.filter(g => !this.isInCooldown(g.type));
  }
  
  private classifyFingers(landmarks: HandLandmark[]): boolean[] {
    // Tip indices: 4(thumb), 8(index), 12(middle), 16(ring), 20(pinky)
    // PIP indices: 3, 6, 10, 14, 18
    const tips = [4, 8, 12, 16, 20];
    const pips = [3, 6, 10, 14, 18];
    
    return tips.map((tip, i) => {
      // Thumb: compare x (horizontal)
      if (i === 0) {
        return landmarks[tip].x > landmarks[pips[i]].x; // Simplified
      }
      // Other fingers: compare y (vertical, up is smaller in image coords)
      return landmarks[tip].y < landmarks[pips[i]].y;
    });
  }
  
  private calculatePinchDistance(landmarks: HandLandmark[]): number {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    return Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    );
  }
  
  private isPinch(fingerStates: boolean[], pinchDistance: number): boolean {
    return !fingerStates[0] && !fingerStates[1] && // Thumb & index folded
           fingerStates[2] && fingerStates[3] && fingerStates[4] && // Others extended
           pinchDistance < 0.05;
  }
  
  // ... other gesture detection methods
}
```

### 5.3 Command Mapper (`src/gestures/commandMapper.ts`)

```typescript
export class CommandMapper {
  private assemblyStore: AssemblyStore;
  private viewStore: ViewStore;
  private raycaster: THREE.Raycaster;
  private camera: THREE.Camera;
  
  constructor(assemblyStore: AssemblyStore, viewStore: ViewStore, camera: THREE.Camera) {
    this.assemblyStore = assemblyStore;
    this.viewStore = viewStore;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
  }
  
  mapGesture(gesture: RecognizedGesture): void {
    if (this.isInCooldown(gesture.type)) return;
    this.setCooldown(gesture.type);
    
    switch (gesture.type) {
      case 'open-palm':
        this.viewStore.setGestureInteraction(true);
        break;
        
      case 'pinch':
        if (gesture.data.pinchDistance !== undefined) {
          const component = this.raycastFromHand(gesture);
          if (component) {
            this.assemblyStore.select(component.id);
          }
        }
        break;
        
      case 'two-hand-zoom':
        if (gesture.data.twoHandDistanceDelta !== undefined) {
          const factor = gesture.data.twoHandDistanceDelta > 0 ? 1.1 : 0.9;
          this.viewStore.adjustCameraDistance(factor);
        }
        break;
        
      case 'two-hand-rotate':
        if (gesture.data.twoHandAngleDelta !== undefined) {
          this.viewStore.orbitCamera(gesture.data.twoHandAngleDelta);
        }
        break;
        
      case 'swipe-left':
        this.viewStore.orbitCamera(0.3);
        break;
        
      case 'swipe-right':
        this.viewStore.orbitCamera(-0.3);
        break;
        
      case 'fist':
        this.viewStore.setGestureInteraction(false);
        break;
        
      case 'three-fingers':
        this.viewStore.setInspectionMode(true);
        break;
        
      case 'open-palm-held':
        this.assemblyStore.select(null);
        break;
    }
  }
  
  private raycastFromHand(gesture: RecognizedGesture): MachineComponent | null {
    // Convert hand landmark to normalized device coordinates
    // This requires calibration mapping from webcam space to viewport space
    const ndc = this.handToNDC(gesture);
    this.raycaster.setFromCamera(ndc, this.camera);
    const intersects = this.raycaster.intersectObjects(this.getSelectableObjects());
    return intersects[0]?.object.userData.componentId ?? null;
  }
}
```

---

## 6. DIGITAL TWIN SIMULATION SPECIFICATION (M06)

### 6.1 Physics Model

```typescript
// Motor model: First-order lag with inertia
// dω/dt = (T_motor - T_load - B·ω) / J

// Motor torque curve (simplified)
function motorTorque(rpm: number, voltage: number): number {
  const syncSpeed = 3000; // 2-pole, 50Hz
  const slip = (syncSpeed - rpm) / syncSpeed;
  const ratedTorque = 50; // N·m
  const maxTorque = 2.5 * ratedTorque;
  
  // Simplified torque-slip curve
  if (slip <= 0) return 0;
  if (slip > 0.2) return maxTorque * (0.2 / slip);
  return maxTorque * (slip / 0.1) / (1 + (slip / 0.1) ** 2);
}

// Shaft dynamics: Torsional vibration model
// J₁·d²θ₁/dt² = T_motor - K·(θ₁ - θ₂) - C·(dθ₁/dt - dθ₂/dt)
// J₂·d²θ₂/dt² = K·(θ₁ - θ₂) + C·(dθ₁/dt - dθ₂/dt) - T_load

// Coupling: Flexible element with stiffness K and damping C
const COUPLING_STIFFNESS = 1e5;    // N·m/rad
const COUPLING_DAMPING = 10;       // N·m·s/rad
```

### 6.2 Sensor Models

```typescript
// Vibration sensor (accelerometer)
function simulateVibration(sensor: VirtualSensor, state: SimulationState): number {
  const baseNoise = 0.1 * (Math.random() - 0.5); // g RMS
  const rpm = state.motor.currentRpm;
  const freq1x = rpm / 60; // Hz
  
  let signal = baseNoise;
  
  // 1× RPM (imbalance)
  signal += Math.sin(2 * Math.PI * freq1x * state.time) * 0.05;
  
  // 2× RPM (misalignment)
  signal += Math.sin(4 * Math.PI * freq1x * state.time) * 0.02;
  
  // Bearing defect frequencies
  for (const fault of state.faults) {
    if (fault.componentId === sensor.componentId && fault.type === 'bearing-defect') {
      const defectFreq = fault.parameters.defectFrequency || 120; // Hz
      signal += Math.sin(2 * Math.PI * defectFreq * state.time) * fault.severity * 0.5;
    }
  }
  
  return Math.abs(signal); // RMS
}

// Temperature sensor
function simulateTemperature(sensor: VirtualSensor, state: SimulationState): number {
  const ambient = 22; // °C
  const loadFactor = state.motor.currentRpm / 3000;
  const motorHeat = 40 * loadFactor; // °C rise at full load
  
  let temp = ambient + motorHeat * 0.3; // Bearing housing runs cooler
  
  for (const fault of state.faults) {
    if (fault.componentId === sensor.componentId && fault.type === 'overheating') {
      temp += fault.parameters.tempRiseRate * (state.time - fault.activatedAt) * fault.severity;
    }
    if (fault.type === 'bearing-defect' && fault.componentId === sensor.componentId) {
      temp += 15 * fault.severity; // Bearing defect adds heat
    }
  }
  
  return temp + (Math.random() - 0.5) * 0.5; // Noise
}

// RPM sensor
function simulateRpm(sensor: VirtualSensor, state: SimulationState): number {
  return state.motor.currentRpm + (Math.random() - 0.5) * 2; // ±1 RPM noise
}

// Current sensor
function simulateCurrent(sensor: VirtualSensor, state: SimulationState): number {
  const baseCurrent = 10; // A at no load
  const loadCurrent = 40 * (state.motor.torque / 125); // Proportional to torque
  let current = baseCurrent + loadCurrent;
  
  for (const fault of state.faults) {
    if (fault.type === 'imbalance') {
      current += 2 * fault.severity * Math.sin(2 * Math.PI * state.motor.currentRpm / 60 * state.time);
    }
  }
  
  return current + (Math.random() - 0.5) * 0.2;
}

// Acoustic sensor
function simulateAcoustic(sensor: VirtualSensor, state: SimulationState): number {
  const rpm = state.motor.currentRpm;
  const freq1x = rpm / 60;
  let spl = 60; // Base dB
  
  spl += 10 * Math.log10(1 + rpm / 1000); // Broadband increases with RPM
  spl += 5 * Math.sin(2 * Math.PI * freq1x * state.time); // Tonal component
  
  for (const fault of state.faults) {
    if (fault.type === 'bearing-defect') {
      spl += 10 * fault.severity;
    }
  }
  
  return spl + (Math.random() - 0.5) * 1;
}
```

### 6.3 Simulation Loop (`src/digital-twin/simulationEngine.ts`)

```typescript
export class SimulationEngine {
  private state: SimulationState;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly FIXED_TIMESTEP = 1 / 60; // 60 Hz physics
  private subscribers: ((state: SimulationState) => void)[] = [];
  
  constructor(initialState: SimulationState) {
    this.state = initialState;
  }
  
  subscribe(fn: (state: SimulationState) => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(f => f !== fn);
    };
  }
  
  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }
  
  stop(): void {
    this.running = false;
  }
  
  private loop(): void {
    if (!this.running) return;
    
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000 * this.state.speed;
    this.lastTime = now;
    
    this.accumulator += dt;
    
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.step(this.FIXED_TIMESTEP);
      this.accumulator -= this.FIXED_TIMESTEP;
    }
    
    // Interpolate for rendering
    const alpha = this.accumulator / this.FIXED_TIMESTEP;
    const renderState = this.interpolateState(alpha);
    
    this.subscribers.forEach(fn => fn(renderState));
    requestAnimationFrame(() => this.loop());
  }
  
  private step(dt: number): void {
    // Motor
    const targetRpm = this.state.motor.targetRpm;
    const currentRpm = this.state.motor.currentRpm;
    const torque = motorTorque(currentRpm, 1.0); // Full voltage
    const loadTorque = this.calculateLoadTorque();
    const netTorque = torque - loadTorque - 0.1 * currentRpm; // Viscous damping
    const alpha = netTorque / this.state.motor.inertia; // rad/s²
    
    this.state.motor.currentRpm += alpha * dt * 60 / (2 * Math.PI);
    this.state.motor.currentRpm = Math.max(0, Math.min(targetRpm * 1.1, this.state.motor.currentRpm));
    
    // Shaft
    this.state.shaft.angularVelocity = this.state.motor.currentRpm * 2 * Math.PI / 60;
    this.state.shaft.angle += this.state.shaft.angularVelocity * dt;
    
    // Sensors
    this.updateSensors();
    
    // Time
    this.state.time += dt;
  }
  
  private calculateLoadTorque(): number {
    // Load disc inertia + bearing friction + windage
    return 5 + 0.02 * this.state.motor.currentRpm; // N·m
  }
  
  private updateSensors(): void {
    for (const [id, reading] of Object.entries(this.state.sensors)) {
      const sensor = this.getSensorById(id);
      if (!sensor) continue;
      
      switch (sensor.definition.type) {
        case 'vibration':
          reading.value = simulateVibration(sensor, this.state);
          break;
        case 'temperature':
          reading.value = simulateTemperature(sensor, this.state);
          break;
        case 'rpm':
          reading.value = simulateRpm(sensor, this.state);
          break;
        case 'current':
          reading.value = simulateCurrent(sensor, this.state);
          break;
        case 'acoustic':
          reading.value = simulateAcoustic(sensor, this.state);
          break;
      }
      reading.timestamp = this.state.time;
    }
  }
  
  // ... interpolateState, getSensorById, etc.
}
```

---

## 7. ANALYTICS SPECIFICATION (M07)

### 7.1 uPlot Chart Component (`src/analytics/Chart.tsx`)

```typescript
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

interface ChartProps {
  config: ChartConfig;
  data: ChartDataPoint[];        // Time-series data
  faults: Fault[];               // For fault markers
  height: number;
  onCursor: (point: ChartDataPoint | null) => void;
}

export function Chart({ config, data, faults, height, onCursor }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Prepare series
    const series: uPlot.Series[] = [
      { label: 'Time', value: (u, i) => new Date(data[i].t * 1000).toLocaleTimeString() },
      ...config.sensors.map(sensorId => ({
        label: sensorId,
        value: (u, i) => data[i][sensorId]?.toFixed(2) ?? '—',
        stroke: sensorColor(sensorId),
        width: 1.5,
        paths: () => uPlot.paths.linear,
      })),
    ];
    
    // Fault markers as extra series (points only)
    const faultPoints = faults.map(f => ({
      label: f.type,
      show: true,
      points: { show: true, size: 6, stroke: 'red', fill: 'red' },
      paths: () => uPlot.paths.points,
      data: data.map((d, i) => faults.some(f => f.activatedAt <= d.t && (!f.deactivatedAt || f.deactivatedAt >= d.t) && f.componentId === sensorId) ? d[sensorId] : null),
    }));
    
    const opts: uPlot.Options = {
      title: config.title,
      width: containerRef.current.clientWidth,
      height,
      scales: {
        x: { time: true, type: 'utc' },
        y: { type: config.yAxis },
      },
      series: [...series, ...faultPoints],
      axes: [
        { scale: 'x', grid: { stroke: '#2d343e' } },
        { scale: 'y', grid: { stroke: '#2d343e' }, side: 1 },
      ],
      cursor: {
        show: true,
        drag: { setScale: false },
        focus: { prox: 10 },
        lock: true,
        points: { show: true, size: 4 },
      },
      hooks: {
        draw: [
          (u) => {
            // Draw fault regions
            faults.forEach(f => {
              if (f.activatedAt && (!f.deactivatedAt || f.deactivatedAt > u.scales.x.min)) {
                const x1 = u.pos.fwd(f.activatedAt);
                const x2 = f.deactivatedAt ? u.pos.fwd(f.deactivatedAt) : u.bbox.width;
                u.ctx.fillStyle = 'rgba(229, 83, 75, 0.1)';
                u.ctx.fillRect(x1, 0, x2 - x1, u.bbox.height);
              }
            });
          },
        ],
      },
    };
    
    uplotRef.current = new uPlot(opts, transformData(data, config.sensors), containerRef.current);
    
    // Cursor handler
    const handleCursor = (u: uPlot) => {
      const idx = u.cursor.idx;
      if (idx >= 0 && idx < data.length) {
        onCursor(data[idx]);
      } else {
        onCursor(null);
      }
    };
    
    uplotRef.current.hooks.setCursor.push(handleCursor);
    
    return () => {
      uplotRef.current?.destroy();
      uplotRef.current = null;
    };
  }, [config, data, faults, height]);
  
  return <div ref={containerRef} style={{ width: '100%' }} />;
}

function transformData(data: ChartDataPoint[], sensors: string[]): number[][] {
  const series = [data.map(d => d.t * 1000)]; // uPlot wants ms
  for (const s of sensors) {
    series.push(data.map(d => d[s] ?? null));
  }
  return series;
}
```

### 7.2 Analytics Page Layout

```
Analytics Page
├── Header: Time window selector (1m/5m/15m/1h/4h/24h), Export CSV, Pause
├── Health Dashboard (grid)
│   ├── Component cards: Status, last reading, trend sparkline
│   └── Sensor status table: ID, Type, Component, Value, Quality, Age
├── Charts (vertical stack)
│   ├── RPM Chart (motor RPM, shaft RPM)
│   ├── Vibration Chart (all vibration sensors, fault markers)
│   ├── Temperature Chart (all temp sensors, threshold lines)
│   └── Current Chart (motor current, fault markers)
└── Fault Timeline (bottom)
    ├── Horizontal timeline with fault bars
    └── Click to jump charts to fault time
```

---

## 8. PERFORMANCE OPTIMIZATION PLAN

### 8.1 Bundle Splitting Targets

| Chunk | Target (gzipped) | Strategy |
|-------|------------------|----------|
| Main (shell) | < 50 KB | Already lazy |
| EngineeringStudio | < 300 KB | Split: three, drei, geometry |
| DigitalTwin | < 100 KB | Lazy + simulation worker |
| GestureLab | < 80 KB | Lazy + MediaPipe worker |
| Analytics | < 60 KB | Lazy + uPlot worker |
| SensorMapping | < 50 KB | Lazy |

### 8.2 Three.js Optimization

```typescript
// In Viewport.tsx - optimize render settings
<Canvas
  dpr={[1, 1.5]}              // Cap at 1.5x
  shadows={false}             // Disable unless needed
  gl={{
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    preserveDrawingBuffer: false,
  }}
  camera={{ fov: 40, near: 0.05, far: 100 }}
>

// In Scene.tsx - frustum culling
<group>
  {components.map(c => (
    <FrustumCull key={c.id} object={refs.current[c.id]}>
      <ComponentNode ... />
    </FrustumCull>
  ))}
</group>

// Material reuse
const materialCache = new Map<string, THREE.Material>();
function getMaterial(key: string): THREE.Material {
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({ ... }));
  }
  return materialCache.get(key)!;
}
```

### 8.3 Web Workers

```typescript
// simulationWorker.ts
// Offload physics + sensor simulation to worker
// Main thread: receive state at 30Hz, render at 60Hz

// gestureWorker.ts
// Offload MediaPipe landmark processing
// Main thread: receive gestures at 30Hz
```

---

## 9. TESTING SPECIFICATIONS

### 9.1 Unit Tests (Vitest)

```typescript
// tests/assemblyStore.transforms.test.ts
describe('parent-child transforms', () => {
  it('child world position updates when parent moves', () => {
    const store = useAssemblyStore.getState();
    store.replaceAll(createTestAssembly());
    
    const parent = store.components.find(c => c.id === 'base')!;
    const child = store.components.find(c => c.parentId === 'base')!;
    
    store.setLocalTransform('base', { localPosition: [1, 0, 0] });
    
    const world = store.getWorldTransform(child.id);
    expect(world.position[0]).toBeGreaterThan(child.localPosition[0]);
  });
});

// tests/simulationEngine.test.ts
describe('simulation engine', () => {
  it('motor ramps to target RPM', async () => {
    const engine = new SimulationEngine(initialState);
    const states: SimulationState[] = [];
    const unsub = engine.subscribe(s => states.push(s));
    
    engine.start();
    engine.setTargetRpm(1500);
    
    await waitFor(() => states.some(s => s.motor.currentRpm > 1400), { timeout: 5000 });
    
    expect(states[states.length - 1].motor.currentRpm).toBeCloseTo(1500, -1);
    unsub();
    engine.stop();
  });
});

// tests/gestureRecognizer.test.ts
describe('gesture recognizer', () => {
  it('detects pinch gesture', () => {
    const recognizer = new GestureRecognizer();
    const hand = createMockHand({ pinchDistance: 0.03, fingerStates: [false, false, true, true, true] });
    
    const gestures = recognizer.recognize([hand]);
    expect(gestures.some(g => g.type === 'pinch')).toBe(true);
  });
});
```

### 9.2 E2E Tests (Playwright)

```typescript
// e2e/engineering-studio.spec.ts
test('complete engineering workflow', async ({ page }) => {
  await page.goto('/studio');
  
  // Wait for canvas
  await page.waitForSelector('canvas');
  
  // Select motor via click
  await page.click('canvas', { position: { x: 200, y: 300 } });
  await expect(page.locator('text=Electric Motor')).toBeVisible();
  
  // Move with gizmo (W key + drag)
  await page.keyboard.press('w');
  await page.mouse.move(300, 300);
  await page.mouse.down();
  await page.mouse.move(400, 300);
  await page.mouse.up();
  
  // Verify position changed
  const props = page.locator('text=Position');
  await expect(props).toContainText('1.00'); // Approximate
  
  // Undo
  await page.keyboard.press('Control+z');
  await expect(props).toContainText('-0.85');
  
  // Exploded view
  await page.keyboard.press('x');
  await expect(page.locator('text=EXPLODED VIEW')).toBeVisible();
  
  // Save configuration
  await page.click('button:has-text("Save")');
  await page.fill('input[name="name"]', 'Test Config');
  await page.click('button:has-text("Confirm")');
  
  // Verify in Command Centre
  await page.goto('/');
  await expect(page.locator('text=Test Config')).toBeVisible();
});
```

---

## 10. DEPLOYMENT & CI/CD

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist }

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env: { PLAYWRIGHT_BASE_URL: http://localhost:4173 }
      - run: npx serve -s dist -l 4173 &
```

### 10.2 Performance Monitoring

```typescript
// src/utils/performance.ts
export function measureRenderFrame(): void {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'frame') {
        const fps = 1000 / entry.duration;
        if (fps < 30) console.warn(`Low FPS: ${fps.toFixed(1)}`);
        // Send to analytics
      }
    }
  });
  observer.observe({ type: 'frame', buffered: true });
}

// Bundle analysis
// npm run build && npx vite-bundle-analyzer dist
```

---

## 11. MILESTONE DELIVERY CHECKLIST

### M04 Engineering Tools
- [ ] Parent-child transform system working
- [ ] Configuration save/load/import/export
- [ ] Component library with add/remove
- [ ] Sensor placement system
- [ ] Component isolation mode
- [ ] Exploded view animation
- [ ] Measurement tools
- [ ] Section/clipping plane
- [ ] Visual identity polish
- [ ] All tests pass, build succeeds

### M05 Gesture Control
- [ ] MediaPipe hand tracker initializes
- [ ] 7 gestures recognized with >85% accuracy
- [ ] Command mapper connects to 3D engine
- [ ] Calibration UI functional
- [ ] Mouse/keyboard fallback works
- [ ] Webcam indicator in status bar
- [ ] No memory leaks (webcam tracks stop)

### M06 Digital Twin
- [ ] Motor simulation (start/stop/RPM control)
- [ ] Shaft + load disc rotation animation
- [ ] 5 sensor types simulating
- [ ] 4 fault types activatable
- [ ] Visual feedback on faults
- [ ] Sensor readouts update in real-time
- [ ] Simulation runs at 60 FPS on laptop

### M07 Analytics
- [ ] 4 streaming charts (RPM, vibration, temp, current)
- [ ] Time window selector
- [ ] Fault markers on charts
- [ ] Health dashboard
- [ ] CSV export
- [ ] Charts update at 1Hz during simulation

### M08 Integration
- [ ] All milestones work together
- [ ] Playwright E2E: 10 critical journeys pass
- [ ] Performance budgets met
- [ ] Accessibility audit passes
- [ ] Documentation updated
- [ ] Release build tagged

---

## 12. FILE STRUCTURE AT M08 COMPLETION

```
src/
├── app/
│   ├── App.tsx
│   ├── Shell.tsx
│   └── sections.ts
├── components/
│   ├── StudioToolbar.tsx
│   ├── HierarchyPanel.tsx
│   ├── PropertiesPanel.tsx
│   ├── SensorPlacement.tsx
│   ├── ComponentPalette.tsx
│   ├── MeasurementTools.tsx
│   ├── FaultPanel.tsx
│   └── GestureSettings.tsx
├── engine/
│   ├── Viewport.tsx
│   ├── Scene.tsx
│   ├── CameraRig.tsx
│   ├── ComponentNode.tsx
│   ├── SelectionBox.tsx
│   ├── SensorNode.tsx
│   ├── MeasurementOverlay.tsx
│   ├── ClippingPlaneGizmo.tsx
│   └── GLTFModel.tsx
├── machinery/
│   ├── defaultAssembly.ts
│   ├── geometry.tsx
│   ├── materials.ts
│   ├── componentLibrary.ts
│   ├── assetLoader.ts
│   └── sensorDefinitions.ts
├── pages/
│   ├── EngineeringStudio.tsx
│   ├── CommandCentre.tsx
│   ├── AssemblyLab.tsx
│   ├── SensorMappingPage.tsx
│   ├── GestureLab.tsx
│   ├── DigitalTwinPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── ConfigurationPage.tsx
│   └── NotBuilt.tsx
├── store/
│   ├── assemblyStore.ts
│   ├── viewStore.ts
│   ├── gestureStore.ts
│   └── simulationStore.ts
├── gestures/
│   ├── handTracker.ts
│   ├── gestureRecognizer.ts
│   ├── commandMapper.ts
│   └── calibration.ts
├── digital-twin/
│   ├── simulationEngine.ts
│   ├── sensorSimulation.ts
│   ├── faultSystem.ts
│   └── types.ts
├── analytics/
│   ├── Chart.tsx
│   ├── dataPipeline.ts
│   └── types.ts
├── services/
│   ├── configPersistence.ts
│   └── export.ts
├── engineering/
│   └── constraints.ts
├── types/
│   ├── index.ts
│   └── sensors.ts
├── hooks/
│   ├── useStudioShortcuts.ts
│   ├── useGestureInteraction.ts
│   └── useSimulation.ts
└── styles/
    └── index.css
```

---

## 13. DECISION LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-31 | Keep Zustand for all stores | Consistent, performant, TypeScript-friendly |
| 2026-10-31 | Use uPlot for charts | Minimal bundle, Canvas-based, excellent streaming |
| 2026-10-31 | MediaPipe Tasks Vision for gestures | Official Google library, WASM accelerated, no ML expertise needed |
| 2026-10-31 | Web Workers for simulation/gestures | Keep main thread free for rendering |
| 2026-10-31 | Local transforms + optional moveWithParent | Backward compatible, supports both flat and hierarchical |
| 2026-10-31 | IndexedDB for config persistence | Larger than localStorage, async, queryable |
| 2026-10-31 | GLB with material override | Preserve ARGUS visual identity regardless of source assets |

---

**END OF TECHNICAL ROADMAP**

This document provides implementation-ready specifications. Each section can be assigned to a developer with clear acceptance criteria.