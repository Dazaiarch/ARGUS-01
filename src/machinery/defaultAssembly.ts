import type { MachineComponent } from '@/types';

/**
 * Provisional ARGUS test-rig layout.
 *
 * IMPORTANT: Real ARGUS CAD dimensions have not been supplied. Every value here is a
 * plausible placeholder in metres and is flagged `provisional: true`. Do not read
 * these as engineering-accurate.
 *
 * Coordinate system: right-handed, Y up, metres. The shaft axis runs along +X.
 * The motor sits at -X, the load disc at +X.
 *
 * Hierarchy:
 * - ARGUS-FRM-001 (root)
 *   - ARGUS-MTP-001
 *     - ARGUS-MOT-001
 *       - ARGUS-SNM-003
 *   - ARGUS-BHS-001
 *     - ARGUS-BRG-001
 *     - ARGUS-SNM-001
 *   - ARGUS-BHS-002
 *     - ARGUS-BRG-002
 *     - ARGUS-SNM-002
 * - ARGUS-SHF-001 (root)
 *   - ARGUS-CPL-001
 *   - ARGUS-LDD-001
 */
const base = {
  rotation: [0, 0, 0] as [number, number, number],
  scale: [1, 1, 1] as [number, number, number],
  localPosition: [0, 0, 0] as [number, number, number],
  localRotation: [0, 0, 0] as [number, number, number],
  localScale: [1, 1, 1] as [number, number, number],
  moveWithParent: false,
  status: 'healthy' as const,
  visible: true,
  locked: false,
  provisional: true,
  dimensionsVerified: false,
  scaleConstrained: false,
  sensorIds: [] as string[],
};

export function createDefaultAssembly(): MachineComponent[] {
  return [
    {
      ...base,
      id: 'ARGUS-FRM-001',
      name: 'Mechanical Base Frame',
      type: 'base-frame',
      category: 'Structure',
      position: [0, 0, 0],
      localPosition: [0, 0, 0],
      moveWithParent: false,
      dimensions: { width: 2.4, height: 0.08, depth: 0.7 },
      material: 'cast-iron',
      parentId: null,
      explodeVector: [0, -0.35, 0],
    },
    {
      ...base,
      id: 'ARGUS-MTP-001',
      name: 'Motor Mounting Plate',
      type: 'mounting-plate',
      category: 'Structure',
      position: [-0.85, 0.055, 0],
      localPosition: [-0.85, 0.055, 0],
      moveWithParent: true,
      dimensions: { width: 0.6, height: 0.03, depth: 0.5 },
      material: 'steel',
      parentId: 'ARGUS-FRM-001',
      explodeVector: [-0.2, -0.15, 0],
    },
    {
      ...base,
      id: 'ARGUS-MOT-001',
      name: 'Electric Motor',
      type: 'motor',
      category: 'Drive',
      position: [-0.85, 0.28, 0],
      localPosition: [0, 0.225, 0],
      moveWithParent: true,
      dimensions: { length: 0.5, radius: 0.16 },
      material: 'cast-iron',
      parentId: 'ARGUS-MTP-001',
      explodeVector: [-0.5, 0.25, 0],
    },
    {
      ...base,
      id: 'ARGUS-SHF-001',
      name: 'Drive Shaft',
      type: 'shaft',
      category: 'Drivetrain',
      position: [0.1, 0.28, 0],
      localPosition: [0.1, 0.28, 0],
      moveWithParent: false,
      dimensions: { length: 1.7, radius: 0.025 },
      material: 'steel',
      parentId: null,
      scaleConstrained: true,
      explodeVector: [0, 0.35, 0],
    },
    {
      ...base,
      id: 'ARGUS-CPL-001',
      name: 'Flexible Coupling',
      type: 'coupling',
      category: 'Drivetrain',
      position: [-0.45, 0.28, 0],
      localPosition: [-0.55, 0, 0],
      moveWithParent: true,
      dimensions: { length: 0.14, radius: 0.055 },
      material: 'rubber-steel',
      parentId: 'ARGUS-SHF-001',
      scaleConstrained: true,
      explodeVector: [-0.2, 0.45, 0],
    },
    {
      ...base,
      id: 'ARGUS-BHS-001',
      name: 'Bearing Housing 1',
      type: 'bearing-housing',
      category: 'Support',
      position: [-0.15, 0.15, 0],
      localPosition: [-0.15, 0.15, 0],
      moveWithParent: true,
      dimensions: { width: 0.14, height: 0.22, depth: 0.2 },
      material: 'cast-iron',
      parentId: 'ARGUS-FRM-001',
      explodeVector: [-0.1, 0.2, 0.3],
    },
    {
      ...base,
      id: 'ARGUS-BHS-002',
      name: 'Bearing Housing 2',
      type: 'bearing-housing',
      category: 'Support',
      position: [0.55, 0.15, 0],
      localPosition: [0.55, 0.15, 0],
      moveWithParent: true,
      dimensions: { width: 0.14, height: 0.22, depth: 0.2 },
      material: 'cast-iron',
      parentId: 'ARGUS-FRM-001',
      explodeVector: [0.1, 0.2, 0.3],
    },
    {
      ...base,
      id: 'ARGUS-BRG-001',
      name: 'Bearing Assembly 1',
      type: 'bearing',
      category: 'Support',
      position: [-0.15, 0.28, 0],
      localPosition: [0, 0.13, 0],
      moveWithParent: true,
      dimensions: { length: 0.05, radius: 0.052 },
      material: 'steel',
      parentId: 'ARGUS-BHS-001',
      scaleConstrained: true,
      explodeVector: [0, 0.55, -0.3],
    },
    {
      ...base,
      id: 'ARGUS-BRG-002',
      name: 'Bearing Assembly 2',
      type: 'bearing',
      category: 'Support',
      position: [0.55, 0.28, 0],
      localPosition: [0, 0.13, 0],
      moveWithParent: true,
      dimensions: { length: 0.05, radius: 0.052 },
      material: 'steel',
      parentId: 'ARGUS-BHS-002',
      scaleConstrained: true,
      explodeVector: [0, 0.55, -0.3],
    },
    {
      ...base,
      id: 'ARGUS-LDD-001',
      name: 'Rotating Load Disc',
      type: 'load-disc',
      category: 'Load',
      position: [0.95, 0.28, 0],
      localPosition: [0.85, 0, 0],
      moveWithParent: true,
      dimensions: { length: 0.04, radius: 0.2 },
      material: 'steel',
      parentId: 'ARGUS-SHF-001',
      explodeVector: [0.5, 0.25, 0],
    },
    {
      ...base,
      id: 'ARGUS-SNM-001',
      name: 'Sensor Mount A (Bearing 1)',
      type: 'sensor-mount',
      category: 'Instrumentation',
      position: [-0.15, 0.38, 0],
      localPosition: [0, 0.23, 0],
      moveWithParent: true,
      dimensions: { width: 0.04, height: 0.02, depth: 0.04 },
      material: 'aluminium',
      parentId: 'ARGUS-BHS-001',
      explodeVector: [0, 0.7, 0],
    },
    {
      ...base,
      id: 'ARGUS-SNM-002',
      name: 'Sensor Mount B (Bearing 2)',
      type: 'sensor-mount',
      category: 'Instrumentation',
      position: [0.55, 0.38, 0],
      localPosition: [0, 0.23, 0],
      moveWithParent: true,
      dimensions: { width: 0.04, height: 0.02, depth: 0.04 },
      material: 'aluminium',
      parentId: 'ARGUS-BHS-002',
      explodeVector: [0, 0.7, 0],
    },
    {
      ...base,
      id: 'ARGUS-SNM-003',
      name: 'Sensor Mount C (Motor)',
      type: 'sensor-mount',
      category: 'Instrumentation',
      position: [-0.85, 0.45, 0],
      localPosition: [0, 0.17, 0],
      moveWithParent: true,
      dimensions: { width: 0.04, height: 0.02, depth: 0.04 },
      material: 'aluminium',
      parentId: 'ARGUS-MOT-001',
      explodeVector: [-0.2, 0.7, 0],
    },
  ];
}