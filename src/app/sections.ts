import type { SectionId } from '@/types';

export interface SectionDef {
  id: SectionId;
  path: string;
  code: string;
  label: string;
  /** Milestone in which the section becomes functional. */
  milestone: number;
  summary: string;
}

export const SECTIONS: SectionDef[] = [
  { id: 'command-centre', path: '/', code: 'CC', label: 'Command Centre', milestone: 1, summary: 'System overview and quick access.' },
  { id: 'engineering-studio', path: '/studio', code: 'ES', label: 'Engineering Studio', milestone: 2, summary: 'Interactive 3D viewport for the ARGUS machinery.' },
  { id: 'gesture-lab', path: '/gesture-lab', code: 'GL', label: 'Gesture Lab', milestone: 5, summary: 'Webcam hand tracking, gesture mapping and calibration.' },
  { id: 'assembly-lab', path: '/assembly-lab', code: 'AL', label: 'Assembly Lab', milestone: 4, summary: 'Component library, add/remove, assemble and disassemble.' },
  { id: 'digital-twin', path: '/digital-twin', code: 'DT', label: 'Digital Twin', milestone: 6, summary: 'Motor simulation, simulated sensors and fault scenarios.' },
  { id: 'sensor-mapping', path: '/sensor-mapping', code: 'SM', label: 'Sensor Mapping', milestone: 4, summary: 'Place and configure virtual sensors on the machinery.' },
  { id: 'analytics', path: '/analytics', code: 'AN', label: 'Analytics', milestone: 7, summary: 'Charts of simulated RPM, temperature, vibration and current.' },
  { id: 'project-configuration', path: '/configuration', code: 'PC', label: 'Project Configuration', milestone: 4, summary: 'Save, load, import and export engineering configurations.' },
];

/** Milestones completed in the current build. Update when a milestone is verified. */
export const COMPLETED_MILESTONES = [1, 2, 3, 4, 5, 6, 7];

export const MILESTONES: { n: number; title: string }[] = [
  { n: 1, title: 'Foundation' },
  { n: 2, title: '3D engine' },
  { n: 3, title: 'Machinery' },
  { n: 4, title: 'Engineering tools' },
  { n: 5, title: 'Gesture control' },
  { n: 6, title: 'Digital twin' },
  { n: 7, title: 'Analytics' },
  { n: 8, title: 'Integration' },
];
