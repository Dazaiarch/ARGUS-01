import type { ComponentStatus, MaterialKey } from '@/types';

export interface MaterialSpec {
  label: string;
  color: string;
  metalness: number;
  roughness: number;
}

export const MATERIALS: Record<MaterialKey, MaterialSpec> = {
  steel: { label: 'Steel', color: '#8c97a6', metalness: 0.9, roughness: 0.32 },
  aluminium: { label: 'Aluminium', color: '#b2bcc9', metalness: 0.85, roughness: 0.4 },
  'cast-iron': { label: 'Cast iron', color: '#434b55', metalness: 0.7, roughness: 0.55 },
  'rubber-steel': { label: 'Rubber / steel', color: '#2c3138', metalness: 0.35, roughness: 0.7 },
  'copper-steel': { label: 'Copper / steel', color: '#8a6a4a', metalness: 0.8, roughness: 0.4 },
};

export const STATUS_COLORS: Record<ComponentStatus, string> = {
  healthy: '#4cc38a',
  warning: '#e3b341',
  fault: '#e5534b',
  offline: '#5f6977',
};
