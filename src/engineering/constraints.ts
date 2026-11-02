import * as THREE from 'three';
import type { MachineComponent, Vec3 } from '@/types';

export type ConstraintType = 'coincident' | 'concentric' | 'parallel' | 'distance' | 'angle';

export interface Constraint {
  id: string;
  type: ConstraintType;
  componentA: string;
  componentB: string;
  faceA?: string;
  faceB?: string;
  axisA?: Vec3;
  axisB?: Vec3;
  distance?: number;
  angle?: number;
  enabled: boolean;
}

export class ConstraintSolver {
  private constraints: Constraint[] = [];
  private components: Map<string, MachineComponent> = new Map();
  private maxIterations = 10;
  private tolerance = 1e-4;

  addComponent(component: MachineComponent): void {
    this.components.set(component.id, component);
  }

  removeComponent(id: string): void {
    this.components.delete(id);
    this.constraints = this.constraints.filter(c => c.componentA !== id && c.componentB !== id);
  }

  addConstraint(constraint: Constraint): void {
    this.constraints.push({ ...constraint, enabled: true });
  }

  removeConstraint(id: string): void {
    this.constraints = this.constraints.filter(c => c.id !== id);
  }

  solve(): { satisfied: number; violations: number } {
    let satisfied = 0;
    let violations = 0;

    for (let iter = 0; iter < this.maxIterations; iter++) {
      let maxError = 0;

      for (const constraint of this.constraints) {
        if (!constraint.enabled) continue;

        const compA = this.components.get(constraint.componentA);
        const compB = this.components.get(constraint.componentB);
        if (!compA || !compB) continue;

        const error = this.evaluateConstraint(constraint, compA, compB);
        maxError = Math.max(maxError, Math.abs(error));

        if (Math.abs(error) < this.tolerance) {
          satisfied++;
        } else {
          violations++;
          this.applyCorrection(constraint, compA, compB, error);
        }
      }

      if (maxError < this.tolerance) break;
    }

    return { satisfied, violations };
  }

  private evaluateConstraint(constraint: Constraint, compA: MachineComponent, compB: MachineComponent): number {
    const posA = new THREE.Vector3(...compA.position);
    const posB = new THREE.Vector3(...compB.position);

    switch (constraint.type) {
      case 'coincident':
        return posA.distanceTo(posB);
      case 'concentric':
        // Distance between axes
        return posA.distanceTo(posB);
      case 'parallel':
        // Angle between axes
        const axisA = new THREE.Vector3(...(constraint.axisA || [1, 0, 0]));
        const axisB = new THREE.Vector3(...(constraint.axisB || [1, 0, 0]));
        return Math.acos(Math.min(1, Math.max(-1, axisA.dot(axisB))));
      case 'distance':
        return posA.distanceTo(posB) - (constraint.distance || 0);
      case 'angle':
        // Angle between two faces/axes
        const axis1 = new THREE.Vector3(...(constraint.axisA || [1, 0, 0]));
        const axis2 = new THREE.Vector3(...(constraint.axisB || [1, 0, 0]));
        const currentAngle = Math.acos(Math.min(1, Math.max(-1, axis1.dot(axis2))));
        return currentAngle - (constraint.angle || 0);
      default:
        return 0;
    }
  }

  private applyCorrection(_constraint: Constraint, compA: MachineComponent, compB: MachineComponent, error: number): void {
    const posA = new THREE.Vector3(...compA.position);
    const posB = new THREE.Vector3(...compB.position);
    const direction = posB.clone().sub(posA).normalize();

    const correction = direction.multiplyScalar(error * 0.5);

    // Apply half correction to each (if not locked)
    if (!compA.locked) {
      compA.position[0] += correction.x;
      compA.position[1] += correction.y;
      compA.position[2] += correction.z;
    }
    if (!compB.locked) {
      compB.position[0] -= correction.x;
      compB.position[1] -= correction.y;
      compB.position[2] -= correction.z;
    }
  }

  getConstraints(): Constraint[] {
    return [...this.constraints];
  }
}

export function createDefaultConstraints(components: MachineComponent[]): Constraint[] {
  const constraints: Constraint[] = [];
  
  // Example: Coupling concentric with shaft
  const shaft = components.find(c => c.type === 'shaft');
  const coupling = components.find(c => c.type === 'coupling');
  if (shaft && coupling) {
    constraints.push({
      id: `constraint-${shaft.id}-${coupling.id}`,
      type: 'concentric',
      componentA: shaft.id,
      componentB: coupling.id,
      enabled: true,
    });
  }

  return constraints;
}