import { useAssemblyStore } from '@/store/assemblyStore';
import type { VirtualSensor } from '@/types';

interface Props {
  sensors: VirtualSensor[];
  readings: Record<string, number>;
}

export function SensorReadoutsPanel({ sensors, readings }: Props) {
  const components = useAssemblyStore((s) => s.components);

  const sensorsWithReadings = sensors.map(sensor => ({
    ...sensor,
    reading: readings[sensor.id] ?? null,
    component: components.find(c => c.id === sensor.componentId),
  }));

  if (sensorsWithReadings.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-line-soft px-3 py-2">
          <span className="label">Sensor Readouts</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-ink-dim text-xs">
          No sensors placed yet. Go to Sensor Mapping to add sensors.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line-soft px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="label">Sensor Readouts</span>
          <span className="mono text-[10px] text-ink-faint">{sensorsWithReadings.length} sensors</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sensorsWithReadings.map((sensor) => {
          const def = require('@/sensors/sensorDefinitions').SENSOR_DEFINITIONS[sensor.definition.type];
          const reading = sensor.reading;
          const quality = reading !== null ? 'good' : 'offline';

          return (
            <div key={sensor.id} className="p-2 rounded-sm border border-line bg-obsidian/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: def.color }}>{def.icon}</span>
                  <span className="font-medium">{sensor.id}</span>
                  <span className="mono text-[10px] text-ink-dim">({def.unit})</span>
                </div>
                <span className={`mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                  quality === 'good' ? 'bg-ok/20 text-ok' : 'bg-fault/20 text-fault'
                }`}>
                  {quality === 'good' ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-ink-dim">Component</div>
                  <div className="font-medium truncate">{sensor.component?.name || sensor.componentId}</div>
                </div>
                <div>
                  <div className="text-ink-dim">Status</div>
                  <div className="font-medium">
                    {sensor.locked ? 'Locked' : sensor.visible ? 'Visible' : 'Hidden'}
                  </div>
                </div>
              </div>

              <div className="mt-1">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-ink-dim">Reading</span>
                  <span className="mono text-lg font-mono text-cyan">
                    {reading !== null ? reading.toFixed(2) : '—'}
                    <span className="text-xs text-ink-dim ml-1">{def.unit}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-obsidian/50 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-cyan transition-all duration-300"
                    style={{ 
                      width: reading !== null ? `${Math.min(100, Math.max(0, (reading + def.defaultRange[0]) / (def.defaultRange[1] - def.defaultRange[0]) * 100))}%` : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}