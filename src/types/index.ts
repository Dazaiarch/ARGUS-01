export type Vec3 = [number, number, number];

export interface WorldTransform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface ClippingPlane {
  enabled: boolean;
  normal: Vec3;
  constant: number;
  color: string;
}

export type SensorType = 
  | 'vibration'
  | 'temperature'
  | 'rpm'
  | 'current'
  | 'acoustic'
  | 'pressure'
  | 'oil-temperature'
  | 'oil-pressure'
  | 'displacement'
  | 'torque'
  | 'strain'
  | 'speed'
  | 'power'
  | 'voltage'
  | 'power-factor';

export interface SensorDefinition {
  type: SensorType;
  label: string;
  unit: string;
  icon: string;
  color: string;
  defaultRange: [number, number];
  frequencyRange?: [number, number];
  description: string;
  category: 'mechanical' | 'electrical' | 'thermal' | 'fluid' | 'vibration';
  applicableComponents: string[];
  standardMounting?: string;
  typicalSamplingRate?: number;
  criticalThresholds?: {
    warning: number;
    danger: number;
    unit: string;
  };
}

export interface SensorCalibration {
  offset: number;
  scale: number;
  lastCalibrated: string;
  calibratedBy?: string;
}

export interface VirtualSensor {
  id: string;
  definition: SensorDefinition;
  componentId: string;
  localPosition: Vec3;
  localRotation: Vec3;
  visible: boolean;
  locked: boolean;
  calibration?: SensorCalibration;
  cableRoute?: Vec3[];
  metadata?: Record<string, unknown>;
}

export interface SensorPlacementState {
  active: boolean;
  sensorType: SensorType | null;
  ghostPosition: Vec3 | null;
  ghostRotation: Vec3 | null;
  targetComponentId: string | null;
  previewVisible: boolean;
}

export type ComponentType =
  | 'motor'
  | 'mounting-plate'
  | 'shaft'
  | 'coupling'
  | 'bearing-housing'
  | 'bearing'
  | 'base-frame'
  | 'load-disc'
  | 'sensor-mount';

export type ComponentStatus = 'healthy' | 'warning' | 'fault' | 'offline';

export type MaterialKey = 'steel' | 'aluminium' | 'cast-iron' | 'rubber-steel' | 'copper-steel';

export interface Dimensions {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  length?: number;
}

export interface MachineComponent {
  id: string;
  name: string;
  type: ComponentType;
  category: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  localPosition: Vec3;
  localRotation: Vec3;
  localScale: Vec3;
  moveWithParent: boolean;
  dimensions: Dimensions;
  material: MaterialKey;
  status: ComponentStatus;
  visible: boolean;
  locked: boolean;
  parentId: string | null;
  explodeVector: Vec3;
  provisional: boolean;
  dimensionsVerified: boolean;
  scaleConstrained: boolean;
  sensorIds: string[];
}

export type ViewPreset = 'perspective' | 'orthographic' | 'front' | 'side' | 'top' | 'isometric';
export type TransformMode = 'translate' | 'rotate' | 'scale';
export type SectionId =
  | 'command-centre'
  | 'engineering-studio'
  | 'gesture-lab'
  | 'assembly-lab'
  | 'digital-twin'
  | 'sensor-mapping'
  | 'analytics'
  | 'project-configuration';

export type GestureType = 
  | 'open-palm'
  | 'pinch'
  | 'two-hand-zoom'
  | 'two-hand-rotate'
  | 'swipe-left'
  | 'swipe-right'
  | 'fist'
  | 'three-fingers'
  | 'open-palm-held'
  | 'rotate';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  handedness: 'Left' | 'Right';
  landmarks: HandLandmark[];
  confidence: number;
  timestamp: number;
}

export interface GestureData {
  pinchDistance?: number;
  palmNormal?: Vec3;
  handVelocity?: Vec3;
  fingerStates?: boolean[];
  twoHandDistance?: number;
  twoHandAngle?: number;
  twoHandDistanceDelta?: number;
  twoHandAngleDelta?: number;
}

export interface RecognizedGesture {
  type: GestureType;
  hand: 'Left' | 'Right' | 'Both';
  confidence: number;
  data: GestureData;
  timestamp: number;
}

export interface ChartDataPoint {
  t: number;
  [key: string]: number;
}

export interface ChartConfig {
  id: string;
  title: string;
  sensors: string[];
  timeWindow: number;
  downsample: 'none' | 'minmax' | 'avg';
  yAxis: 'linear' | 'log';
}

export interface SensorReading {
  sensorId: string;
  value: number;
  timestamp: number;
  quality: 'good' | 'degraded' | 'bad';
}

export interface Fault {
  id: string;
  type: FaultType;
  componentId: string;
  severity: number;
  activatedAt: number;
  deactivatedAt?: number;
  parameters?: Record<string, unknown>;
}

export type FaultType = 'imbalance' | 'misalignment' | 'bearing-defect' | 'overheating';

export interface SimulationState {
  motor: MotorState;
  shaft: ShaftState;
  sensors: Record<string, SensorReading>;
  faults: Fault[];
  components: MachineComponent[];
  time: number;
  speed: number;
}

export interface MotorState {
  running: boolean;
  targetRpm: number;
  currentRpm: number;
  acceleration: number;
  inertia: number;
  torque: number;
}

export interface ShaftState {
  angle: number;
  angularVelocity: number;
  angularAcceleration: number;
}

export interface SavedConfiguration {
  version: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  components: MachineComponent[];
  sensors: VirtualSensor[];
  viewState: any;
}