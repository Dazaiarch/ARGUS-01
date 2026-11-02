import { useState, useEffect } from 'react';
import { useAssemblyStore } from '@/store/assemblyStore';
import { StudioToolbar } from '@/components/StudioToolbar';
import { Chart } from '@/analytics/Chart';
import { useDataPipeline } from '@/analytics/dataPipeline';
import { SimulationEngine, createInitialState } from '@/digital-twin/simulationEngine';

const SENSOR_CATEGORIES = [
  { id: 'vibration', label: 'Vibration Analysis', sensors: ['vibration', 'acoustic', 'displacement'] as const, color: '#38d1e8', icon: '📳' },
  { id: 'mechanical', label: 'Mechanical Health', sensors: ['rpm', 'speed', 'torque', 'displacement'] as const, color: '#4f7cc4', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', sensors: ['current', 'voltage', 'power', 'power-factor'] as const, color: '#e5534b', icon: '⚡' },
  { id: 'thermal', label: 'Thermal', sensors: ['temperature', 'oil-temperature'] as const, color: '#e3b341', icon: '🌡️' },
  { id: 'fluid', label: 'Fluid Systems', sensors: ['pressure', 'oil-pressure'] as const, color: '#8a6a4a', icon: '🛢️' },
  { id: 'structural', label: 'Structural', sensors: ['strain'] as const, color: '#8a6a4a', icon: '📐' },
];

export default function AnalyticsPage() {
  const [simulation] = useState(() => new SimulationEngine(createInitialState()));
  const [timeWindow, setTimeWindow] = useState(300);
  const [paused, setPaused] = useState(false);
  const [cursorData, setCursorData] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['vibration', 'mechanical', 'electrical', 'thermal', 'fluid']);
  const [showFaultMarkers, setShowFaultMarkers] = useState(true);

  const sensors = useAssemblyStore((s) => s.sensors);

  // Feed simulation data to pipeline
  useEffect(() => {
    const unsubscribe = simulation.subscribe((state) => {
      const pipeline = require('@/analytics/dataPipeline').useDataPipeline.getState();
      const readings: Record<string, number> = {};
      for (const [id, reading] of Object.entries(state.sensors)) {
        readings[id] = reading.value;
      }
      pipeline.addReading(state.time, readings);
      
      // Sync faults
      const newFaults = state.faults.filter((f) => !pipeline.faults.some((f2: any) => f2.id === f.id));
      newFaults.forEach((f) => pipeline.addFault(f));
    });
    return unsubscribe;
  }, []);

  // Get chart data from pipeline
  const sensorIds = useAssemblyStore((s) => s.sensors.map((s) => s.id));
  const chartData = useDataPipeline((s) => s.getData(300, sensorIds));

  // Build chart configs based on selected categories
  const charts = SENSOR_CATEGORIES
    .filter((g) => selectedCategories.includes(g.id))
    .map((group) => {
      const matchingSensors = sensors.filter((s) => (group.sensors as readonly string[]).includes(s.definition.type));
      return {
        id: group.id,
        label: group.label,
        icon: group.icon,
        color: group.color,
        sensors: matchingSensors.map((s) => s.id),
        config: {
          id: group.id,
          title: group.label,
          sensors: matchingSensors.map((s) => s.id),
          timeWindow,
          downsample: 'none',
          yAxis: 'linear',
        } as any,
      };
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioToolbar />
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <div className="p-3 border-b border-line-soft bg-graphite">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="label">Time Window</span>
                <select
                  className="field text-sm"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(parseInt(e.target.value))}
                >
                  <option value="60">1 min</option>
                  <option value="300">5 min</option>
                  <option value="900">15 min</option>
                  <option value="3600">1 hour</option>
                  <option value="14400">4 hour</option>
                  <option value="86400">24 hour</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={paused}
                    onChange={(e) => setPaused(e.target.checked)}
                    className="accent-cyan"
                  />
                  <span className="text-xs text-ink-dim">Pause</span>
                </label>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="mono text-[10px] text-ink-dim">
                  {cursorData ? `t=${cursorData.t.toFixed(1)}s` : 'Hover chart for values'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-ink-dim">
              {SENSOR_CATEGORIES.map((group) => (
                <label key={group.id} className="flex items-center gap-1 px-2 py-0.5 rounded-sm" style={{ background: group.color + '20', borderColor: group.color }}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(group.id)}
                    onChange={(e) => setSelectedCategories(e.target.checked ? [...selectedCategories, group.id] : selectedCategories.filter((c) => c !== group.id))}
                    className="accent-cyan"
                  />
                  <span style={{ color: group.color }}>{group.icon}</span>
                  <span>{group.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-line text-ink-dim">
                <input
                  type="checkbox"
                  checked={showFaultMarkers}
                  onChange={(e) => setShowFaultMarkers(e.target.checked)}
                  className="accent-cyan"
                />
                <span className="text-fault">🚨 Faults</span>
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {charts.map((chart) => (
              <div key={chart.id} className="panel rounded-sm">
                <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: chart.color }}>{chart.icon}</span>
                    <span className="label" style={{ color: chart.color }}>{chart.label}</span>
                    <span className="mono text-[10px] text-ink-dim">{chart.sensors.length} sensors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                        className="accent-cyan"
                      />
                      <span className="text-[10px] text-ink-dim">Log Scale</span>
                    </label>
                  </div>
                </div>
                <div style={{ height: 220 }}>
                  <Chart
                    config={chart.config}
                    data={chartData}
                    faults={showFaultMarkers ? require('@/store/assemblyStore').useAssemblyStore.getState().faults : []}
                    height={220}
                    onCursor={setCursorData}
                  />
                </div>
                {cursorData && chart.config.sensors.length > 0 && (
                  <div className="border-t border-line-soft px-3 py-1 grid grid-cols-4 gap-2 text-xs">
                    <div>Time: {new Date(cursorData.t * 1000).toLocaleTimeString()}</div>
                    {chart.config.sensors.map((sensorId: string) => (
                      <div key={sensorId} className="flex justify-between">
                        <span className="text-ink-dim">{sensorId}</span>
                        <span className="mono text-cyan">{cursorData[sensorId]?.toFixed(2) ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="absolute left-2 bottom-2 flex gap-1">
            <button className="btn" title="Export CSV">
              Export CSV
            </button>
            <button className="btn" title="Export PNG">
              Export PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}