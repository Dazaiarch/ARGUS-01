import { create } from 'zustand';
import type { ChartDataPoint, Fault } from '@/types';

interface DataPipelineState {
  buffer: ChartDataPoint[];
  maxPoints: number;
  downsample: 'none' | 'minmax' | 'avg';
  faults: Fault[];
  
  addReading: (timestamp: number, readings: Record<string, number>) => void;
  addFault: (fault: any) => void;
  clearFault: (id: string) => void;
  setMaxPoints: (n: number) => void;
  setDownsample: (mode: DataPipelineState['downsample']) => void;
  getData: (timeWindow: number, _sensors: string[]) => ChartDataPoint[];
}

const MAX_BUFFER = 3600; // 1 hour at 1Hz

export const useDataPipeline = create<DataPipelineState>((set, get) => ({
  buffer: [],
  maxPoints: MAX_BUFFER,
  downsample: 'none',
  faults: [],

  addReading: (timestamp, readings) => {
    const point: ChartDataPoint = { t: timestamp, ...readings };
    set((state) => {
      const newBuffer = [...state.buffer, point];
      if (newBuffer.length > state.maxPoints) {
        return { buffer: newBuffer.slice(-state.maxPoints) };
      }
      return { buffer: newBuffer };
    });
  },

  addFault: (fault) =>
    set((state) => ({ faults: [...state.faults, fault] })),

  clearFault: (id) =>
    set((state) => ({ faults: state.faults.filter(f => f.id !== id) })),

  setMaxPoints: (n) => set({ maxPoints: n }),

  setDownsample: (mode) => set({ downsample: mode }),

  getData: (timeWindow, _sensors) => {
    const { buffer, downsample } = get();
    const cutoff = Date.now() / 1000 - timeWindow;
    const filtered = buffer.filter(p => p.t >= cutoff);

    if (downsample === 'none' || filtered.length <= 1000) {
      return filtered;
    }

    // Min-max downsampling for large datasets
    const targetPoints = 1000;
    const step = Math.ceil(filtered.length / targetPoints);
    const result: ChartDataPoint[] = [];

    for (let i = 0; i < filtered.length; i += step) {
      const chunk = filtered.slice(i, i + step);
      if (chunk.length === 0) continue;

      const point: ChartDataPoint = { t: chunk[0].t };
      // Use a simple sensor list instead of getSensors
      const sensorKeys = Object.keys(chunk[0]).filter(k => k !== 't');
      
      for (const sensor of sensorKeys) {
        const values = chunk.map(p => p[sensor]).filter(v => v !== null && v !== undefined) as number[];
        if (values.length === 0) continue;

        (point as any)[sensor + '_min'] = Math.min(...values);
        (point as any)[sensor + '_max'] = Math.max(...values);
      }
      result.push(point);
    }

    return result;
  },
}));

export function useDataPipelineSelector<T>(selector: (state: any) => T): T {
  return (import('@/analytics/dataPipeline').then(m => m.useDataPipeline) as any)(selector);
}