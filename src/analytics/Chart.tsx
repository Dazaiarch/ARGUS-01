import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { ChartConfig, ChartDataPoint, Fault } from '@/types';

interface Props {
  config: ChartConfig;
  data: ChartDataPoint[];
  faults: Fault[];
  height: number;
  onCursor: (point: ChartDataPoint | null) => void;
}

export function Chart({ config, data, faults, height, onCursor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const series: any[] = [
      { 
        label: 'Time', 
        value: (_u: uPlot, i: number) => new Date(data[i].t * 1000).toLocaleTimeString() 
      },
      ...config.sensors.map(sensorId => ({
        label: sensorId,
        value: (_u: uPlot, i: number) => data[i][sensorId]?.toFixed(2) ?? '—',
        stroke: sensorColor(sensorId),
        width: 1.5,
        paths: uPlot.paths.linear,
      })),
    ];

    const faultPoints: any[] = faults.map(f => {
      return {
        label: f.type,
        show: true,
        points: { show: true, size: 6, stroke: 'red', fill: 'red' },
        paths: uPlot.paths.points,
        data: data.map((d) => faults.some(f => f.activatedAt <= d.t && (!f.deactivatedAt || f.deactivatedAt >= d.t) && f.componentId === (d as any).componentId) ? d[f.type] ?? null : null),
      };
    });

    const opts: any = {
      title: config.title,
      width: containerRef.current?.clientWidth ?? 600,
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
          (u: any) => {
            const xMin = u.scales.x.min;
            if (xMin === undefined) return;
            faults.forEach(f => {
              if (f.activatedAt && (!f.deactivatedAt || f.deactivatedAt > xMin)) {
                const x1 = (u as any).pos.fwd(f.activatedAt);
                const x2 = f.deactivatedAt ? (u as any).pos.fwd(f.deactivatedAt) : u.bbox.width;
                u.ctx.fillStyle = 'rgba(229, 83, 75, 0.1)';
                u.ctx.fillRect(x1, 0, x2 - x1, u.bbox.height);
              }
            });
          },
        ],
      },
    };

    const alignedData = transformData(data, config.sensors);
    uplotRef.current = new uPlot(opts, alignedData as any, containerRef.current);

    const handleCursor = (u: any) => {
      const idx = u.cursor.idx;
      if (idx !== null && idx !== undefined && idx >= 0 && idx < data.length) {
        onCursor(data[idx]);
      } else {
        onCursor(null);
      }
    };

    uplotRef.current?.hooks.setCursor?.push(handleCursor);

    return () => {
      uplotRef.current?.destroy();
      uplotRef.current = null;
    };
  }, [config, data, faults, height]);

  return <div ref={containerRef} style={{ width: '100%' }} />;
}

function transformData(data: ChartDataPoint[], sensors: string[]): any[] {
  const series: (number | null)[][] = [data.map(d => d.t * 1000)];
  for (const s of sensors) {
    series.push(data.map(d => d[s] ?? null));
  }
  return series;
}

function sensorColor(sensorId: string): string {
  const colors = ['#38d1e8', '#e3b341', '#4cc38a', '#e5534b', '#4f7cc4', '#8a6a4a'];
  let hash = 0;
  for (let i = 0; i < sensorId.length; i++) {
    hash = ((hash << 5) - hash) + sensorId.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}