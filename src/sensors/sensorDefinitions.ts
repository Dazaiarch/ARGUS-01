import type { Vec3 } from '@/types';

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
  typicalSamplingRate?: number; // Hz
  criticalThresholds?: {
    warning: number;
    danger: number;
    unit: string;
  };
}

export const SENSOR_DEFINITIONS: Record<SensorType, SensorDefinition> = {
  vibration: {
    type: 'vibration',
    label: 'Vibration (Accelerometer)',
    unit: 'mm/s RMS',
    icon: '📳',
    color: '#38d1e8',
    defaultRange: [0, 50],
    frequencyRange: [10, 10000],
    description: 'Triaxial accelerometer for bearing and shaft vibration monitoring. Detects imbalance, misalignment, bearing defects, and resonance.',
    category: 'vibration',
    applicableComponents: ['motor', 'shaft', 'bearing-housing', 'coupling', 'load-disc', 'bearing'],
    standardMounting: 'M8 stud or magnetic mount on bearing housing',
    typicalSamplingRate: 25600,
    criticalThresholds: {
      warning: 4.5,
      danger: 7.1,
      unit: 'mm/s RMS',
    },
  },
  temperature: {
    type: 'temperature',
    label: 'Temperature (RTD/Thermocouple)',
    unit: '°C',
    icon: '🌡️',
    color: '#e3b341',
    defaultRange: [-20, 200],
    description: 'RTD (PT100) or Type K thermocouple for bearing, motor winding, and oil temperature monitoring.',
    category: 'thermal',
    applicableComponents: ['motor', 'bearing-housing', 'bearing', 'load-disc'],
    standardMounting: 'Thermowell or surface mount with thermal paste',
    typicalSamplingRate: 10,
    criticalThresholds: {
      warning: 80,
      danger: 100,
      unit: '°C',
    },
  },
  rpm: {
    type: 'rpm',
    label: 'Speed (Encoder/Tacho)',
    unit: 'RPM',
    icon: '🔄',
    color: '#4f7cc4',
    defaultRange: [0, 6000],
    description: 'Incremental encoder or magnetic pickup for precise shaft speed and direction monitoring.',
    category: 'mechanical',
    applicableComponents: ['motor', 'shaft', 'load-disc'],
    standardMounting: 'Shaft-end encoder or magnetic pickup on keyway',
    typicalSamplingRate: 1000,
    criticalThresholds: {
      warning: 3600,
      danger: 3800,
      unit: 'RPM',
    },
  },
  current: {
    type: 'current',
    label: 'Motor Current (CT)',
    unit: 'A RMS',
    icon: '⚡',
    color: '#e5534b',
    defaultRange: [0, 200],
    description: 'Clamp-on or inline current transformer for motor load and fault current monitoring.',
    category: 'electrical',
    applicableComponents: ['motor'],
    standardMounting: 'Split-core CT on motor phase conductor',
    typicalSamplingRate: 5000,
    criticalThresholds: {
      warning: 150,
      danger: 180,
      unit: 'A RMS',
    },
  },
  acoustic: {
    type: 'acoustic',
    label: 'Acoustic Emission / Noise',
    unit: 'dB SPL',
    icon: '🔊',
    color: '#4cc38a',
    defaultRange: [30, 140],
    frequencyRange: [20, 20000],
    description: 'Microphone or AE sensor for airborne noise, cavitation, and bearing tone detection.',
    category: 'vibration',
    applicableComponents: ['motor', 'pump', 'bearing-housing', 'valve'],
    standardMounting: 'Surface mount with acoustic couplant',
    typicalSamplingRate: 51200,
    criticalThresholds: {
      warning: 85,
      danger: 100,
      unit: 'dB SPL',
    },
  },
  pressure: {
    type: 'pressure',
    label: 'Pressure (Transducer)',
    unit: 'bar',
    icon: '📊',
    color: '#8a6a4a',
    defaultRange: [0, 400],
    description: 'Piezoelectric or strain-gauge pressure transducer for hydraulic, lubrication, and process pressure.',
    category: 'fluid',
    applicableComponents: ['pump', 'valve', 'filter', 'lubrication-system'],
    standardMounting: 'G1/4 or 1/4 NPT port with seal',
    typicalSamplingRate: 1000,
    criticalThresholds: {
      warning: 250,
      danger: 350,
      unit: 'bar',
    },
  },
  'oil-temperature': {
    type: 'oil-temperature',
    label: 'Oil Temperature (RTD)',
    unit: '°C',
    icon: '🛢️',
    color: '#e3b341',
    defaultRange: [-20, 150],
    description: 'Oil sump and supply line temperature for lubrication system health monitoring.',
    category: 'thermal',
    applicableComponents: ['lubrication-system', 'bearing-housing', 'gearbox'],
    standardMounting: 'Thermowell in oil sump or supply line',
    typicalSamplingRate: 10,
    criticalThresholds: {
      warning: 70,
      danger: 90,
      unit: '°C',
    },
  },
  'oil-pressure': {
    type: 'oil-pressure',
    label: 'Oil Pressure (Transducer)',
    unit: 'bar',
    icon: '🛢️',
    color: '#8a6a4a',
    defaultRange: [0, 20],
    description: 'Lubrication oil supply pressure for bearing and gear protection.',
    category: 'fluid',
    applicableComponents: ['lubrication-system', 'bearing-housing', 'gearbox'],
    standardMounting: 'G1/4 port on oil manifold or filter housing',
    typicalSamplingRate: 1000,
    criticalThresholds: {
      warning: 1.5,
      danger: 1.0,
      unit: 'bar',
    },
  },
  displacement: {
    type: 'displacement',
    label: 'Shaft Displacement (Proximity Probe)',
    unit: 'µm',
    icon: '📏',
    color: '#4f7cc4',
    defaultRange: [0, 500],
    description: 'Eddy current proximity probe for radial shaft vibration, axial position, and orbit analysis.',
    category: 'mechanical',
    applicableComponents: ['shaft', 'rotor', 'turbine', 'compressor'],
    standardMounting: 'Proximity probe mount with 5mm or 8mm probe',
    typicalSamplingRate: 25600,
    criticalThresholds: {
      warning: 100,
      danger: 200,
      unit: 'µm',
    },
  },
  torque: {
    type: 'torque',
    label: 'Torque (Rotary Transducer)',
    unit: 'Nm',
    icon: '🔧',
    color: '#8a6a4a',
    defaultRange: [0, 5000],
    description: 'Rotary torque transducer for shaft power and torsional vibration analysis.',
    category: 'mechanical',
    applicableComponents: ['shaft', 'coupling', 'gearbox'],
    standardMounting: 'In-line between driver and load',
    typicalSamplingRate: 10000,
    criticalThresholds: {
      warning: 4000,
      danger: 4500,
      unit: 'Nm',
    },
  },
  strain: {
    type: 'strain',
    label: 'Strain (Strain Gauge)',
    unit: 'µε',
    icon: '📐',
    color: '#8a6a4a',
    defaultRange: [-5000, 5000],
    description: 'Strain gauge for structural stress, shaft bending, and frame deformation monitoring.',
    category: 'mechanical',
    applicableComponents: ['base-frame', 'motor', 'shaft', 'bearing-housing', 'coupling'],
    standardMounting: 'Bonded foil gauge with wheatstone bridge',
    typicalSamplingRate: 1000,
    criticalThresholds: {
      warning: 2000,
      danger: 4000,
      unit: 'µε',
    },
  },
  speed: {
    type: 'speed',
    label: 'Linear Speed (Encoder)',
    unit: 'm/s',
    icon: '🏃',
    color: '#4f7cc4',
    defaultRange: [0, 50],
    description: 'Linear encoder or tachometer for belt speed, conveyor speed, and linear motion monitoring.',
    category: 'mechanical',
    applicableComponents: ['belt', 'conveyor', 'linear-actuator'],
    standardMounting: 'Wheel encoder on driven roller',
    typicalSamplingRate: 1000,
    criticalThresholds: {
      warning: 30,
      danger: 40,
      unit: 'm/s',
    },
  },
  power: {
    type: 'power',
    label: 'Active Power (Wattmeter)',
    unit: 'kW',
    icon: '⚡',
    color: '#e5534b',
    defaultRange: [0, 500],
    description: 'Three-phase power analyzer for motor efficiency, load profiling, and energy monitoring.',
    category: 'electrical',
    applicableComponents: ['motor', 'vfd', 'transformer'],
    standardMounting: 'Three CTs + three VTs in panel',
    typicalSamplingRate: 5000,
    criticalThresholds: {
      warning: 400,
      danger: 450,
      unit: 'kW',
    },
  },
  voltage: {
    type: 'voltage',
    label: 'Voltage (PT/VT)',
    unit: 'V RMS',
    icon: '🔌',
    color: '#e5534b',
    defaultRange: [0, 1000],
    description: 'Voltage transformer or direct measurement for phase voltage monitoring and power quality.',
    category: 'electrical',
    applicableComponents: ['motor', 'vfd', 'transformer', 'panel'],
    standardMounting: 'VT in panel or direct measurement < 600V',
    typicalSamplingRate: 5000,
    criticalThresholds: {
      warning: 460,
      danger: 500,
      unit: 'V',
    },
  },
  'power-factor': {
    type: 'power-factor',
    label: 'Power Factor',
    unit: 'cos φ',
    icon: '📐',
    color: '#e5534b',
    defaultRange: [0, 1],
    description: 'Power factor for motor loading assessment and power quality monitoring.',
    category: 'electrical',
    applicableComponents: ['motor', 'vfd', 'transformer'],
    standardMounting: 'Calculated from power meter',
    typicalSamplingRate: 5000,
    criticalThresholds: {
      warning: 0.85,
      danger: 0.75,
      unit: 'cos φ',
    },
  },
};

export interface SensorCalibration {
  offset: number;
  scale: number;
  lastCalibrated: string;
  calibratedBy?: string;
  certificateNumber?: string;
  nextCalibrationDue?: string;
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
  processConnection?: {
    plcTag?: string;
    scadaTag?: string;
    historianTag?: string;
    alarmTag?: string;
  };
}

export interface SensorPlacementState {
  active: boolean;
  sensorType: SensorType | null;
  ghostPosition: Vec3 | null;
  ghostRotation: Vec3 | null;
  targetComponentId: string | null;
  previewVisible: boolean;
}

export function createSensorId(existingIds: string[]): string {
  const prefix = 'SNS';
  const used = existingIds
    .filter((id) => id.startsWith(prefix + '-'))
    .map((id) => parseInt(id.slice(prefix.length + 1), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export function getDefaultCalibration(_type: SensorType): SensorCalibration {
  return {
    offset: 0,
    scale: 1,
    lastCalibrated: new Date().toISOString(),
    nextCalibrationDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function getSensorsByCategory(category: SensorDefinition['category']): SensorType[] {
  return Object.entries(SENSOR_DEFINITIONS)
    .filter(([, def]) => def.category === category)
    .map(([type]) => type as SensorType);
}

export function getSensorsForComponent(componentType: string): SensorType[] {
  return Object.entries(SENSOR_DEFINITIONS)
    .filter(([, def]) => def.applicableComponents.includes(componentType))
    .map(([type]) => type as SensorType);
}

export function getSensorsByType(types: SensorType[]): SensorDefinition[] {
  return types.map((t) => SENSOR_DEFINITIONS[t]);
}